import { Type } from 'class-transformer';
import { ToBoolean } from '../../common/to-boolean';
import {
  IsBoolean,
  IsIn,
  IsMongoId,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  STATUSES,
  type ItemStatus,
} from '../lexical-item.schema';

export class ConfusedWithDto {
  @IsMongoId()
  itemId!: string;

  @IsString()
  @MinLength(1)
  note!: string;
}

/**
 * 표현을 담는다. 이미 있는 표현이면 새로 만들지 않고 이 문장을 만남으로
 * 하나 더 붙인다 — 그 순간이 재회다.
 */
export class SaveItemDto {
  @IsString()
  @MinLength(1)
  term!: string;

  @IsString()
  @MinLength(1)
  meaning!: string;

  /** 이 표현을 만난 문장 */
  @IsMongoId()
  sentenceId!: string;

  /** 그 문장에 있던 꼴. 질문의 후보가 그대로 알려준다 — 지금은 읽는 화면이 없다. */
  @IsOptional()
  @IsString()
  surface?: string;
}

export class UpdateItemDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  meaning?: string;

  @IsOptional()
  @IsIn(STATUSES)
  status?: ItemStatus;

  @IsOptional()
  @ValidateNested()
  @Type(() => ConfusedWithDto)
  confusedWith?: ConfusedWithDto;
}

export class AddEncounterDto {
  @IsMongoId()
  sentenceId!: string;

  @IsOptional()
  @IsString()
  surface?: string;
}

export class ListItemsQuery {
  @IsOptional()
  @IsIn(STATUSES)
  status?: ItemStatus;

  /**
   * 이 책에서 건져 올린 것만. 항목은 책에 속하지 않으므로(여러 책을 건너다니는
   * 것이 항목이다) 그 항목이 만난 문장이 이 책의 것인지를 거쳐서 찾는다.
   */
  @IsOptional()
  @IsMongoId()
  bookId?: string;

  /** true면 두 번 이상 만난 것만 — 서랍이 보여주려는 사실이 이것뿐이다 */
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  reencountered?: boolean;
}
