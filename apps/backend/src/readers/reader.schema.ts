import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/** 스스로 밝힌 영어 레벨. 어떤 항목을 추천할지와 뜻을 얼마나 풀어 쓸지를 함께 정한다. */
export const LEVELS = ['입문', '중급', '고급'] as const;
export type Level = (typeof LEVELS)[number];

export const PROVIDERS = ['kakao', 'naver', 'google'] as const;
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
 * 읽는 사람. 비밀번호가 없다 — 로그인은 카카오·네이버·구글로만 들어온다.
 */
@Schema({ timestamps: true, collection: 'readers' })
export class Reader {
  @Prop({ required: true })
  nickname!: string;

  @Prop()
  email?: string;

  @Prop()
  profileImage?: string;

  @Prop({ type: String, enum: LEVELS, default: '중급' })
  level!: Level;

  /** 이 권을 다 읽으면 레벨을 다시 물어본다 */
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
