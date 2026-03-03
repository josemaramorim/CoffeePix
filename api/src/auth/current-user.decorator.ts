import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AppUser } from '../types/app-user';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AppUser | undefined => {
    const req = ctx.switchToHttp().getRequest<{ user?: AppUser }>();
    return req.user;
  },
);
