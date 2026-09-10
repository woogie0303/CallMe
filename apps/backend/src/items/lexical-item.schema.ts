import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export const REGISTERS = ['구어체', '중립', '문어체'] as const;
export type Register = (typeof REGISTERS)[number];

export const STATUSES = ['헷갈려요', '외웠어요'] as const;
export type ItemStatus = (typeof STATUSES)[number];

/** 이 항목을 한 문장에서 만난 일. 두 번째부터가 재회다. */
@Schema({ _id: false })
export class Encounter {
  @Prop({ type: Types.ObjectId, ref: 'Sentence', required: true })
  sentenceId!: Types.ObjectId;

  /**
   * 그 문장에 실제로 있던 꼴. 표제형이 `brush it off`여도 문장에는
   * `brushed it off`로 있다.
   *
   * 퀴즈의 빈칸을 뚫을 수 있는 유일한 근거다. 문장에서 이 자리를 다시 찾아내는
   * 일은 ADR-0002가 걷어낸 파싱이라, 물어볼 때 모델이 이미 알고 있는 것을
   * 받아 적어둔다. 예전에 담아 이 값이 없는 만남은 퀴즈에 쓰지 않는다.
   */
  @Prop()
  surface?: string;

  @Prop({ default: () => new Date() })
  savedAt!: Date;
}

export const EncounterSchema = SchemaFactory.createForClass(Encounter);

/**
 * 퀴즈가 이 항목을 언제 다시 꺼낼지 정하는 데 쓰는 기록.
 *
 * 맞힐수록 뜸해지고 틀리면 곧 돌아온다. 간격 계산을 위한 최소한만 둔다 —
 * 이 앱은 암기 카드가 아니라서 정교한 복습 곡선이 필요하지 않다.
 */
@Schema({ _id: false })
export class Review {
  @Prop()
  quizzedAt?: Date;

  /** 연속으로 맞힌 횟수. 틀리면 0으로 돌아간다. */
  @Prop({ default: 0 })
  streak!: number;

  @Prop({ default: 0 })
  wrongCount!: number;

  @Prop()
  lastWrongAt?: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

/** 예전에 담아둔, 헷갈리기 쉬운 다른 항목 */
@Schema({ _id: false })
export class ConfusedWith {
  @Prop({ type: Types.ObjectId, ref: 'LexicalItem', required: true })
  itemId!: Types.ObjectId;

  @Prop({ required: true })
  note!: string;
}

export const ConfusedWithSchema = SchemaFactory.createForClass(ConfusedWith);

/**
 * 어휘 항목 — 몰라서 담아둔 말 한 덩어리. 낱말일 수도, 구동사나 연어일 수도 있다.
 *
 * (readerId, term)에 유일 인덱스가 걸려 있고, **그 인덱스가 곧 재회의 근거다.**
 * 같은 표현을 또 담으면 새 문서를 만들지 않고 encounters에 문장을 하나 더
 * 붙인다. 뜻은 독자의 레벨에 맞춰 쓰이므로 사람마다 다를 수 있어, 항목은
 * 언제나 독자별로 따로 산다.
 */
@Schema({ timestamps: true, collection: 'lexical_items' })
export class LexicalItem {
  @Prop({ type: Types.ObjectId, ref: 'Reader', required: true, index: true })
  readerId!: Types.ObjectId;

  /** 표제형(canonical form) */
  @Prop({ required: true, trim: true })
  term!: string;

  @Prop({ required: true })
  meaning!: string;

  @Prop({ type: String, enum: REGISTERS, default: '중립' })
  register!: Register;

  @Prop({ type: String, enum: STATUSES, default: '헷갈려요' })
  status!: ItemStatus;

  /** 만난 순서대로, 오래된 것부터 */
  @Prop({ type: [EncounterSchema], default: [] })
  encounters!: Encounter[];

  @Prop({ type: ConfusedWithSchema })
  confusedWith?: ConfusedWith;

  @Prop({ type: ReviewSchema, default: () => ({ streak: 0, wrongCount: 0 }) })
  review!: Review;
}

export type LexicalItemDocument = HydratedDocument<LexicalItem>;
export const LexicalItemSchema = SchemaFactory.createForClass(LexicalItem);

/** 같은 표현을 두 번 만들지 않는다 — 두 번째 저장은 재회가 된다 */
LexicalItemSchema.index({ readerId: 1, term: 1 }, { unique: true });
