import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Ask, AskSchema } from '../asks/ask.schema';
import { AuthModule } from '../auth/auth.module';
import {
  OAuthTicket,
  OAuthTicketSchema,
} from '../auth/schemas/oauth-ticket.schema';
import {
  RefreshToken,
  RefreshTokenSchema,
} from '../auth/schemas/refresh-token.schema';
import { Book, BookSchema } from '../books/book.schema';
import { LexicalItem, LexicalItemSchema } from '../items/lexical-item.schema';
import { ReadingLog, ReadingLogSchema } from '../reading/reading-log.schema';
import { Retell, RetellSchema } from '../retells/retell.schema';
import { Sentence, SentenceSchema } from '../sentences/sentence.schema';
import { AccountDeletionService } from './account-deletion.service';
import { Reader, ReaderSchema } from './reader.schema';
import { ReadersController } from './readers.controller';
import { ReadersService } from './readers.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reader.name, schema: ReaderSchema },
      /** 계정 삭제가 독자의 것을 전부 찾아 지우려면 이 컬렉션들이 다 필요하다 */
      { name: Book.name, schema: BookSchema },
      { name: Sentence.name, schema: SentenceSchema },
      { name: LexicalItem.name, schema: LexicalItemSchema },
      { name: Ask.name, schema: AskSchema },
      { name: Retell.name, schema: RetellSchema },
      { name: ReadingLog.name, schema: ReadingLogSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
      { name: OAuthTicket.name, schema: OAuthTicketSchema },
    ]),
    AuthModule,
  ],
  controllers: [ReadersController],
  providers: [ReadersService, AccountDeletionService],
})
export class ReadersModule {}
