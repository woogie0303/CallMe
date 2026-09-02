import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentReader } from '../common/current-reader.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { ObjectIdPipe } from '../common/object-id.pipe';
import {
  AddEncounterDto,
  ListItemsQuery,
  SaveItemDto,
  UpdateItemDto,
} from './dto/item.dto';
import { ItemsService } from './items.service';

/** 서랍 — 담아둔 어휘 항목이 모이는 곳. 항목이 주인이고 문장이 딸린다. */
@Controller('items')
@UseGuards(JwtAuthGuard)
export class ItemsController {
  constructor(private readonly items: ItemsService) {}

  @Post()
  save(@CurrentReader() readerId: string, @Body() dto: SaveItemDto) {
    return this.items.save(readerId, dto);
  }

  @Get()
  list(@CurrentReader() readerId: string, @Query() query: ListItemsQuery) {
    return this.items.list(readerId, query);
  }

  @Get(':id')
  find(@CurrentReader() readerId: string, @Param('id', ObjectIdPipe) id: string) {
    return this.items.findDetail(readerId, id);
  }

  @Patch(':id')
  update(
    @CurrentReader() readerId: string,
    @Param('id', ObjectIdPipe) id: string,
    @Body() dto: UpdateItemDto,
  ) {
    return this.items.update(readerId, id, dto);
  }

  @Post(':id/encounters')
  addEncounter(
    @CurrentReader() readerId: string,
    @Param('id', ObjectIdPipe) id: string,
    @Body() dto: AddEncounterDto,
  ) {
    return this.items.addEncounter(readerId, id, dto);
  }

  @Delete(':id/encounters/:sentenceId')
  removeEncounter(
    @CurrentReader() readerId: string,
    @Param('id', ObjectIdPipe) id: string,
    @Param('sentenceId', ObjectIdPipe) sentenceId: string,
  ) {
    return this.items.removeEncounter(readerId, id, sentenceId);
  }

  @Delete(':id')
  remove(@CurrentReader() readerId: string, @Param('id', ObjectIdPipe) id: string) {
    return this.items.remove(readerId, id);
  }
}
