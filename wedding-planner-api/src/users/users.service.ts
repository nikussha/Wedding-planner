import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toPublicUser } from '../common/utils/public-user.util';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
    return users.map(toPublicUser);
  }

  async updateRole(id: string, dto: UpdateUserRoleDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('User not found');
    }
    const updated = await this.prisma.user.update({ where: { id }, data: { role: dto.role } });
    return toPublicUser(updated);
  }
}
