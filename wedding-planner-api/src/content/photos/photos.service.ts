import { Injectable, NotFoundException } from '@nestjs/common';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';

@Injectable()
export class PhotosService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.photo.findMany({ orderBy: { order: 'asc' } });
  }

  async create(dto: CreatePhotoDto, file: Express.Multer.File) {
    const count = await this.prisma.photo.count();
    return this.prisma.photo.create({
      data: {
        url: `/uploads/${file.filename}`,
        alt: dto.alt,
        caption: dto.caption,
        order: count,
      },
    });
  }

  async update(id: string, dto: UpdatePhotoDto) {
    await this.findOneOrThrow(id);
    return this.prisma.photo.update({ where: { id }, data: dto });
  }

  async remove(id: string): Promise<void> {
    const photo = await this.findOneOrThrow(id);

    if (photo.url.startsWith('/uploads/')) {
      const filePath = join(process.cwd(), photo.url);
      await unlink(filePath).catch(() => undefined);
    }

    await this.prisma.photo.delete({ where: { id } });
  }

  private async findOneOrThrow(id: string) {
    const photo = await this.prisma.photo.findUnique({ where: { id } });
    if (!photo) {
      throw new NotFoundException('Photo not found');
    }
    return photo;
  }
}
