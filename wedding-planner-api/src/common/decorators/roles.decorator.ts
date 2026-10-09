import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';

/**
 * Restricts a route to users whose role is in the given list.
 * Requires the global JwtAuthGuard to have populated request.user.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
