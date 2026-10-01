import { Test } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums/role.enum';

describe('AuthService', () => {
  const usersService = {
    findByEmail: jest.fn(),
    findByEmailWithPassword: jest.fn(),
    create: jest.fn(),
  };
  const jwtService = { sign: jest.fn().mockReturnValue('signed.jwt.token') };

  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  const registerDto = {
    email: 'patient@test.io',
    password: 'Password123',
    firstName: 'Ana',
    lastName: 'Rakoto',
  };

  describe('register', () => {
    it('hashes the password and never returns it', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockImplementation((data: Partial<User>) =>
        Promise.resolve({ id: 'user-1', role: Role.PATIENT, ...data } as User),
      );

      const result = await service.register(registerDto);

      const created = usersService.create.mock.calls[0][0] as { password: string };
      expect(created.password).not.toBe(registerDto.password);
      expect(await bcrypt.compare(registerDto.password, created.password)).toBe(true);
      expect(bcrypt.getRounds(created.password)).toBeGreaterThanOrEqual(10);
      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.user).not.toHaveProperty('password');
    });

    it('defaults the role to PATIENT', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({ id: 'user-1', ...registerDto, role: Role.PATIENT });

      await service.register(registerDto);

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: Role.PATIENT }),
      );
    });

    it('rejects an email already registered', async () => {
      usersService.findByEmail.mockResolvedValue({ id: 'user-1' });

      await expect(service.register(registerDto)).rejects.toBeInstanceOf(ConflictException);
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns a token for valid credentials', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue({
        id: 'user-1',
        email: registerDto.email,
        password: await bcrypt.hash(registerDto.password, 10),
        firstName: 'Ana',
        lastName: 'Rakoto',
        role: Role.PATIENT,
      });

      const result = await service.login({
        email: registerDto.email,
        password: registerDto.password,
      });

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: registerDto.email,
        role: Role.PATIENT,
      });
    });

    it('rejects a wrong password', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue({
        id: 'user-1',
        password: await bcrypt.hash('another-password', 10),
        role: Role.PATIENT,
      });

      await expect(
        service.login({ email: registerDto.email, password: registerDto.password }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects an unknown email', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);

      await expect(
        service.login({ email: 'ghost@test.io', password: 'Password123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
