import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { AuthenticatedUser } from '../common/types/authenticated-user.interface';
import { BlogService } from './blog.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Roles(Role.ADMIN)
  @Get('admin/all')
  findAllForAdmin() {
    return this.blogService.findAllForAdmin();
  }

  @Roles(Role.ADMIN)
  @Get('admin/:id')
  findOneForAdmin(@Param('id') id: string) {
    return this.blogService.findOneForAdmin(id);
  }

  @Public()
  @Get()
  findPublished() {
    return this.blogService.findPublished();
  }

  @Public()
  @Get(':slug')
  findPublishedBySlug(@Param('slug') slug: string) {
    return this.blogService.findPublishedBySlug(slug);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePostDto) {
    return this.blogService.create(user.id, dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.blogService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.blogService.remove(id);
  }
}
