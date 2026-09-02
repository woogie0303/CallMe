import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Book, BookSchema } from '../books/book.schema';
import { LexicalItem, LexicalItemSchema } from '../items/lexical-item.schema';
import { Sentence, SentenceSchema } from './sentence.schema';
import { SentencesController } from './sentences.controller';
import { SentencesService } from './sentences.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Sentence.name, schema: SentenceSchema },
      { name: Book.name, schema: BookSchema },
      { name: LexicalItem.name, schema: LexicalItemSchema },
    ]),
    AuthModule,
  ],
  controllers: [SentencesController],
  providers: [SentencesService],
})
export class SentencesModule {}
