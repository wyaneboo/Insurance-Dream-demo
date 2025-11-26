import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RewardsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.reward.findMany({ where: { OR: [{ expiry: null }, { expiry: { gt: new Date() } }] } });
  }

  async redeem(rewardId: string, userId: string) {
    const reward = await this.prisma.reward.findUnique({ where: { id: rewardId } });
    if (!reward) throw new ForbiddenException('Reward not found');
    return this.prisma.rewardRedemption.create({
      data: {
        rewardId,
        userId,
      },
    });
  }
}
