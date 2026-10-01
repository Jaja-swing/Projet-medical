import { IsUUID } from 'class-validator';

export class RescheduleAppointmentDto {
  @IsUUID('4', { message: 'availabilityId must be a valid UUID' })
  availabilityId: string;
}
