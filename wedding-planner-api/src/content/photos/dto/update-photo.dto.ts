import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdatePhotoDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  alt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  caption?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;
}
