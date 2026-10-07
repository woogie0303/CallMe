import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

/**
 * 하루에 몇 쪽 읽었는지.
 *
 * 따로 기록하는 화면을 두지 않는다 — 읽은 데까지 표시를 옮기면 그 차이가 곧
 * 그날 읽은 양이다. 읽고 나서 한 번 더 적게 만들면 아무도 적지 않는다.
 */
@Schema({ timestamps: true, collection: 'reading_logs' })
export class ReadingLog {
  @Prop({ type: Types.ObjectId, ref: 'Reader', required: true, index: true })
  readerId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Book', required: true })
  bookId!: Types.ObjectId;

  /** 그날 0시. 하루를 세는 단위라 시각은 버린다. */
  @Prop({ required: true })
  day!: Date;

  @Prop({ required: true, min: 0 })
  pages!: number;
}

export type ReadingLogDocument = HydratedDocument<ReadingLog>;
export const ReadingLogSchema = SchemaFactory.createForClass(ReadingLog);

/** 같은 날 같은 책은 한 줄로 쌓인다 */
ReadingLogSchema.index({ readerId: 1, bookId: 1, day: 1 }, { unique: true });
ReadingLogSchema.index({ readerId: 1, day: -1 });
