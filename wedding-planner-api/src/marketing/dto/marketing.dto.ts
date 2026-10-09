import { PartialType } from '@nestjs/mapped-types';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Fields every list item shares. */
class OrderedItemDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class CreateFaqItemDto extends OrderedItemDto {
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  question!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(4000)
  answer!: string;
}

export class UpdateFaqItemDto extends PartialType(CreateFaqItemDto) {}

export class CreateTestimonialDto extends OrderedItemDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  names!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  context?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  quote!: string;
}

export class UpdateTestimonialDto extends PartialType(CreateTestimonialDto) {}

export class CreateProcessStepDto extends OrderedItemDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  body!: string;
}

export class UpdateProcessStepDto extends PartialType(CreateProcessStepDto) {}

export class CreateServiceTierDto extends OrderedItemDto {
  /** Becomes the page anchor, so it must be URL-safe. */
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase words separated by hyphens',
  })
  @MaxLength(60)
  slug!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(600)
  forWho!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  startsAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  investment?: string;

  /** Sent as arrays; stored one item per line. */
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(40)
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  includedBefore!: string[];

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(40)
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  includedOnDay!: string[];

  @IsArray()
  @ArrayMaxSize(40)
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  excluded!: string[];
}

export class UpdateServiceTierDto extends PartialType(CreateServiceTierDto) {}

/** The admin sends the full id list in its new display order. */
export class ReorderDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  ids!: string[];
}
