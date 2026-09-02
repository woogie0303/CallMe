import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateSentenceDto {
  @IsMongoId()
  bookId!: string;

  @IsString()
  @MinLength(1)
  text!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateSentenceDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  text?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class ListSentencesQuery {
  @IsOptional()
  @IsMongoId()
  bookId?: string;

  /** true면 어휘 항목이 딸리지 않은 문장만 — 그냥 좋아서 담아둔 줄 */
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  liked?: boolean;
}
