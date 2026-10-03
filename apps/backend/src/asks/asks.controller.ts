import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentReader } from '../common/current-reader.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { ObjectIdPipe } from '../common/object-id.pipe';
import { AsksService } from './asks.service';
import { CreateAskDto, ListAsksQuery, SplitLinesDto } from './dto/ask.dto';
import { Throttle } from '@nestjs/throttler';
import { RATE_LIMIT } from '../common/rate-limit';

/**
 * 묻는 단위는 언제나 문장 하나다(ADR-0001).
 *
 * quota가 :id보다 먼저 선언돼 있어야 한다 — 나중에 두면 /asks/quota가
 * 질문 id로 잡힌다.
 */
@Controller('asks')
@UseGuards(JwtAuthGuard)
export class AsksController {
  constructor(private readonly asks: AsksService) {}

  @Get('quota')
  quota(@CurrentReader() readerId: string) {
    return this.asks.quota(readerId);
  }

  /** 찍은 쪽에서 읽어낸 줄들을 문장으로 — 아직 묻는 것이 아니라 고르기 전 단계다 */
  @Throttle({ default: RATE_LIMIT.model })
  @Post('split')
  @HttpCode(200)
  split(@Body() dto: SplitLinesDto) {
    return this.asks.split(dto.lines);
  }

  @Throttle({ default: RATE_LIMIT.model })
  @Post()
  create(@CurrentReader() readerId: string, @Body() dto: CreateAskDto) {
    return this.asks.create(readerId, dto);
  }

  @Get()
  list(@CurrentReader() readerId: string, @Query() query: ListAsksQuery) {
    return this.asks.list(readerId, query);
  }

  @Get(':id')
  find(
    @CurrentReader() readerId: string,
    @Param('id', ObjectIdPipe) id: string,
  ) {
    return this.asks.find(readerId, id);
  }

  /** 기다리던 질문을 다시 물어본다 */
  @Throttle({ default: RATE_LIMIT.model })
  @Post(':id/resolve')
  @HttpCode(200)
  resolve(
    @CurrentReader() readerId: string,
    @Param('id', ObjectIdPipe) id: string,
  ) {
    return this.asks.resolve(readerId, id);
  }

  @Delete(':id')
  remove(
    @CurrentReader() readerId: string,
    @Param('id', ObjectIdPipe) id: string,
  ) {
    return this.asks.remove(readerId, id);
  }
}
