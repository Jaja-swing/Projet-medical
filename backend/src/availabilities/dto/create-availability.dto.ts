import { Type } from 'class-transformer';
import { IsDate } from 'class-validator';

export class CreateAvailabilityDto {
  @Type(() => Date)
  @IsDate({ message: 'startTime must be a valid ISO 8601 date' })
  startTime: Date;

  @Type(() => Date)
  @IsDate({ message: 'endTime must be a valid ISO 8601 date' })
  endTime: Date;
}
