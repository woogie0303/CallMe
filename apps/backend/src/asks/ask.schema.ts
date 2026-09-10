import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { REGISTERS, type Register } from '../items/lexical-item.schema';

export const ASK_STATUSES = ['answered', 'pending'] as const;
export type AskStatus = (typeof ASK_STATUSES)[number];

/** 답을 못 받은 이유. 독자에게 그대로 보여줄 말이라 한국어로 둔다. */
export const PENDING_REASONS = ['질문 소진', '연결 실패'] as const;
export type PendingReason = (typeof PENDING_REASONS)[number];

/**
 * 모델이 이 문장에서 골라준, 외워둘 만한 표현. **추천일 뿐이다** —
 * 독자가 고르는 순간에야 어휘 항목이 되고, 그때 재회가 일어난다.
 */
@Schema({ _id: false })
export class Candidate {
  @Prop({ required: true })
  term!: string;

  /** 이 문장에 있던 꼴 — 담을 때 만남에 함께 적힌다 */
  @Prop()
  surface?: string;

  @Prop({ required: true })
  meaning!: string;

  @Prop({ type: String, enum: REGISTERS, default: '중립' })
  register!: Register;

  /** 이미 서랍에 있는 표현이면 그 항목 — 담는 순간 재회가 된다 */
  @Prop({ type: Types.ObjectId, ref: 'LexicalItem' })
  existingItemId?: Types.ObjectId;

  /**
   * 그 항목을 마지막으로 만난 자리. '3월에 Klara에서 담으셨어요' 한 줄을
   * 화면이 쓰려면 이만큼이 필요하고, 이 줄이 붙은 카드가 이 앱이 있는 이유다.
   * 화면이 항목마다 다시 물어보게 두지 않는다.
   */
  @Prop({ type: Object })
  existing?: { met: number; lastSavedAt?: Date; lastBookTitle?: string };
}

export const CandidateSchema = SchemaFactory.createForClass(Candidate);

/**
 * 질문 하나 — 언제나 **문장 통째로** 묻는다. 낱말만 떼어 물으면 그 문장에서의
 * 뜻을 고를 수 없기 때문이다(ADR-0001).
 *
 * 답을 못 받아도 기록은 남는다. 문장은 이미 저장돼 있고 이 질문은 pending으로
 * 기다린다 — 담는 일이 실패하는 앱이면 읽다 말고 손이 멈춘다(ADR-0003).
 */
@Schema({ timestamps: true })
export class Ask {
  @Prop({ type: Types.ObjectId, ref: 'Reader', required: true, index: true })
  readerId!: Types.ObjectId;

  /** 물어본 그 문장. 질문보다 문장이 먼저 저장된다. */
  @Prop({ type: Types.ObjectId, ref: 'Sentence', required: true, index: true })
  sentenceId!: Types.ObjectId;

  @Prop({ type: String, enum: ASK_STATUSES, default: 'pending', index: true })
  status!: AskStatus;

  @Prop()
  translation?: string;

  @Prop({ type: [CandidateSchema], default: [] })
  candidates!: Candidate[];

  @Prop({ type: String, enum: PENDING_REASONS })
  pendingReason?: PendingReason;

  @Prop()
  answeredAt?: Date;

  /**
   * 어느 모델이 답했는지 — 나중에 답이 달라진 이유를 찾을 때 쓴다.
   * 이름이 `model`이 아닌 이유는 몽구스 문서에 이미 `model()`이 있어서다.
   */
  @Prop()
  answeredBy?: string;
}

export type AskDocument = HydratedDocument<Ask>;
export const AskSchema = SchemaFactory.createForClass(Ask);

/** 이번 달에 몇 번 물었는지를 세는 질의 */
AskSchema.index({ readerId: 1, status: 1, answeredAt: -1 });
