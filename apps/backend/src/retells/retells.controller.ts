import {
  Body,
  Controller,
  Delete,
  Get,
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

/** 리텔링 — 읽은 챕터를 제 말로 옮겨 적어 남긴다. */
@Controller('retells')
@UseGuards(JwtAuthGuard)
export class RetellsController {
  constructor(private readonly retells: RetellsService) {}

  @Post()
  create(@CurrentReader() readerId: string, @Body() dto: CreateRetellDto) {
    return this.retells.create(readerId, dto);
  }

  @Get()
  list(@CurrentReader() readerId: string, @Query() query: ListRetellsQuery) {
    return this.retells.list(readerId, query);
  }

  @Get(':id')
  find(
    @CurrentReader() readerId: string,
    @Param('id', ObjectIdPipe) id: string,
  ) {
    return this.retells.find(readerId, id);
  }

  @Delete(':id')
  remove(
    @CurrentReader() readerId: string,
    @Param('id', ObjectIdPipe) id: string,
  ) {
    return this.retells.remove(readerId, id);
  }
}
