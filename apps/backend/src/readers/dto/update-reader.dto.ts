import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class UpdateReaderDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  nickname?: string;

  /** 책을 한 권 끝낼 때마다 올라간다 */
  @IsOptional()
  @IsInt()
  @Min(0)
  booksFinished?: number;
}
