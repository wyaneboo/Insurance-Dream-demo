import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../shared/roles.guard';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get()
  list() {
    return this.rewardsService.list();
  }

  @Post(':id/redeem')
  redeem(@Param('id') id: string, @Req() req: any) {
    return this.rewardsService.redeem(id, req.user.userId);
  }
}
