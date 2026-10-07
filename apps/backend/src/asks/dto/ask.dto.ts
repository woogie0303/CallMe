import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ASK_STATUSES, type AskStatus } from '../ask.schema';

/** 한 번에 물을 수 있는 문장 수 — 앱도 같은 수에서 고르기를 막는다 */
export const MAX_SENTENCES = 5;
/** 한 문장에서 고를 수 있는 표현 수. 넘치면 답이 길어지고(출력 토큰이 비싸다) 서랍이 찬다. */
export const MAX_PICKS = 8;
/** 고른 표현 하나의 길이 — 구(句)를 고르는 것이지 문단을 고르는 것이 아니다. 앱도 같은 수에서 막는다. */
export const MAX_PICK_CHARS = 120;
/** 문장 하나의 길이 */
export const MAX_SENTENCE_CHARS = 1000;

/** 물을 문장 하나와, 독자가 그 안에서 고른 표현들(문장에 적힌 꼴 그대로) */
export class AskSentenceDto {
  @IsString({ message: '문장이 올바르지 않아요.' })
  @MinLength(1, { message: '문장이 비어 있어요.' })
  @MaxLength(MAX_SENTENCE_CHARS, {
    message: `문장은 ${MAX_SENTENCE_CHARS.toLocaleString('ko-KR')}자까지만 받아요. 줄여서 고쳐 주세요.`,
  })
  text!: string;

  @IsArray({ message: '고른 표현이 올바르지 않아요.' })
  @ArrayMinSize(1, { message: '모르는 표현을 하나 이상 골라 주세요.' })
  @ArrayMaxSize(MAX_PICKS, {
    message: `한 문장에서 표현은 ${MAX_PICKS}개까지 고를 수 있어요.`,
  })
  @IsString({ each: true, message: '고른 표현이 올바르지 않아요.' })
  @MinLength(1, { each: true, message: '고른 표현이 비어 있어요.' })
  @MaxLength(MAX_PICK_CHARS, {
    each: true,
    message: `표현은 ${MAX_PICK_CHARS}자까지만 고를 수 있어요. 더 짧게 골라 주세요.`,
  })
  picks!: string[];
}

/**
 * 묻기. 독자가 **모르는 표현을 골라서** 문장째로 묻는다 — 표현만 떼어 보내지
 * 않는다(ADR-0001). 무엇을 물을지는 독자가 정하고, 모델은 그 표현들의 사전 꼴과
 * 그 문장에서의 뜻을 채운다.
 *
 * - `{ bookId, page, sentences }` — 방금 옮겨 적은 문장들. 한 쪽에서 여러 문장을
 *   한 번에 묻고, 이번 달 몫은 한 번만 쓴다.
 * - `{ sentenceId, picks }` — 이미 담아둔 문장을 나중에 묻는다. 그 문장을 그대로
 *   쓰고 새로 만들지 않는다 — 없으면 같은 글이 두 줄이 된다(ADR-0004).
 */
export class CreateAskDto {
  /** 담아둔 문장을 물을 때. 이게 오면 책과 쪽수는 그 문장에서 온다. */
  @IsOptional()
  @IsMongoId()
  sentenceId?: string;

  @ValidateIf((dto: CreateAskDto) => Boolean(dto.sentenceId))
  @IsArray({ message: '고른 표현이 올바르지 않아요.' })
  @ArrayMinSize(1, { message: '모르는 표현을 하나 이상 골라 주세요.' })
  @ArrayMaxSize(MAX_PICKS, {
    message: `한 문장에서 표현은 ${MAX_PICKS}개까지 고를 수 있어요.`,
  })
  @IsString({ each: true, message: '고른 표현이 올바르지 않아요.' })
  @MinLength(1, { each: true, message: '고른 표현이 비어 있어요.' })
  @MaxLength(MAX_PICK_CHARS, {
    each: true,
    message: `표현은 ${MAX_PICK_CHARS}자까지만 고를 수 있어요. 더 짧게 골라 주세요.`,
  })
  picks?: string[];

  @ValidateIf((dto: CreateAskDto) => !dto.sentenceId)
  @IsMongoId({ message: '책을 찾지 못했어요.' })
  bookId?: string;

  @ValidateIf((dto: CreateAskDto) => !dto.sentenceId)
  @IsArray({ message: '문장이 올바르지 않아요.' })
  @ArrayMinSize(1, { message: '물어볼 문장을 골라 주세요.' })
  @ArrayMaxSize(MAX_SENTENCES, {
    message: `한 번에 ${MAX_SENTENCES}문장까지 물을 수 있어요.`,
  })
  @ValidateNested({ each: true })
  @Type(() => AskSentenceDto)
  sentences?: AskSentenceDto[];

  @IsOptional()
  @IsInt({ message: '쪽수는 숫자로 적어 주세요.' })
  @Min(1, { message: '쪽수는 1 이상이어야 해요.' })
  page?: number;
}

export class ListAsksQuery {
  @IsOptional()
  @IsIn(ASK_STATUSES)
  status?: AskStatus;

  /** 문장 하나에 붙은 질문 — 문장 상세 화면이 번역을 가져올 때 */
  @IsOptional()
  @IsMongoId()
  sentenceId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
