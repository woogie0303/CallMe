import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export const RETELL_STATUSES = ['answered', 'pending'] as const;
export type RetellStatus = (typeof RETELL_STATUSES)[number];

export const RETELL_PENDING_REASONS = ['횟수 소진', '연결 실패'] as const;
export type RetellPendingReason = (typeof RETELL_PENDING_REASONS)[number];

/** 내가 쓴 한 줄과, 이렇게 쓰면 더 자연스러운 한 줄. 나란히 놓는 것이 전부다. */
@Schema({ _id: false })
export class Revision {
  @Prop({ required: true })
  mine!: string;

  @Prop({ required: true })
  better!: string;

  @Prop({ required: true })
  note!: string;

  /** note 안에서 굵게 짚어줄 조각들 */
  @Prop({ type: [String], default: [] })
  highlights!: string[];
}

export const RevisionSchema = SchemaFactory.createForClass(Revision);

/**
 * 읽은 챕터를 제 말로 옮겨 적은 것.
 *
 * 말하기(음성·STT)는 없다 — 읽기를 돕는 앱에 말하기 훈련이 붙으면 만들 것이
 * 두 배가 된다. 옮겨 적은 글은 답을 못 받아도 남는다. 쓴 것을 잃는 앱에
 * 두 번째 글을 쓰는 사람은 없다.
 */
@Schema({ timestamps: true })
export class Retell {
  @Prop({ type: Types.ObjectId, ref: 'Reader', required: true, index: true })
  readerId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Book', required: true, index: true })
  bookId!: Types.ObjectId;

  @Prop({ required: true })
  chapter!: string;

  @Prop({ required: true })
  draft!: string;

  @Prop({ type: [RevisionSchema], default: [] })
  revisions!: Revision[];

  /**
   * 이 챕터를 쓰면서 쓸 수 있었는데 안 쓴, 내가 담아둔 표현들.
   * 리텔링이 서랍과 이어지는 자리가 여기 하나다.
   */
  @Prop({ type: [Types.ObjectId], ref: 'LexicalItem', default: [] })
  missedItemIds!: Types.ObjectId[];

  @Prop({ type: String, enum: RETELL_STATUSES, default: 'pending', index: true })
  status!: RetellStatus;

  @Prop({ type: String, enum: RETELL_PENDING_REASONS })
  pendingReason?: RetellPendingReason;

  @Prop()
  answeredAt?: Date;

  @Prop()
  answeredBy?: string;
}

export type RetellDocument = HydratedDocument<Retell>;
export const RetellSchema = SchemaFactory.createForClass(Retell);

RetellSchema.index({ readerId: 1, bookId: 1, createdAt: -1 });
