import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AppUser } from '../types/app-user';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super-secret',
    });
  }

  async validate(payload: { sub: string }): Promise<AppUser> {
    const raw = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });

    if (!raw) {
      throw new UnauthorizedException();
    }

    const user = raw as unknown as {
      id: string;
      email: string;
      role: string | { name: string };
      company_id?: string | null;
      client_id?: string | null;
    };

    const roleName =
      typeof user.role === 'string' ? user.role : user.role?.name;

    return {
      id: user.id,
      email: user.email,
      role: roleName,
      company_id: user.company_id,
      client_id: user.client_id,
    } as AppUser;
  }
}
