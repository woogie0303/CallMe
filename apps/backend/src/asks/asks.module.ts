import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Book, BookSchema } from '../books/book.schema';
import { ItemsModule } from '../items/items.module';
import { Reader, ReaderSchema } from '../readers/reader.schema';
import { Sentence, SentenceSchema } from '../sentences/sentence.schema';
import { AnswerService } from './anthropic/answer.service';
import { Ask, AskSchema } from './ask.schema';
import { AsksController } from './asks.controller';
import { AsksService } from './asks.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ask.name, schema: AskSchema },
      { name: Sentence.name, schema: SentenceSchema },
      { name: Book.name, schema: BookSchema },
      { name: Reader.name, schema: ReaderSchema },
    ]),
    AuthModule,
    ItemsModule,
  ],
  controllers: [AsksController],
  providers: [AsksService, AnswerService],
})
export class AsksModule {}
