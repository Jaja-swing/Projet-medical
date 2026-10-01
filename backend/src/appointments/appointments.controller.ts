import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { Appointment } from './entities/appointment.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('appointments')
@ApiBearerAuth()
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'Prendre un rendez-vous sur un creneau disponible' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAppointmentDto,
  ): Promise<Appointment> {
    return this.appointmentsService.create(user, dto);
  }

  @Get('DoctorAppointmentList')
  @Roles(Role.MEDECIN)
  @ApiOperation({ summary: 'Historique de rendez-vouus du docteur connecte'})
  findDoctorAppointment(
    @CurrentUser() user:AuthenticatedUser,
  ): Promise<Appointment[]> {
    return this.appointmentsService.findDoctor(user.id);
  }

  @Get('me')
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'Historique des rendez-vous du patient connecte' })
  findMine(@CurrentUser() user: AuthenticatedUser): Promise<Appointment[]> {
    return this.appointmentsService.findMine(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail d un rendez-vous (patient, medecin concerne ou ADMIN)' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Appointment> {
    return this.appointmentsService.findOne(id, user);
  }

  @Patch(':id/reschedule')
  @ApiOperation({ summary: 'Reprogrammer un rendez-vous sur un autre creneau' })
  reschedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RescheduleAppointmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Appointment> {
    return this.appointmentsService.reschedule(id, dto, user);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Annuler un rendez-vous et liberer le creneau' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Appointment> {
    return this.appointmentsService.cancel(id, user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer definitivement un rendez-vous (ADMIN)' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.appointmentsService.remove(id);
  }
}
