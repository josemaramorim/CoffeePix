import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { AppUser } from '../types/app-user';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<AppUser | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password_hash))) {
      const roleName =
        typeof (user as any).role === 'string'
          ? (user as any).role
          : ((user as any).role as { name?: string })?.name;

      const result: AppUser = {
        id: (user as any).id,
        email: (user as any).email,
        role: roleName ?? '',
        company_id: (user as any).company_id,
        client_id: (user as any).client_id,
      };

      return result;
    }
    return null;
  }

  login(user: AppUser) {
    const roleName =
      typeof user.role === 'string'
        ? user.role
        : (user.role as { name?: string })?.name;
    const payload = {
      sub: user.id,
      email: user.email,
      role: roleName,
      company_id: user.company_id,
      client_id: user.client_id,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: roleName,
        company_id: user.company_id,
        client_id: user.client_id,
      },
    };
  }
}
