import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePhotoDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  alt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  caption?: string;
}
