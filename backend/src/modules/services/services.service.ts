import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceRequestDto, UpdateServiceRequestDto } from './dto/services.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.serviceRequest.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  create(dto: CreateServiceRequestDto, userId: string) {
    return this.prisma.serviceRequest.create({
      data: {
        userId,
        type: dto.type,
        payload: dto.payload as Prisma.InputJsonValue,
        status: 'open',
      },
    });
  }

  updateStatus(id: string, dto: UpdateServiceRequestDto) {
    return this.prisma.serviceRequest.update({
      where: { id },
      data: { status: dto.status, slaDate: dto.slaDate || null },
    });
  }
}
