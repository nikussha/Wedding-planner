import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { Response } from 'express';
import { Role } from '../common/enums/role.enum';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './types/jwt-payload.interface';
import { durationToMs } from './utils/duration.util';
import { generateRefreshToken, hashToken } from './utils/tokens.util';

const PASSWORD_SALT_ROUNDS = 10;
const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';
const REFRESH_COOKIE_PATH = '/api/auth';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<User> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS);
    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        role: Role.USER,
      },
    });
  }

  async validateUser(dto: LoginDto): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user;
  }

  async getUserFromAccessToken(token: string | undefined): Promise<User | null> {
    if (!token) {
      return null;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      });
      return this.prisma.user.findUnique({ where: { id: payload.sub } });
    } catch {
      return null;
    }
  }

  async issueTokens(user: User): Promise<TokenPair> {
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, role: user.role as Role } satisfies JwtPayload,
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: Math.floor(durationToMs(this.config.get<string>('JWT_ACCESS_EXPIRES')!) / 1000),
      },
    );

    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + durationToMs(this.config.get<string>('JWT_REFRESH_EXPIRES')!));

    await this.prisma.refreshToken.create({
      data: { tokenHash: hashToken(refreshToken), userId: user.id, expiresAt },
    });

    return { accessToken, refreshToken };
  }

  async refreshTokens(rawToken: string): Promise<{ user: User; tokens: TokenPair }> {
    const tokenHash = hashToken(rawToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.issueTokens(stored.user);
    return { user: stored.user, tokens };
  }

  async revokeRefreshToken(rawToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  setAuthCookies(res: Response, tokens: TokenPair): void {
    const secure = this.config.get<string>('COOKIE_SECURE') === 'true';

    res.cookie(ACCESS_COOKIE, tokens.accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: durationToMs(this.config.get<string>('JWT_ACCESS_EXPIRES')!),
    });

    res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: REFRESH_COOKIE_PATH,
      maxAge: durationToMs(this.config.get<string>('JWT_REFRESH_EXPIRES')!),
    });
  }

  clearAuthCookies(res: Response): void {
    const secure = this.config.get<string>('COOKIE_SECURE') === 'true';

    res.clearCookie(ACCESS_COOKIE, { httpOnly: true, secure, sameSite: 'lax', path: '/' });
    res.clearCookie(REFRESH_COOKIE, { httpOnly: true, secure, sameSite: 'lax', path: REFRESH_COOKIE_PATH });
  }
}
