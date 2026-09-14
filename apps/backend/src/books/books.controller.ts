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
import { BookSearchService } from './book-search.service';
import { BooksService } from './books.service';
import { CreateBookDto, ListBooksQuery, SearchBooksQuery, UpdateBookDto } from './dto/book.dto';

@Controller('books')
@UseGuards(JwtAuthGuard)
export class BooksController {
  constructor(
    private readonly books: BooksService,
    private readonly search: BookSearchService,
  ) {}

  /** :id보다 먼저 선언돼 있어야 한다 — 나중에 두면 'search'가 id로 잡힌다 */
  @Get('search')
  searchBooks(@Query() query: SearchBooksQuery) {
    return this.search.search(query.q);
  }

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
