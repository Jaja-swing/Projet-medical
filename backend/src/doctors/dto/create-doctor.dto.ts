import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDoctorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  speciality: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  licenseNumber: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;
}
