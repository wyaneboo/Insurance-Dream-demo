import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../shared/roles.guard';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto/appointments.dto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  list(@Req() req: any) {
    return this.appointmentsService.listForUser(req.user.userId, req.user.role);
  }

  @Post()
  create(@Body() dto: CreateAppointmentDto, @Req() req: any) {
    return this.appointmentsService.create(dto, req.user.userId, req.user.role);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto, @Req() req: any) {
    return this.appointmentsService.update(id, dto, req.user.role, req.user.userId);
  }
}
