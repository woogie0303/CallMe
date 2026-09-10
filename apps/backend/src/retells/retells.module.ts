import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Book, BookSchema } from '../books/book.schema';
import { LexicalItem, LexicalItemSchema } from '../items/lexical-item.schema';
import { Reader, ReaderSchema } from '../readers/reader.schema';
import { Sentence, SentenceSchema } from '../sentences/sentence.schema';
import { ReviseService } from './anthropic/revise.service';
import { Retell, RetellSchema } from './retell.schema';
import { RetellsController } from './retells.controller';
import { RetellsService } from './retells.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Retell.name, schema: RetellSchema },
      { name: Book.name, schema: BookSchema },
      { name: Reader.name, schema: ReaderSchema },
      { name: LexicalItem.name, schema: LexicalItemSchema },
      { name: Sentence.name, schema: SentenceSchema },
    ]),
    AuthModule,
  ],
  controllers: [RetellsController],
  providers: [RetellsService, ReviseService],
})
export class RetellsModule {}
