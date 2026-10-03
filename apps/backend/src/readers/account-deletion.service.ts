import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Ask } from '../asks/ask.schema';
import { OAuthTicket } from '../auth/schemas/oauth-ticket.schema';
import { RefreshToken } from '../auth/schemas/refresh-token.schema';
import { Book } from '../books/book.schema';
import { LexicalItem } from '../items/lexical-item.schema';
import { ReadingLog } from '../reading/reading-log.schema';
import { Retell } from '../retells/retell.schema';
import { Sentence } from '../sentences/sentence.schema';
import { Reader } from './reader.schema';

/**
 * 계정 삭제 — 독자가 맡긴 것을 전부 지운다. 앱스토어가 계정을 만드는 앱에 요구하는
 * 기능이고(심사 지침 5.1.1(v)), 로그아웃과 달리 되돌릴 수 없다.
 *
 * **독자 문서를 맨 마지막에 지운다.** 몽고가 단일 서버면 트랜잭션이 없어서 중간에
 * 끊길 수 있는데, 독자가 먼저 사라지면 남은 문서가 주인 없이 영영 남고 다시 시도할
 * 길도 없다. 독자가 마지막에 남아 있으면 같은 요청을 다시 보내 이어서 지울 수 있다.
 * 그래서 이 일은 **몇 번을 불러도 결과가 같다** — 이미 지워진 것을 또 지우는 건
 * 아무 일도 아니다.
 *
 * 토큰도 지운다. 리프레시 토큰이 남으면 지워진 독자로 새 액세스 토큰을 받으려
 * 들고, 로그인 티켓은 이미 지워진 독자의 세션을 열어준다.
 *
 * 하나만 남는 것이 있다: Apple로 로그인한 독자의 Apple 쪽 연결(토큰 회수)이다.
 * 그건 로그인할 때 받은 authorizationCode를 Apple에 보내 바꿔야 하는데 지금은 그걸
 * 받아 두지 않는다 — 출시 전에 따로 붙인다(`apps/backend/AGENTS.md`).
 */
@Injectable()
export class AccountDeletionService {
  private readonly log = new Logger(AccountDeletionService.name);

  constructor(
    @InjectModel(Book.name) private readonly books: Model<Book>,
    @InjectModel(Sentence.name) private readonly sentences: Model<Sentence>,
    @InjectModel(LexicalItem.name) private readonly items: Model<LexicalItem>,
    @InjectModel(Ask.name) private readonly asks: Model<Ask>,
    @InjectModel(Retell.name) private readonly retells: Model<Retell>,
    @InjectModel(ReadingLog.name) private readonly logs: Model<ReadingLog>,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokens: Model<RefreshToken>,
    @InjectModel(OAuthTicket.name)
    private readonly tickets: Model<OAuthTicket>,
    @InjectModel(Reader.name) private readonly readers: Model<Reader>,
  ) {}

  async remove(readerId: string): Promise<void> {
    const owner = { readerId: new Types.ObjectId(readerId) };

    /** 서로 기대지 않는 것들이라 한꺼번에 — 독자 문서만 이것들이 끝난 뒤에 */
    await Promise.all([
      this.books.deleteMany(owner),
      this.sentences.deleteMany(owner),
      this.items.deleteMany(owner),
      this.asks.deleteMany(owner),
      this.retells.deleteMany(owner),
      this.logs.deleteMany(owner),
      this.refreshTokens.deleteMany(owner),
      this.tickets.deleteMany(owner),
    ]);
    await this.readers.deleteOne({ _id: owner.readerId });

    this.log.warn(`계정을 삭제했어요: ${readerId}`);
  }
}
