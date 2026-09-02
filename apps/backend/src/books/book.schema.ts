import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

/**
 * 책 — 문장이 온 곳이자 읽은 기록 그 자체다. 어휘 항목은 책에 속하지 않는다
 * (여러 책을 건너다니는 것이 어휘 항목이고, 그 이동이 재회다). 책에 남는 것은
 * 진도와, 어휘 항목 없이 그냥 좋아서 담아둔 문장뿐이다.
 */
@Schema({ timestamps: true })
export class Book {
  @Prop({ type: Types.ObjectId, ref: 'Reader', required: true, index: true })
  readerId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  author!: string;

  @Prop({ min: 1 })
  pages?: number;

  /** 표지 이미지 주소. 없으면 앱이 책등 색만으로 책을 그린다. */
  @Prop()
  cover?: string;

  /** 책등 그라디언트 두 색 — 라벨 없이 출처를 알려준다 */
  @Prop({ type: [String], default: [] })
  spine!: string[];

  @Prop({ default: 0, min: 0 })
  currentPage!: number;

  @Prop()
  startedAt?: Date;

  @Prop()
  lastReadAt?: Date;

  /** 다 읽은 날. 이 날이 찍히면 레벨을 다시 물어본다. */
  @Prop()
  finishedAt?: Date;
}

export type BookDocument = HydratedDocument<Book>;
export const BookSchema = SchemaFactory.createForClass(Book);

/** 내 책장은 언제나 '내 것 중에서' 찾는다 */
BookSchema.index({ readerId: 1, createdAt: -1 });
