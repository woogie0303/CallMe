import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Book, type BookDocument } from '../books/book.schema';
import { LexicalItem } from '../items/lexical-item.schema';
import { Reader } from '../readers/reader.schema';
import { Sentence, type SentenceDocument } from '../sentences/sentence.schema';
import { Ask, type AskDocument, type Candidate } from './ask.schema';
import { ModelUnavailable } from '../common/claude';
import { assertPageInBook } from '../common/page-in-book';
import { AnswerService, type Answer } from './anthropic/answer.service';
import type { CreateAskDto, ListAsksQuery } from './dto/ask.dto';

/** 이번 달에 몇 번 남았는지. 다 써도 담는 일은 실패하지 않는다. */
export type AskQuota = {
  used: number;
  limit: number;
  remaining: number;
  /** 이 날 0시에 다시 찬다 */
  resetsOn: Date;
};

/**
 * 한 문장에서 골라 줄 표현의 상한. 프롬프트에도 적어 두지만 모델이 약속을
 * 어길 수 있어서 여기서 한 번 더 자른다 — 넘치면 답이 길어지고(출력 토큰은
 * 입력보다 비싸다) 서랍이 외울 필요 없는 것으로 찬다.
 */
const MAX_CANDIDATES = 8;

/** 질문 하나와, 그 질문이 붙어 있는 문장과 책 */
export type AskView = {
  ask: AskDocument;
  sentence: SentenceDocument | null;
  book: BookDocument | null;
};

@Injectable()
export class AsksService {
  constructor(
    @InjectModel(Ask.name) private readonly asks: Model<Ask>,
    @InjectModel(Sentence.name) private readonly sentences: Model<Sentence>,
    @InjectModel(Book.name) private readonly books: Model<Book>,
    @InjectModel(LexicalItem.name) private readonly items: Model<LexicalItem>,
    @InjectModel(Reader.name) private readonly readers: Model<Reader>,
    private readonly answer: AnswerService,
    private readonly config: ConfigService,
  ) {}

  /**
   * 묻기. **문장은 언제나 먼저 저장된다.**
   *
   * 질문이 이번 달 몫을 다 썼든 모델이 답하지 않든, 옮겨 적은 문장은 남는다.
   * 담는 일이 실패하는 앱이면 읽다 말고 손이 멈추고, 그러면 이 앱이 하려던
   * 일 자체가 안 된다(ADR-0003). 답이 없는 질문은 pending으로 기다린다.
   *
   * `sentenceId`가 오면 이미 담아둔 문장을 묻는 것이라 새로 만들지 않는다 —
   * 만들면 같은 글이 두 줄이 되고, 원본은 아무것도 딸리지 않은 채 남는다(ADR-0004).
   */
  async create(readerId: string, dto: CreateAskDto): Promise<AskView> {
    const owner = new Types.ObjectId(readerId);
    const { sentence, book } = dto.sentenceId
      ? await this.reuse(owner, dto.sentenceId)
      : await this.capture(owner, dto);

    const ask = await this.asks.create({
      readerId: owner,
      sentenceId: sentence._id,
      status: 'pending',
    });

    return {
      ask: await this.attempt(readerId, ask, sentence, book),
      sentence,
      book,
    };
  }

  /** 새로 옮겨 적은 문장 — 묻기 전에 먼저 저장된다 */
  private async capture(owner: Types.ObjectId, dto: CreateAskDto) {
    const book = await this.books.findOne({ _id: dto.bookId, readerId: owner });
    if (!book) throw new NotFoundException('그 책을 찾지 못했어요.');
    assertPageInBook(book, dto.page);

    const sentence = await this.sentences.create({
      readerId: owner,
      bookId: book._id,
      text: dto.text,
      page: dto.page,
    });

    return { sentence, book };
  }

  /** 이미 담아둔 문장 — 책은 그 문장이 알고 있다 */
  private async reuse(owner: Types.ObjectId, sentenceId: string) {
    const sentence = await this.sentences.findOne({
      _id: sentenceId,
      readerId: owner,
    });
    if (!sentence) throw new NotFoundException('그 문장을 찾지 못했어요.');

    const book = await this.books.findOne({
      _id: sentence.bookId,
      readerId: owner,
    });
    if (!book) throw new NotFoundException('그 책을 찾지 못했어요.');

    return { sentence, book };
  }

