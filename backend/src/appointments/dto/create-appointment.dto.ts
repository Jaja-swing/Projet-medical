import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID('4', { message: 'availabilityId must be a valid UUID' })
  availabilityId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
