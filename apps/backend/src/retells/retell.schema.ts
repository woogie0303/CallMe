import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

/**
 * 읽은 챕터를 제 말로 옮겨 적은 것.
 *
 * 고쳐주는 것도, 채점하는 것도 없다 — 그냥 쓰고 남긴다. 나중에 다시 열어
 * 그때 내가 이 챕터를 어떻게 옮겼는지 보는 것이 이 기록이 하는 일 전부다.
 *
 * 말하기(음성·STT)는 없다 — 읽기를 돕는 앱에 말하기 훈련이 붙으면 만들 것이
 * 두 배가 된다.
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
}

export type RetellDocument = HydratedDocument<Retell>;
export const RetellSchema = SchemaFactory.createForClass(Retell);

RetellSchema.index({ readerId: 1, bookId: 1, createdAt: -1 });
