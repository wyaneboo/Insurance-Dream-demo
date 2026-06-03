import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtSignOptions } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.identifier }, { phone: dto.identifier }],
      },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (user.hashedPassword) {
      if (!dto.password) throw new UnauthorizedException('Invalid credentials');
      const ok = await bcrypt.compare(dto.password, user.hashedPassword);
      if (!ok) throw new UnauthorizedException('Invalid credentials');
    }
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      role: user.role,
    });
    const refreshToken = await this.issueRefreshToken(user.id);
    return { accessToken, refreshToken, user: { id: user.id, role: user.role, name: user.name } };
  }

  async issueRefreshToken(userId: string) {
    const refreshTtl = this.config.get<string>('jwt.refreshTtl') ?? '7d';
    const token = await this.jwt.signAsync(
      { sub: userId, type: 'refresh' },
      {
        secret: this.config.get<string>('jwt.secret') ?? 'devsecret',
        expiresIn: refreshTtl as JwtSignOptions['expiresIn'],
      },
    );
    await this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt: new Date(Date.now() + this.parseTtl(refreshTtl)),
      },
    });
    return token;
  }

  async refresh(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored) throw new UnauthorizedException('Invalid token');
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(stored.token, {
        secret: this.config.get<string>('jwt.secret') ?? 'devsecret',
      });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub }, select: { role: true } });
      if (!user) throw new UnauthorizedException('Invalid token');
      const accessToken = await this.jwt.signAsync({
        sub: payload.sub,
        role: user.role,
      });
      return { accessToken };
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private parseTtl(ttl: string): number {
    const match = /^(\d+)([smhd])$/.exec(ttl);
    if (!match) return 0;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return value * (multipliers[unit] || 0);
  }
}
