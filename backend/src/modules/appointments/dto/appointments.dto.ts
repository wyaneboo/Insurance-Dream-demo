import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  @IsNotEmpty()
  agentId!: string;

  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @IsDateString()
  start!: string;

  @IsDateString()
  end!: string;

  @IsString()
  @IsNotEmpty()
  channel!: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateAppointmentDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  start?: string;

  @IsOptional()
  @IsDateString()
  end?: string;

  @IsOptional()
  @IsString()
  channel?: string;
}
