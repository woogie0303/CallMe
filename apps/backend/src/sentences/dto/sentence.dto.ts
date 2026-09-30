import { Type } from 'class-transformer';
import { ToBoolean } from '../../common/to-boolean';
import {
  IsBoolean,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  MaxLength,
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

  @IsOptional()
  @IsBoolean()
  favorite?: boolean;
}

export class CreateThoughtDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  text!: string;
}

export class ListSentencesQuery {
  @IsOptional()
  @IsMongoId()
  bookId?: string;

  /** true면 마음에 든 문장만 — 항목이 딸리지 않은 줄과, 하트를 켠 줄 */
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  liked?: boolean;

  /**
   * 한 번에 받을 줄 수. 안 보내면 기본값이 걸린다 — 예전에는 제한이 없어서
   * 서랍이 독자의 전 기록을 한 응답에 받았고, 오래 쓴 독자에서 가장 먼저
   * 깨질 자리였다.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
