import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  findPublished() {
    return this.prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
    });
  }

  findAllForAdmin() {
    return this.prisma.blogPost.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findOneForAdmin(id: string) {
    return this.findOneOrThrow(id);
  }

  async findPublishedBySlug(slug: string) {
    const post = await this.prisma.blogPost.findUnique({ where: { slug } });
    if (!post || !post.published) {
      throw new NotFoundException('Blog post not found');
    }
    return post;
  }

  async create(authorId: string, dto: CreatePostDto) {
    await this.assertSlugAvailable(dto.slug);
    return this.prisma.blogPost.create({
      data: {
        slug: dto.slug,
        title: dto.title,
        excerpt: dto.excerpt,
        content: dto.content,
        coverImage: dto.coverImage,
        published: dto.published ?? false,
        publishedAt: dto.published ? new Date() : null,
        authorId,
      },
    });
  }

  async update(id: string, dto: UpdatePostDto) {
    const existing = await this.findOneOrThrow(id);

    if (dto.slug && dto.slug !== existing.slug) {
      await this.assertSlugAvailable(dto.slug);
    }

    const wasPublished = existing.published;
    const willBePublished = dto.published ?? wasPublished;

    return this.prisma.blogPost.update({
      where: { id },
      data: {
        slug: dto.slug,
        title: dto.title,
        excerpt: dto.excerpt,
        content: dto.content,
        coverImage: dto.coverImage,
        published: dto.published,
        publishedAt: !wasPublished && willBePublished ? new Date() : existing.publishedAt,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOneOrThrow(id);
    await this.prisma.blogPost.delete({ where: { id } });
  }

  private async findOneOrThrow(id: string) {
    const post = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!post) {
      throw new NotFoundException('Blog post not found');
    }
    return post;
  }

  private async assertSlugAvailable(slug: string): Promise<void> {
    const existing = await this.prisma.blogPost.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException('A post with this slug already exists');
    }
  }
}
