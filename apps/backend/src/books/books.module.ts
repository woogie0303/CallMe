import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Ask, AskSchema } from '../asks/ask.schema';
import { AuthModule } from '../auth/auth.module';
import { LexicalItem, LexicalItemSchema } from '../items/lexical-item.schema';
import { ReadingModule } from '../reading/reading.module';
import { Sentence, SentenceSchema } from '../sentences/sentence.schema';
import { Book, BookSchema } from './book.schema';
import { BookSearchService } from './book-search.service';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: Sentence.name, schema: SentenceSchema },
      { name: LexicalItem.name, schema: LexicalItemSchema },
      { name: Ask.name, schema: AskSchema },
    ]),
    AuthModule,
    ReadingModule,
  ],
  controllers: [BooksController],
  providers: [BooksService, BookSearchService],
})
export class BooksModule {}
