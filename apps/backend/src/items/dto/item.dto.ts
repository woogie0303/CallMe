import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsMongoId,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { REGISTERS, STATUSES, type ItemStatus, type Register } from '../lexical-item.schema';

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

  @IsOptional()
  @IsIn(REGISTERS)
  register?: Register;

  /** 이 표현을 만난 문장 */
  @IsMongoId()
  sentenceId!: string;
}

export class UpdateItemDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  meaning?: string;

  @IsOptional()
  @IsIn(REGISTERS)
  register?: Register;

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
}

export class ListItemsQuery {
  @IsOptional()
  @IsIn(STATUSES)
  status?: ItemStatus;

  /** true면 두 번 이상 만난 것만 — 서랍이 보여주려는 사실이 이것뿐이다 */
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  reencountered?: boolean;
}
