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
  ValidateIf,
} from 'class-validator';
import { ASK_STATUSES, type AskStatus } from '../ask.schema';

/**
 * 문장을 통째로 묻는다. 표제형이나 낱말을 보내지 않는다 — 무엇을 외워둘지
 * 고르는 일은 모델이 문장을 읽고 하는 일이다.
 *
 * 이미 담아둔 문장을 나중에 물을 때는 `sentenceId`를 보낸다. 그러면 그 문장을
 * 그대로 쓰고 새로 만들지 않는다 — 없으면 같은 글이 두 줄이 되고, 원본은 영영
 * 아무것도 딸리지 않은 채 남는다(ADR-0004).
 */
export class CreateAskDto {
  /** 담아둔 문장을 물을 때. 이게 오면 `bookId`·`text`·`page`는 그 문장에서 온다. */
  @IsOptional()
  @IsMongoId()
  sentenceId?: string;

  @ValidateIf((dto: CreateAskDto) => !dto.sentenceId)
  @IsMongoId()
  bookId?: string;

  @ValidateIf((dto: CreateAskDto) => !dto.sentenceId)
  @IsString()
  @MinLength(1)
  text?: string;

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
