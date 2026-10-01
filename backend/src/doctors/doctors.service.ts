import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Doctor } from './entities/doctor.entity';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { UsersService } from '../users/users.service';
import { Role } from '../common/enums/role.enum';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorsRepository: Repository<Doctor>,
    private readonly usersService: UsersService,
  ) {}

  async create(currentUser: AuthenticatedUser, dto: CreateDoctorDto): Promise<Doctor> {
    const owner = await this.usersService.findByIdOrFail(currentUser.id);

    const existingProfile = await this.doctorsRepository.findOne({
      where: { user: { id: owner.id } },
    });

    if (existingProfile) {
      throw new ConflictException('This user already has a doctor profile');
    }

    await this.assertLicenseNumberIsFree(dto.licenseNumber);

    const doctor = this.doctorsRepository.create({
      user: owner,
      speciality: dto.speciality,
      licenseNumber: dto.licenseNumber,
      bio: dto.bio ?? null,
    });

    return this.doctorsRepository.save(doctor);
  }

  findAll(): Promise<Doctor[]> {
    return this.doctorsRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOneOrFail(id: string): Promise<Doctor> {
    const doctor = await this.doctorsRepository.findOne({ where: { id } });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return doctor;
  }
   async findOneOrFailByUserId(id: string): Promise<Doctor> {
    const doctor = await this.doctorsRepository.findOne({ where: {user:{id }}});

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return doctor;
  }

  async update(id: string, dto: UpdateDoctorDto, currentUser: AuthenticatedUser): Promise<Doctor> {
    const doctor = await this.findOneOrFail(id);
    this.assertCanManage(doctor, currentUser);

    if (dto.licenseNumber && dto.licenseNumber !== doctor.licenseNumber) {
      await this.assertLicenseNumberIsFree(dto.licenseNumber, doctor.id);
    }

    Object.assign(doctor, dto);

    return this.doctorsRepository.save(doctor);
  }

  async remove(id: string, currentUser: AuthenticatedUser): Promise<void> {
    const doctor = await this.findOneOrFail(id);
    this.assertCanManage(doctor, currentUser);

    await this.doctorsRepository.remove(doctor);
  }

  /** Autorise le medecin proprietaire du profil ou un administrateur. */
  assertCanManage(doctor: Doctor, currentUser: AuthenticatedUser): void {
    if (currentUser.role !== Role.ADMIN && doctor.user.id !== currentUser.id) {
      throw new ForbiddenException('You can only manage your own doctor profile');
    }
  }

  private async assertLicenseNumberIsFree(licenseNumber: string, excludedId?: string): Promise<void> {
    const existing = await this.doctorsRepository.findOne({
      where: excludedId ? { licenseNumber, id: Not(excludedId) } : { licenseNumber },
    });

    if (existing) {
      throw new ConflictException('License number already registered');
    }
  }
}
