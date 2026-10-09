import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { PhotosModule } from './photos/photos.module';

@Module({
  imports: [PhotosModule],
  controllers: [ContentController],
  providers: [ContentService],
})
export class ContentModule {}
