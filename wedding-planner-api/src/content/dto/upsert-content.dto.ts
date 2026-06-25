import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertContentDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  body?: string;
}
