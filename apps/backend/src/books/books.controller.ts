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
import { BooksService } from './books.service';
import { CreateBookDto, ListBooksQuery, UpdateBookDto } from './dto/book.dto';

@Controller('books')
@UseGuards(JwtAuthGuard)
export class BooksController {
  constructor(private readonly books: BooksService) {}

  @Post()
  create(@CurrentReader() readerId: string, @Body() dto: CreateBookDto) {
    return this.books.create(readerId, dto);
  }

  @Get()
  list(@CurrentReader() readerId: string, @Query() query: ListBooksQuery) {
    return this.books.list(readerId, query.finished);
  }

  @Get(':id')
  find(@CurrentReader() readerId: string, @Param('id', ObjectIdPipe) id: string) {
    return this.books.find(readerId, id);
  }

  @Patch(':id')
  update(
    @CurrentReader() readerId: string,
    @Param('id', ObjectIdPipe) id: string,
    @Body() dto: UpdateBookDto,
  ) {
    return this.books.update(readerId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentReader() readerId: string, @Param('id', ObjectIdPipe) id: string) {
    return this.books.remove(readerId, id);
  }
}
