import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { AvailabilitiesService } from '../availabilities/availabilities.service';
import { UsersService } from '../users/users.service';
import { AppointmentStatus } from '../common/enums/appointment-status.enum';
import { Role } from '../common/enums/role.enum';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { DoctorsService } from 'src/doctors/doctors.service';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
    private readonly availabilitiesService: AvailabilitiesService,
    private readonly usersService: UsersService,
    private readonly doctorsService : DoctorsService
  ) {}

  async create(currentUser: AuthenticatedUser, dto: CreateAppointmentDto): Promise<Appointment> {
    const patient = await this.usersService.findByIdOrFail(currentUser.id);
    const availability = await this.availabilitiesService.reserve(dto.availabilityId);

    const appointment = this.appointmentsRepository.create({
      patient,
      doctor: availability.doctor,
      availability,
      scheduledAt: availability.startTime,
      status: AppointmentStatus.PENDING,
      reason: dto.reason ?? null,
    });

    try {
      return await this.appointmentsRepository.save(appointment);
    } catch (error) {
      // Le creneau a ete reserve avant l'echec : il doit redevenir disponible.
      await this.availabilitiesService.release(availability.id);
      throw error;
    }
  }

  findMine(patientId: string): Promise<Appointment[]> {
    const res = this.appointmentsRepository.find({
      where: { patient: { id: patientId } },
      order: { scheduledAt: 'DESC' },
    });

   
    return res
  }

 async  findDoctor(userId: string): Promise<Appointment[]> {
    const doctor =  await this.doctorsService.findOneOrFailByUserId(userId)
    const res = this.appointmentsRepository.find({
      where: {doctor: { id: doctor.id} },
      order: {scheduledAt:'DESC' },
    });
 
    return res
  }



  async findOne(id: string, currentUser: AuthenticatedUser): Promise<Appointment> {
    const appointment = await this.findOneOrFail(id);
    this.assertCanAccess(appointment, currentUser);

    return appointment;
  }

  async reschedule(
    id: string,
    dto: RescheduleAppointmentDto,
    currentUser: AuthenticatedUser,
  ): Promise<Appointment> {
    const appointment = await this.findOneOrFail(id);
    this.assertIsPatientOrAdmin(appointment, currentUser);

    if (appointment.status !== AppointmentStatus.PENDING &&
        appointment.status !== AppointmentStatus.CONFIRMED) {
      throw new BadRequestException(
        `Cannot reschedule an appointment with status ${appointment.status}`,
      );
    }

    const previousAvailabilityId = appointment.availability?.id;

    if (previousAvailabilityId === dto.availabilityId) {
      throw new ConflictException('Appointment is already scheduled on this time slot');
    }

    const newAvailability = await this.availabilitiesService.reserve(dto.availabilityId);

    appointment.availability = newAvailability;
    appointment.doctor = newAvailability.doctor;
    appointment.scheduledAt = newAvailability.startTime;
    appointment.status = AppointmentStatus.PENDING;

    const rescheduled = await this.appointmentsRepository.save(appointment);

    if (previousAvailabilityId) {
      await this.availabilitiesService.release(previousAvailabilityId);
    }

    return rescheduled;
  }

  async cancel(id: string, currentUser: AuthenticatedUser): Promise<Appointment> {
    const appointment = await this.findOneOrFail(id);
    this.assertCanAccess(appointment, currentUser);

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new ConflictException('Appointment is already cancelled');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed appointment');
    }

    const releasedAvailabilityId = appointment.availability?.id;

    appointment.status = AppointmentStatus.CANCELLED;
    appointment.availability = null;

    const cancelled = await this.appointmentsRepository.save(appointment);

    if (releasedAvailabilityId) {
      await this.availabilitiesService.release(releasedAvailabilityId);
    }

    return cancelled;
  }

  async remove(id: string): Promise<void> {
    const appointment = await this.findOneOrFail(id);
    const releasedAvailabilityId = appointment.availability?.id;

    await this.appointmentsRepository.remove(appointment);

    if (releasedAvailabilityId) {
      await this.availabilitiesService.release(releasedAvailabilityId);
    }
  }

  private async findOneOrFail(id: string): Promise<Appointment> {
    const appointment = await this.appointmentsRepository.findOne({ where: { id } });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  /** Patient concerne, medecin concerne ou administrateur. */
  private assertCanAccess(appointment: Appointment, currentUser: AuthenticatedUser): void {
    const isOwner = appointment.patient.id === currentUser.id;
    const isAssignedDoctor = appointment.doctor.user.id === currentUser.id;

    if (currentUser.role !== Role.ADMIN && !isOwner && !isAssignedDoctor) {
      throw new ForbiddenException('You cannot access this appointment');
    }
  }

  private assertIsPatientOrAdmin(appointment: Appointment, currentUser: AuthenticatedUser): void {
    if (currentUser.role !== Role.ADMIN && appointment.patient.id !== currentUser.id) {
      throw new ForbiddenException('Only the patient can reschedule this appointment');
    }
  }
}
