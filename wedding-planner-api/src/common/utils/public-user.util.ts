import { User } from '@prisma/client';

export type PublicUser = Omit<User, 'passwordHash'>;

/** Strips sensitive fields before a User entity is returned from the API. */
export function toPublicUser(user: User): PublicUser {
  const { passwordHash, ...rest } = user;
  return rest;
}
