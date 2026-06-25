import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { diskStorage } from 'multer';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';
import { PhotosService } from './photos.service';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

@Controller('photos')
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Public()
  @Get()
  findAll() {
    return this.photosService.findAll();
  }

  @Roles(Role.ADMIN)
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, callback) => {
          callback(null, `${randomUUID()}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          callback(new BadRequestException('Unsupported image type'), false);
          return;
        }
        callback(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  create(@UploadedFile() file: Express.Multer.File, @Body() dto: CreatePhotoDto) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    return this.photosService.create(dto, file);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePhotoDto) {
    return this.photosService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.photosService.remove(id);
  }
}
