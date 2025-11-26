import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { VaultService } from './vault.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../shared/roles.guard';
import { PresignVaultUploadDto } from './dto/vault.dto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('vault')
export class VaultController {
  constructor(private readonly vaultService: VaultService) {}

  @Get()
  list(@Req() req: any) {
    return this.vaultService.list(req.user.userId);
  }

  @Post('presign-upload')
  presignUpload(@Body() dto: PresignVaultUploadDto, @Req() req: any) {
    return this.vaultService.presignUpload(dto, req.user.userId);
  }

  @Post(':id/presign-download')
  presignDownload(@Param('id') id: string, @Req() req: any) {
    return this.vaultService.presignDownload(id, req.user.userId);
  }
}
