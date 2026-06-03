import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  identifier!: string; // email or phone

  @IsOptional()
  @IsString()
  password?: string;
}

export class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