  /** 기다리던 질문을 다시 물어본다 — 달이 바뀌었거나 연결이 돌아왔을 때. */
  async resolve(readerId: string, id: string): Promise<AskView> {
    const { ask, sentence, book } = await this.find(readerId, id);
    if (ask.status === 'answered') return { ask, sentence, book };
    if (!sentence || !book)
      throw new NotFoundException('그 문장을 찾지 못했어요.');

    return {
      ask: await this.attempt(readerId, ask, sentence, book),
      sentence,
      book,
    };
  }

  async list(readerId: string, query: ListAsksQuery): Promise<AskView[]> {
    const filter: Record<string, unknown> = {
      readerId: new Types.ObjectId(readerId),
    };
    if (query.status) filter.status = query.status;
    if (query.sentenceId)
      filter.sentenceId = new Types.ObjectId(query.sentenceId);

    const asks = await this.asks
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(query.limit ?? 50);

    /**
     * 문장이 사라진 질문은 세우지 않는다. 문장을 지울 때 질문도 함께 지우지만, 그렇게
     * 하기 전에 지운 문장의 질문이 남아 있을 수 있다 — 글 없는 빈 줄이 된다.
     */
    const views = await this.attach(asks);
    return views.filter((view) => view.sentence);
  }

  async find(readerId: string, id: string): Promise<AskView> {
    const ask = await this.asks.findOne({
      _id: id,
      readerId: new Types.ObjectId(readerId),
    });
    if (!ask) throw new NotFoundException('그 질문을 찾지 못했어요.');
    const [view] = await this.attach([ask]);
    return view;
  }

  /**
   * 이번 달 몫. 달이 바뀌면 저절로 찬다 — 어딘가에 남은 횟수를 적어두고
   * 매달 0으로 되돌리는 대신, 이번 달에 답을 받은 질문을 세기만 한다.
   * 되돌리는 일이 없으면 되돌리다 실패할 일도 없다.
   */
  async quota(readerId: string): Promise<AskQuota> {
    const now = new Date();
    const reader = await this.readers.findById(readerId).select('askBonus');
    const bonus =
      reader?.askBonus?.month === monthKey(now) ? reader.askBonus.granted : 0;
    const limit = Number(this.config.get('ASK_MONTHLY_LIMIT') ?? 30) + bonus;
    const used = await this.asks.countDocuments({
      readerId: new Types.ObjectId(readerId),
      status: 'answered',
      answeredAt: { $gte: startOfMonth(now) },
    });

    return {
      used,
      limit,
      remaining: Math.max(0, limit - used),
      resetsOn: startOfNextMonth(now),
    };
  }

  /**
   * 광고를 한 번 보고 질문을 더 받는다. **한도를 다 쓴 뒤에만** 연다 — 남아 있는데
   * 받게 두면 광고가 읽는 흐름 속으로 들어온다(ADR-0003). 하루에 받을 수 있는
   * 횟수도 막는다. 앱이 보고하는 것을 서버가 광고 네트워크에 되묻지는 않아서(SSV 없음),
   * 이 상한이 조작된 요청이 낼 수 있는 손해의 크기를 정한다.
   */
  async grantAdBonus(readerId: string): Promise<AskQuota> {
    const now = new Date();
    const month = monthKey(now);
    const day = dayKey(now);
    const perAd = Number(this.config.get('ASK_AD_BONUS') ?? 3);
    const perDay = Number(this.config.get('ASK_AD_DAILY_LIMIT') ?? 5);

    const before = await this.quota(readerId);
    if (before.remaining > 0) {
      throw new BadRequestException('아직 이번 달 질문이 남아 있어요.');
    }

    const reader = await this.readers.findById(readerId).select('askBonus');
    const prev = reader?.askBonus;
    const sameMonth = prev?.month === month;
    const todayCount = prev?.day === day ? prev.dayCount : 0;
    if (todayCount >= perDay) {
      throw new BadRequestException(
        '오늘 받을 수 있는 광고 보상을 다 받았어요.',
      );
    }

    await this.readers.updateOne(
      { _id: readerId },
      {
        askBonus: {
          month,
          granted: (sameMonth ? prev.granted : 0) + perAd,
          day,
          dayCount: todayCount + 1,
        },
      },
    );
    return this.quota(readerId);
  }

  /** 질문만 지운다. 옮겨 적은 문장은 남는다 — 답이 필요 없어졌을 뿐이다. */
  async remove(readerId: string, id: string): Promise<{ ok: true }> {
    const { ask } = await this.find(readerId, id);
    await this.asks.deleteOne({ _id: ask._id });
    return { ok: true };
  }

