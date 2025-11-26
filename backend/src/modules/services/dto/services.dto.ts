import { IsDateString, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateServiceRequestDto {
  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsObject()
  payload!: Record<string, unknown>;
}

export class UpdateServiceRequestDto {
  @IsString()
  @IsNotEmpty()
  status!: string;

  @IsOptional()
  @IsDateString()
  slaDate?: string;
}
