import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Book, BookSchema } from '../books/book.schema';
import { Sentence, SentenceSchema } from '../sentences/sentence.schema';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { LexicalItem, LexicalItemSchema } from './lexical-item.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LexicalItem.name, schema: LexicalItemSchema },
      { name: Sentence.name, schema: SentenceSchema },
      { name: Book.name, schema: BookSchema },
    ]),
    AuthModule,
  ],
  controllers: [ItemsController],
  providers: [ItemsService],
  /** 질문이 답을 받으면 독자가 고른 표현을 바로 담는다(`AsksService`) */
  exports: [ItemsService],
})
export class ItemsModule {}
