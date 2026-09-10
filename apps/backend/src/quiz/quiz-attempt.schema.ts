import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

/**
 * 퀴즈에서 한 문제를 푼 일. 항목의 review는 '다음에 언제 낼지'만 알면 되므로
 * 덮어써지지만, 여기에는 푼 기록이 그대로 쌓인다 — 언젠가 '이 표현은 세 번
 * 틀렸어요'라고 말하려면 덮어쓰지 않은 기록이 있어야 한다.
 */
@Schema({ timestamps: true, collection: 'quiz_attempts' })
export class QuizAttempt {
  @Prop({ type: Types.ObjectId, ref: 'Reader', required: true, index: true })
  readerId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'LexicalItem', required: true, index: true })
  itemId!: Types.ObjectId;

  /** 어느 문장에서 물었는지 — 같은 표현도 문장이 다르면 다른 문제다 */
  @Prop({ type: Types.ObjectId, ref: 'Sentence', required: true })
  sentenceId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'LexicalItem' })
  chosenItemId?: Types.ObjectId;

  @Prop({ required: true })
  correct!: boolean;
}

export type QuizAttemptDocument = HydratedDocument<QuizAttempt>;
export const QuizAttemptSchema = SchemaFactory.createForClass(QuizAttempt);
