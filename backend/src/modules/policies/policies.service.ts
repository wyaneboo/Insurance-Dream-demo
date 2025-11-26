import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PoliciesService {
  constructor(private readonly prisma: PrismaService) {}

  listForUser(userId: string, role: string) {
    if (role === 'AGENT') {
      return this.prisma.policy.findMany({ where: { agentId: userId }, include: { documents: true } });
    }
    return this.prisma.policy.findMany({ where: { ownerId: userId }, include: { documents: true } });
  }

  detail(policyId: string, userId: string, role: string) {
    const where = role === 'AGENT' ? { id: policyId, agentId: userId } : { id: policyId, ownerId: userId };
    return this.prisma.policy.findFirst({ where, include: { documents: true, claims: true } });
  }
}
