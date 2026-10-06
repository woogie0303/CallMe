import { Type } from 'class-transformer';
import {
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

  /** 문장 하나에 붙은 질문 — 문장 상세 화면이 번역과 후보를 가져올 때 */
  @IsOptional()
  @IsMongoId()
  sentenceId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
