import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AvailabilitiesService } from './availabilities.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { Availability } from './entities/availability.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('availabilities')
@Controller()
export class AvailabilitiesController {
  constructor(private readonly availabilitiesService: AvailabilitiesService) {}

  @Post('doctors/:doctorId/availabilities')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MEDECIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ajouter un creneau de disponibilite' })
  create(
    @Param('doctorId', ParseUUIDPipe) doctorId: string,
    @Body() dto: CreateAvailabilityDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Availability> {
    return this.availabilitiesService.create(doctorId, dto, user);
  }

  @Get('doctors/:doctorId/availabilities')
  @ApiOperation({ summary: 'Lister les creneaux d un medecin' })
  findByDoctor(@Param('doctorId', ParseUUIDPipe) doctorId: string): Promise<Availability[]> {
    return this.availabilitiesService.findByDoctor(doctorId);
  }

  @Delete('availabilities/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un creneau (proprietaire ou ADMIN)' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.availabilitiesService.remove(id, user);
  }
}
