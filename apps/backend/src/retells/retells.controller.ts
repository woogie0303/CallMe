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
import { CreateRetellDto, ListRetellsQuery } from './dto/retell.dto';
import { RetellsService } from './retells.service';

/**
 * 리텔링 — 읽은 챕터를 제 말로 옮겨 적고 고쳐진 문장을 돌려받는다.
 * quota가 :id보다 먼저 선언돼 있어야 한다.
 */
@Controller('retells')
@UseGuards(JwtAuthGuard)
export class RetellsController {
  constructor(private readonly retells: RetellsService) {}

  @Get('quota')
  quota(@CurrentReader() readerId: string) {
    return this.retells.quota(readerId);
  }

  @Post()
  create(@CurrentReader() readerId: string, @Body() dto: CreateRetellDto) {
    return this.retells.create(readerId, dto);
  }

  @Get()
  list(@CurrentReader() readerId: string, @Query() query: ListRetellsQuery) {
    return this.retells.list(readerId, query);
  }

  @Get(':id')
  find(@CurrentReader() readerId: string, @Param('id', ObjectIdPipe) id: string) {
    return this.retells.find(readerId, id);
  }

  @Post(':id/resolve')
  @HttpCode(200)
  resolve(@CurrentReader() readerId: string, @Param('id', ObjectIdPipe) id: string) {
    return this.retells.resolve(readerId, id);
  }

  @Delete(':id')
  remove(@CurrentReader() readerId: string, @Param('id', ObjectIdPipe) id: string) {
    return this.retells.remove(readerId, id);
  }
}
