import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MinLength,
} from 'class-validator';

export class CreateBookDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @MinLength(1)
  author!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  pages?: number;

  @IsOptional()
  @IsUrl({ require_tld: false })
  cover?: string;

  /** 책등 그라디언트 두 색 */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsString({ each: true })
  spine?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  currentPage?: number;

  @IsOptional()
  @IsDateString()
  startedAt?: string;
}

export class UpdateBookDto extends CreateBookDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  declare title: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  declare author: string;

  @IsOptional()
  @IsDateString()
  lastReadAt?: string;

  /** 다 읽은 날. null을 보내면 '아직 읽는 중'으로 되돌린다. */
  @IsOptional()
  @IsDateString()
  finishedAt?: string | null;
}

export class ListBooksQuery {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  finished?: boolean;
}
