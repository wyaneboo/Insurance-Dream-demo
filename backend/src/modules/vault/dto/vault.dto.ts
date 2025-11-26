import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class PresignVaultUploadDto {
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @IsString()
  @IsNotEmpty()
  contentType!: string;

  @IsInt()
  @Min(1)
  size!: number;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsOptional()
  @IsString()
  checksum?: string;

  @IsOptional()
  @IsString()
  uploadedBy?: string;
}
