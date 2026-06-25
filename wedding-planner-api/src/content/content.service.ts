import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertContentDto } from './dto/upsert-content.dto';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Record<string, { title: string | null; body: string | null }>> {
    const entries = await this.prisma.siteContent.findMany();
    return entries.reduce<Record<string, { title: string | null; body: string | null }>>((acc, entry) => {
      acc[entry.key] = { title: entry.title, body: entry.body };
      return acc;
    }, {});
  }

  async upsert(key: string, dto: UpsertContentDto) {
    return this.prisma.siteContent.upsert({
      where: { key },
      update: { title: dto.title, body: dto.body },
      create: { key, title: dto.title, body: dto.body },
    });
  }
}
