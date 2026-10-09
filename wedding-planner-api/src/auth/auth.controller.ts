import { Body, Controller, Get, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { toPublicUser } from '../common/utils/public-user.util';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const REFRESH_COOKIE = 'refresh_token';
const ACCESS_COOKIE = 'access_token';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.register(dto);
    const tokens = await this.authService.issueTokens(user);
    this.authService.setAuthCookies(res, tokens);
    return { user: toPublicUser(user) };
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.validateUser(dto);
    const tokens = await this.authService.issueTokens(user);
    this.authService.setAuthCookies(res, tokens);
    return { user: toPublicUser(user) };
  }

  @Public()
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawToken = req.cookies?.[REFRESH_COOKIE];
    if (!rawToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const { user, tokens } = await this.authService.refreshTokens(rawToken);
    this.authService.setAuthCookies(res, tokens);
    return { user: toPublicUser(user) };
  }

  @Public()
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawToken = req.cookies?.[REFRESH_COOKIE];
    if (rawToken) {
      await this.authService.revokeRefreshToken(rawToken);
    }

    this.authService.clearAuthCookies(res);
    return { success: true };
  }

  @Public()
  @Get('me')
  async me(@Req() req: Request) {
    const user = await this.authService.getUserFromAccessToken(req.cookies?.[ACCESS_COOKIE]);
    return { user: user ? toPublicUser(user) : null };
  }
}
