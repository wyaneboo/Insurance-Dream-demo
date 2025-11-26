import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClaimDto, UpdateClaimStatusDto } from './dto/claims.dto';

@Injectable()
export class ClaimsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string, role: string) {
    if (role === 'AGENT') {
      return this.prisma.claim.findMany({
        where: { policy: { agentId: userId } },
        include: { policy: true },
      });
    }
    return this.prisma.claim.findMany({ where: { userId }, include: { policy: true } });
  }

  create(dto: CreateClaimDto, userId: string) {
    return this.prisma.claim.create({
      data: {
        userId,
        policyId: dto.policyId,
        type: dto.type,
        status: 'Submitted',
        requiredDocs: dto.requiredDocs || null,
        submittedDocs: dto.submittedDocs || null,
        submittedAt: new Date(),
      },
    });
  }

  async updateStatus(id: string, dto: UpdateClaimStatusDto, userId: string, role: string) {
    if (role !== 'AGENT' && role !== 'ADMIN') {
      throw new ForbiddenException('Only agents/admins can update claims');
    }
    const claim = await this.prisma.claim.findUnique({ where: { id } });
    if (!claim) throw new NotFoundException('Claim not found');
    return this.prisma.claim.update({
      where: { id },
      data: {
        status: dto.status,
        adjudicatorNotes: dto.notes || claim.adjudicatorNotes,
      },
    });
  }
}
