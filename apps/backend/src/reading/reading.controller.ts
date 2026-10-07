import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentReader } from '../common/current-reader.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { ReadingMonthQuery } from './dto/reading.dto';
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

  /** 달력이 오갈 수 있는 달 — 가입한 달부터 */
  @Get('range')
  range(@CurrentReader() readerId: string) {
    return this.reading.range(readerId);
  }

  /** ?year= &month= — 그 달 1일부터 마지막 날까지 */
  @Get('days')
  days(@CurrentReader() readerId: string, @Query() query: ReadingMonthQuery) {
    return this.reading.month(readerId, query.year, query.month);
  }

  @Get('genres')
  genres(@CurrentReader() readerId: string) {
    return this.reading.genreStats(readerId);
  }
}
