import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { Role } from '../../common/enums/role.enum';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../types/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService, private prisma: PrismaService) {
    super({
      jwtFromRequest: (req: Request) => req?.cookies?.['access_token'] ?? null,
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException();
    }

    return { id: user.id, email: user.email, name: user.name, role: user.role as Role };
  }
}
