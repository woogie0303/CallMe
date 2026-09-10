import { IsMongoId, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateRetellDto {
  @IsMongoId()
  bookId!: string;

  /** 'Chapter 12'처럼 내가 부르는 이름. 형식을 강제하지 않는다. */
  @IsString()
  @MinLength(1)
  chapter!: string;

  /** 제 말로 옮겨 적은 줄거리 */
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  draft!: string;
}

export class ListRetellsQuery {
  @IsOptional()
  @IsMongoId()
  bookId?: string;
}
