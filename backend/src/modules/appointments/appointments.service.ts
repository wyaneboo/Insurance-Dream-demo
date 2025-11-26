import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto/appointments.dto';

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  listForUser(userId: string, role: string) {
    if (role === 'AGENT') {
      return this.prisma.appointment.findMany({ where: { agentId: userId }, orderBy: { start: 'desc' } });
    }
    return this.prisma.appointment.findMany({ where: { customerId: userId }, orderBy: { start: 'desc' } });
  }

  create(dto: CreateAppointmentDto, userId: string, role: string) {
    const agentId = role === 'AGENT' ? userId : dto.agentId;
    const customerId = role === 'CUSTOMER' ? userId : dto.customerId;
    return this.prisma.appointment.create({
      data: {
        agentId,
        customerId,
        start: new Date(dto.start),
        end: new Date(dto.end),
        channel: dto.channel,
        status: dto.status || 'scheduled',
      },
    });
  }

  update(id: string, dto: UpdateAppointmentDto, role: string, userId: string) {
    const where = role === 'AGENT' ? { id, agentId: userId } : role === 'CUSTOMER' ? { id, customerId: userId } : { id };
    return this.prisma.appointment.updateMany({
      where,
      data: {
        status: dto.status,
        start: dto.start ? new Date(dto.start) : undefined,
        end: dto.end ? new Date(dto.end) : undefined,
        channel: dto.channel || undefined,
      },
    });
  }
}
