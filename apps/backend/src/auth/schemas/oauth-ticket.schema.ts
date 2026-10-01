import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

/**
 * 브라우저 로그인이 끝난 뒤, 앱이 딥링크로 받아 든 일회용 표.
 *
 * provider 콜백이 프로필로 독자를 찾거나 만든 다음, 토큰을 바로 앱에 실어
 * 보내지 않고 이 표부터 만든다 — 액세스·리프레시 토큰을 딥링크 URL에 실으면
 * 기기의 다른 앱이나 브라우저 히스토리에 남을 수 있다. 앱은 이 표와, 저
 * 혼자만 아는 PKCE code_verifier를 들고 `/auth/exchange`로 와야 진짜 토큰을
 * 받는다.
 *
 * `challenge`는 앱이 `/auth/:provider/start`에 보낸 code_challenge를 그대로
 * 옮겨 둔 것 — 교환 때 SHA256(code_verifier)와 대조한다.
 */
@Schema({ timestamps: true, collection: 'oauth_tickets' })
export class OAuthTicket {
  @Prop({ type: Types.ObjectId, ref: 'Reader', required: true, index: true })
  readerId!: Types.ObjectId;

  @Prop({ required: true })
  challenge!: string;

  @Prop({ required: true })
  expiresAt!: Date;
}

export type OAuthTicketDocument = HydratedDocument<OAuthTicket>;
export const OAuthTicketSchema = SchemaFactory.createForClass(OAuthTicket);

/** 만료된 것은 몽고가 알아서 치운다. 교환 성공·실패와 무관하게 60초면 사라진다 */
OAuthTicketSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
