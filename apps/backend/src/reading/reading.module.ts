import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Book, BookSchema } from '../books/book.schema';
import { Reader, ReaderSchema } from '../readers/reader.schema';
import { ReadingController } from './reading.controller';
import { ReadingLog, ReadingLogSchema } from './reading-log.schema';
import { ReadingService } from './reading.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ReadingLog.name, schema: ReadingLogSchema },
      /**
       * BooksModule을 통째로 들여오면 순환 참조가 된다(BooksModule이 이미
       * ReadingModule을 들여온다) — 장르만 읽으면 되므로 스키마만 등록한다.
       */
      { name: Book.name, schema: BookSchema },
      /** 가입한 달 — 달력이 그보다 앞으로는 가지 않는다 */
      { name: Reader.name, schema: ReaderSchema },
    ]),
    AuthModule,
  ],
  controllers: [ReadingController],
  providers: [ReadingService],
  /** 책의 진도가 바뀔 때 기록이 남는다 — books가 이걸 쓴다 */
  exports: [ReadingService],
})
export class ReadingModule {}
