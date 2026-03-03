import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class HmacGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const signature = req.headers['x-hmac-signature'];
    // TODO: validate signature using machine hmac_secret (lookup by machine_id)
    if (!signature) {
      throw new UnauthorizedException('Missing HMAC signature');
    }
    // placeholder: accept for now
    return true;
  }
}
