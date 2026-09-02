import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

/**
 * 책에서 그대로 옮겨온 한 줄. 어휘 항목과는 **따로 있는 기록**이고, 담는 이유가
 * 둘이라 사는 곳도 둘로 갈린다 — 모르는 표현이 들어 있으면 그 항목을 통해
 * 서랍에서 닿고, 그냥 좋아서 담았으면 책에만 남는다.
 *
 * 어느 쪽인지를 문장에 표시하지 않는다. 그 표현이 이 문장을 만난 것으로
 * 세어두는 곳은 어휘 항목의 encounters이고, 사실을 두 군데 적으면 언젠가
 * 서로 어긋난다.
 */
@Schema({ timestamps: true })
export class Sentence {
  @Prop({ type: Types.ObjectId, ref: 'Reader', required: true, index: true })
  readerId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Book', required: true, index: true })
  bookId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  text!: string;

  @Prop({ min: 1 })
  page?: number;

  /** 이 문장에 대고 내가 적어둔 말 */
  @Prop()
  note?: string;
}

export type SentenceDocument = HydratedDocument<Sentence>;
export const SentenceSchema = SchemaFactory.createForClass(Sentence);

SentenceSchema.index({ readerId: 1, bookId: 1, createdAt: -1 });
