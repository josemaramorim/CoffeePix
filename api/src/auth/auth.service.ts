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
      const cloned = { ...(user as unknown as Record<string, unknown>) };
      // remove password before returning
      delete (cloned as Record<string, unknown>)['password_hash'];
      return cloned as AppUser;
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
