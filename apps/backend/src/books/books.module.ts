import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { LexicalItem, LexicalItemSchema } from '../items/lexical-item.schema';
import { Sentence, SentenceSchema } from '../sentences/sentence.schema';
import { Book, BookSchema } from './book.schema';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: Sentence.name, schema: SentenceSchema },
      { name: LexicalItem.name, schema: LexicalItemSchema },
    ]),
    AuthModule,
  ],
  controllers: [BooksController],
  providers: [BooksService],
})
export class BooksModule {}
