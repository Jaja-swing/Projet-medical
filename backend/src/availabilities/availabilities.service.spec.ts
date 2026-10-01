import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AvailabilitiesService } from './availabilities.service';
import { Availability } from './entities/availability.entity';
import { DoctorsService } from '../doctors/doctors.service';
import { Doctor } from '../doctors/entities/doctor.entity';
import { Role } from '../common/enums/role.enum';

describe('AvailabilitiesService', () => {
  const repository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((data: unknown) => data),
    save: jest.fn((data: unknown) => Promise.resolve(data)),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const doctorsService = {
    findOneOrFail: jest.fn(),
    assertCanManage: jest.fn(),
  };

  const doctor = { id: 'doctor-1', user: { id: 'user-doc' } } as Doctor;
  const owner = { id: 'user-doc', email: 'doc@test.io', role: Role.MEDECIN };

  const inTwoDays = (hour: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    date.setHours(hour, 0, 0, 0);
    return date;
  };

  let service: AvailabilitiesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    doctorsService.findOneOrFail.mockResolvedValue(doctor);

    const moduleRef = await Test.createTestingModule({
      providers: [
        AvailabilitiesService,
        { provide: getRepositoryToken(Availability), useValue: repository },
        { provide: DoctorsService, useValue: doctorsService },
      ],
    }).compile();

    service = moduleRef.get(AvailabilitiesService);
  });

  describe('create', () => {
    it('rejects a slot ending before it starts', async () => {
      const dto = { startTime: inTwoDays(10), endTime: inTwoDays(9) };

      await expect(service.create('doctor-1', dto, owner)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('rejects a slot overlapping an existing one', async () => {
      repository.findOne.mockResolvedValue({ id: 'availability-existing' });

      await expect(
        service.create('doctor-1', { startTime: inTwoDays(9), endTime: inTwoDays(10) }, owner),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('saves a valid slot for the doctor', async () => {
      repository.findOne.mockResolvedValue(null);
      const dto = { startTime: inTwoDays(9), endTime: inTwoDays(10) };

      await service.create('doctor-1', dto, owner);

      expect(doctorsService.assertCanManage).toHaveBeenCalledWith(doctor, owner);
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ doctor, startTime: dto.startTime, endTime: dto.endTime }),
      );
    });
  });

  describe('reserve', () => {
    it('rejects a slot already booked by a concurrent request', async () => {
      repository.findOne.mockResolvedValue({ id: 'availability-1', startTime: inTwoDays(9) });
      repository.update.mockResolvedValue({ affected: 0 });

      await expect(service.reserve('availability-1')).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects a slot in the past', async () => {
      repository.findOne.mockResolvedValue({ id: 'availability-1', startTime: new Date(2020, 0, 1) });

      await expect(service.reserve('availability-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('books the slot with a conditional update', async () => {
      repository.findOne.mockResolvedValue({ id: 'availability-1', startTime: inTwoDays(9) });
      repository.update.mockResolvedValue({ affected: 1 });

      const reserved = await service.reserve('availability-1');

      expect(repository.update).toHaveBeenCalledWith(
        { id: 'availability-1', isBooked: false },
        { isBooked: true },
      );
      expect(reserved.isBooked).toBe(true);
    });

    it('reports an unknown slot', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.reserve('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('refuses to delete a booked slot', async () => {
      repository.findOne.mockResolvedValue({ id: 'availability-1', isBooked: true, doctor });

      await expect(service.remove('availability-1', owner)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(repository.remove).not.toHaveBeenCalled();
    });

    it('deletes a free slot', async () => {
      const availability = { id: 'availability-1', isBooked: false, doctor };
      repository.findOne.mockResolvedValue(availability);

      await service.remove('availability-1', owner);

      expect(doctorsService.assertCanManage).toHaveBeenCalledWith(doctor, owner);
      expect(repository.remove).toHaveBeenCalledWith(availability);
    });
  });
});
