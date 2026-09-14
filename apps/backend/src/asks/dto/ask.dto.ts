import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { ASK_STATUSES, type AskStatus } from '../ask.schema';

/**
 * 문장을 통째로 묻는다. 표제형이나 낱말을 보내지 않는다 — 무엇을 외워둘지
 * 고르는 일은 모델이 문장을 읽고 하는 일이다.
 */
export class CreateAskDto {
  @IsMongoId()
  bookId!: string;

  @IsString()
  @MinLength(1)
  text!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;
}

export class ListAsksQuery {
  @IsOptional()
  @IsIn(ASK_STATUSES)
  status?: AskStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

/**
 * 글자 인식기가 읽어낸 줄들. 문장으로 잇는 일은 서버가 한다 —
 * 앱에서 정규식으로 자르면 답을 내는 모델과 다르게 자르게 된다.
 */
export class SplitLinesDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(400)
  lines!: string[];
}
