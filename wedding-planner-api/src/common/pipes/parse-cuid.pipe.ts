import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

/**
 * Validates that a route param looks like a Prisma CUID (the id format used by
 * all models via `@default(cuid())`). NestJS's built-in ParseUUIDPipe must NOT
 * be used here because these ids are CUIDs, not UUIDs. Rejecting malformed ids
 * early returns a clean 400 instead of letting junk reach the database layer.
 */
@Injectable()
export class ParseCuidPipe implements PipeTransform<string, string> {
  // CUID v1: starts with 'c', followed by 24 lowercase base36 chars.
  private static readonly CUID_PATTERN = /^c[a-z0-9]{24}$/;

  transform(value: string): string {
    if (typeof value !== 'string' || !ParseCuidPipe.CUID_PATTERN.test(value)) {
      throw new BadRequestException('Invalid id format');
    }
    return value;
  }
}
