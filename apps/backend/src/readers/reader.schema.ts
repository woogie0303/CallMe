import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export const PROVIDERS = ['kakao', 'naver', 'google', 'apple'] as const;
export type ProviderName = (typeof PROVIDERS)[number];

/**
 * 소셜 계정 하나. 독자는 여러 개를 붙일 수 있고, (제공자, 제공자 안의 id)가
 * 같은 사람을 두 번 만들지 않게 막는 열쇠다.
 */
@Schema({ _id: false })
export class LinkedAccount {
  @Prop({ type: String, enum: PROVIDERS, required: true })
  provider!: ProviderName;

  @Prop({ required: true })
  providerId!: string;

  @Prop()
  email?: string;

  @Prop({ default: () => new Date() })
  linkedAt!: Date;
}

export const LinkedAccountSchema = SchemaFactory.createForClass(LinkedAccount);

/**
 * 읽는 사람. 비밀번호가 없다 — 로그인은 카카오·네이버·구글·Apple로만 들어온다.
 *
 * 레벨은 두지 않는다. 한때 스스로 밝힌 영어 레벨(입문·중급·고급)을 받아 뜻을
 * 풀어 쓰는 깊이를 정했는데, 한국어 책과 영어 밖의 원서까지 담게 되면서 사람
 * 하나에 레벨 하나로는 맞지 않았다(영어는 고급이어도 일본어는 입문이고, 한국어는
 * 모국어다). 무엇을 골라줄지는 독자가 이 문장에서 막혔다는 사실과, 담느냐
 * 넘기느냐가 정한다. 예전 문서에 남은 `level` 필드는 읽지 않는다.
 */
@Schema({ timestamps: true, collection: 'readers' })
export class Reader {
  @Prop({ required: true })
  nickname!: string;

  @Prop()
  email?: string;

  @Prop()
  profileImage?: string;

  /** 다 읽은 책의 수 */
  @Prop({ default: 0 })
  booksFinished!: number;

  @Prop({ type: [LinkedAccountSchema], default: [] })
  accounts!: LinkedAccount[];
}

export type ReaderDocument = HydratedDocument<Reader>;
export const ReaderSchema = SchemaFactory.createForClass(Reader);

/**
 * 같은 소셜 계정으로 두 사람이 생기지 않게 한다. 배열이 비어 있는 문서끼리
 * 부딪히지 않도록 sparse로 둔다.
 */
ReaderSchema.index(
  { 'accounts.provider': 1, 'accounts.providerId': 1 },
  { unique: true, sparse: true },
);
