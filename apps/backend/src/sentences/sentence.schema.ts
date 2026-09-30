import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

/**
 * 이 문장에 대고 남긴 생각 하나. 스레드처럼 아래로 쌓인다 — 같은 문장을 다시
 * 펼 때마다 그때의 생각을 하나씩 더 달 수 있다. 챕터를 통째로 옮겨 적던
 * 리텔링 대신 들어왔다: 쓰는 부담이 한 줄이면 족하고, 무엇에 대한 생각인지
 * (그 문장) 늘 붙어 있다.
 */
@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Thought {
  _id!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 1000 })
  text!: string;

  createdAt!: Date;
}
const ThoughtSchema = SchemaFactory.createForClass(Thought);

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

  /**
   * 하트 — 표현을 담은 문장도 '마음에 든 문장'에 넣고 싶을 때 독자가 직접 켠다.
   * 위의 '어느 쪽인지 표시하지 않는다'와 부딪히지 않는다: 그건 만남에서 셀 수
   * 있는 사실이라 두 번 적지 않는 것이고, 이건 어디서도 셀 수 없는 독자의 뜻이다.
   */
  @Prop({ default: false })
  favorite!: boolean;

  /** 내 생각 — 오래된 것부터 */
  @Prop({ type: [ThoughtSchema], default: [] })
  thoughts!: Thought[];
}

export type SentenceDocument = HydratedDocument<Sentence>;
export const SentenceSchema = SchemaFactory.createForClass(Sentence);

SentenceSchema.index({ readerId: 1, bookId: 1, createdAt: -1 });
