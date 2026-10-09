import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ContentService } from './content.service';
import { UpsertContentDto } from './dto/upsert-content.dto';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Public()
  @Get()
  findAll() {
    return this.contentService.findAll();
  }

  @Roles(Role.ADMIN)
  @Put(':key')
  upsert(@Param('key') key: string, @Body() dto: UpsertContentDto) {
    return this.contentService.upsert(key, dto);
  }
}
