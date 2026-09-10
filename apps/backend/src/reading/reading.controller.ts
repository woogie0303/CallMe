import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentReader } from '../common/current-reader.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { ReadingService } from './reading.service';

/**
 * 읽기 기록. 날짜와 쪽수만 준다 — 막대를 얼마나 채울지, 요일을 뭐라 부를지는
 * 화면이 정한다.
 */
@Controller('reading')
@UseGuards(JwtAuthGuard)
export class ReadingController {
  constructor(private readonly reading: ReadingService) {}

  @Get('week')
  week(@CurrentReader() readerId: string) {
    return this.reading.week(readerId);
  }
}
