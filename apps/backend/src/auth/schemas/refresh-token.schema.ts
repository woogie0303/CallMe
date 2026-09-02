import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

/**
 * 리프레시 토큰. 원문은 어디에도 남기지 않고 해시만 둔다 — DB를 통째로
 * 들여다본 사람이 남의 세션을 이어받을 수 있으면 저장한 의미가 없다.
 *
 * 한 번 쓰면 폐기하고 새 것을 내준다(회전). 이미 폐기된 토큰이 다시 오면
 * 탈취를 의심할 수 있는 유일한 신호가 그것이다.
 */
@Schema({ timestamps: true, collection: 'refresh_tokens' })
export class RefreshToken {
  @Prop({ type: Types.ObjectId, ref: 'Reader', required: true, index: true })
  readerId!: Types.ObjectId;

  @Prop({ required: true, unique: true })
  tokenHash!: string;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop()
  revokedAt?: Date;
}

export type RefreshTokenDocument = HydratedDocument<RefreshToken>;
export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

/** 만료된 것은 몽고가 알아서 치운다 */
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
