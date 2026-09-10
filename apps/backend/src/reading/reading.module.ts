import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { ReadingController } from './reading.controller';
import { ReadingLog, ReadingLogSchema } from './reading-log.schema';
import { ReadingService } from './reading.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ReadingLog.name, schema: ReadingLogSchema }]),
    AuthModule,
  ],
  controllers: [ReadingController],
  providers: [ReadingService],
  /** 책의 진도가 바뀔 때 기록이 남는다 — books가 이걸 쓴다 */
  exports: [ReadingService],
})
export class ReadingModule {}
