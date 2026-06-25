import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { AuthenticatedUser } from '../types/authenticated-user.interface';

/**
 * Extracts the authenticated user attached to the request by JwtStrategy.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
