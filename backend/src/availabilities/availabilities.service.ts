import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { Availability } from './entities/availability.entity';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { DoctorsService } from '../doctors/doctors.service';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class AvailabilitiesService {
  constructor(
    @InjectRepository(Availability)
    private readonly availabilitiesRepository: Repository<Availability>,
    private readonly doctorsService: DoctorsService,
  ) {}

  async create(
    doctorId: string,
    dto: CreateAvailabilityDto,
    currentUser: AuthenticatedUser,
  ): Promise<Availability> {
    const doctor = await this.doctorsService.findOneOrFail(doctorId);
    this.doctorsService.assertCanManage(doctor, currentUser);

    if (dto.endTime <= dto.startTime) {
      throw new BadRequestException('endTime must be after startTime');
    }

    const overlapping = await this.availabilitiesRepository.findOne({
      where: {
        doctor: { id: doctor.id },
        startTime: LessThan(dto.endTime),
        endTime: MoreThan(dto.startTime),
      },
    });

    if (overlapping) {
      throw new ConflictException('This time slot overlaps an existing availability');
    }

    const availability = this.availabilitiesRepository.create({
      doctor,
      startTime: dto.startTime,
      endTime: dto.endTime,
    });

    return this.availabilitiesRepository.save(availability);
  }

  async findByDoctor(doctorId: string): Promise<Availability[]> {
    await this.doctorsService.findOneOrFail(doctorId);

    return this.availabilitiesRepository.find({
      where: { doctor: { id: doctorId } },
      order: { startTime: 'ASC' },
    });
  }

  async findOneOrFail(id: string): Promise<Availability> {
    const availability = await this.availabilitiesRepository.findOne({
      where: { id },
      relations: { doctor: true },
    });

    if (!availability) {
      throw new NotFoundException('Availability not found');
    }

    return availability;
  }

  /**
   * Reserve un creneau de maniere atomique : la condition `isBooked: false` fait partie
   * de la requete UPDATE, ce qui evite toute double reservation concurrente.
   */
  async reserve(id: string): Promise<Availability> {
    const availability = await this.findOneOrFail(id);

    if (availability.startTime.getTime() <= Date.now()) {
      throw new BadRequestException('Cannot book a past time slot');
    }

    const result = await this.availabilitiesRepository.update(
      { id, isBooked: false },
      { isBooked: true },
    );

    if (result.affected === 0) {
      throw new ConflictException('Time slot already booked');
    }

    availability.isBooked = true;

    return availability;
  }

  async release(id: string): Promise<void> {
    await this.availabilitiesRepository.update({ id }, { isBooked: false });
  }

  async remove(id: string, currentUser: AuthenticatedUser): Promise<void> {
    const availability = await this.findOneOrFail(id);
    this.doctorsService.assertCanManage(availability.doctor, currentUser);

    if (availability.isBooked) {
      throw new ConflictException('Cannot delete a booked availability');
    }

    await this.availabilitiesRepository.remove(availability);
  }
}
