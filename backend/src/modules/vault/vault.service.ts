import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { PresignVaultUploadDto } from './dto/vault.dto';

@Injectable()
export class VaultService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
  ) {}

  list(userId: string) {
    return this.prisma.vaultDocument.findMany({ where: { ownerId: userId }, orderBy: { createdAt: 'desc' } });
  }

  async presignUpload(dto: PresignVaultUploadDto, userId: string) {
    const presign = await this.filesService.presignUpload(dto.filename, dto.contentType);
    await this.prisma.vaultDocument.create({
      data: {
        ownerId: userId,
        type: dto.type,
        storageKey: presign.key,
        size: dto.size,
        contentType: dto.contentType,
        checksum: dto.checksum || null,
        uploadedBy: dto.uploadedBy || 'user',
      },
    });
    return presign;
  }

  async presignDownload(id: string, userId: string) {
    const doc = await this.prisma.vaultDocument.findFirst({ where: { id, ownerId: userId } });
    if (!doc) return null;
    return this.filesService.presignDownload(doc.storageKey);
  }
}
