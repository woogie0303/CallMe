import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class ReadingMonthQuery {
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  /** 1~12 — 자바스크립트 Date와 달리 0부터 세지 않는다 */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;
}
