import { Type } from 'class-transformer';
import { IsInt, IsMongoId, IsOptional, Max, Min } from 'class-validator';

export class QuizSessionQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  size?: number;
}

export class AnswerQuizDto {
  @IsMongoId()
  itemId!: string;

  /** 어느 문장에서 물었는지 */
  @IsMongoId()
  sentenceId!: string;

  /** 고른 보기. 정답과 같은지는 서버가 판정한다. */
  @IsMongoId()
  choiceItemId!: string;
}
