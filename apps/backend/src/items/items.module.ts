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
})
export class ItemsModule {}