  /**
   * 한 번 물어본다. 실패하는 길이 둘인데 둘 다 예외가 아니라 상태다 —
   * 이번 달 몫을 다 썼거나(질문 소진), 지금 답을 받지 못했거나(연결 실패).
   */
  private async attempt(
    readerId: string,
    ask: AskDocument,
    sentence: SentenceDocument,
    book: BookDocument,
  ): Promise<AskDocument> {
    const { remaining } = await this.quota(readerId);
    if (remaining <= 0) {
      ask.status = 'pending';
      ask.pendingReason = '질문 소진';
      return ask.save();
    }

    try {
      const answer = await this.answer.answer({
        sentence: sentence.text,
        bookTitle: book.title,
        author: book.author,
        page: sentence.page,
      });

      ask.translation = answer.translation;
      ask.candidates = await this.markExisting(
        readerId,
        answer.candidates.slice(0, MAX_CANDIDATES),
      );
      ask.status = 'answered';
      ask.answeredAt = new Date();
      ask.answeredBy = this.answer.modelName;
      ask.pendingReason = undefined;
    } catch (error) {
      if (!(error instanceof ModelUnavailable)) throw error;
      ask.status = 'pending';
      ask.pendingReason = '연결 실패';
    }

    return ask.save();
  }

  /**
   * 이미 서랍에 있는 표현에 표시를 붙인다. 이 표시가 있어야 화면이
   * '이건 예전에도 담았어요'라고 말할 수 있고, 담는 순간이 재회가 된다.
   */
  private async markExisting(
    readerId: string,
    candidates: Answer['candidates'],
  ): Promise<Candidate[]> {
    if (!candidates.length) return [];

    const owner = new Types.ObjectId(readerId);
    const terms = candidates.map((candidate) => candidate.term);
    const existing = await this.items.find({
      readerId: owner,
      term: { $in: terms },
    });
    const byTerm = new Map(existing.map((item) => [item.term, item]));

    /** 마지막으로 만난 문장이 어느 책이었는지까지 한 번에 붙인다 */
    const lastSentenceIds = existing.flatMap((item) => {
      const last = item.encounters[item.encounters.length - 1];
      return last ? [last.sentenceId] : [];
    });
    const sentences = await this.sentences.find({
      _id: { $in: lastSentenceIds },
    });
    const books = await this.books.find({
      _id: { $in: sentences.map((sentence) => sentence.bookId) },
    });
    const sentenceById = new Map(sentences.map((s) => [s.id, s]));
    const titleById = new Map(books.map((b) => [b.id, b.title]));

    return candidates.map((candidate) => {
      const item = byTerm.get(candidate.term);
      const last = item?.encounters[item.encounters.length - 1];
      const sentence = last
        ? sentenceById.get(last.sentenceId.toString())
        : undefined;

      return {
        term: candidate.term,
        surface: candidate.surface,
        meaning: candidate.meaning,
        register: candidate.register,
        existingItemId: item?._id,
        existing: item
          ? {
              met: item.encounters.length,
              lastSavedAt: last?.savedAt,
              lastBookTitle: sentence
                ? titleById.get(sentence.bookId.toString())
                : undefined,
            }
          : undefined,
      };
    });
  }

  /** 질문 목록에 문장과 책을 붙인다 — 기다리는 문장 화면이 그리는 것이 그것이다 */
  private async attach(asks: AskDocument[]): Promise<AskView[]> {
    if (!asks.length) return [];

    const sentences = await this.sentences.find({
      _id: { $in: asks.map((ask) => ask.sentenceId) },
    });
    const books = await this.books.find({
      _id: { $in: sentences.map((sentence) => sentence.bookId) },
    });

    const sentenceById = new Map(sentences.map((s) => [s.id, s]));
    const bookById = new Map(books.map((b) => [b.id, b]));

    return asks.map((ask) => {
      const sentence = sentenceById.get(ask.sentenceId.toString()) ?? null;
      return {
        ask,
        sentence,
        book: sentence
          ? (bookById.get(sentence.bookId.toString()) ?? null)
          : null,
      };
    });
  }
}

function monthKey(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function dayKey(now: Date): string {
  return `${monthKey(now)}-${String(now.getDate()).padStart(2, '0')}`;
}

function startOfMonth(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function startOfNextMonth(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}
