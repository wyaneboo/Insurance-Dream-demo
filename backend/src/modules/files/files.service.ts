import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class FilesService {
  private s3: S3Client;
  private bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>('s3.bucket')!;
    this.s3 = new S3Client({
      endpoint: this.config.get<string>('s3.endpoint'),
      region: this.config.get<string>('s3.region'),
      forcePathStyle: true,
      credentials: {
        accessKeyId: this.config.get<string>('s3.accessKey')!,
        secretAccessKey: this.config.get<string>('s3.secretKey')!,
      },
    });
  }

  async presignUpload(filename: string, contentType: string) {
    const key = `uploads/${randomUUID()}-${filename}`;
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      });
      const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 900 });
      return { key, uploadUrl, contentType };
    } catch (err) {
      throw new InternalServerErrorException('Failed to generate upload URL');
    }
  }

  async presignDownload(key: string) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      const downloadUrl = await getSignedUrl(this.s3, command, { expiresIn: 900 });
      return { downloadUrl };
    } catch (err) {
      throw new InternalServerErrorException('Failed to generate download URL');
    }
  }
}
