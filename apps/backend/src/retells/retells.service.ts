import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Book, type BookDocument } from '../books/book.schema';
import { ModelUnavailable } from '../common/claude';
import { LexicalItem } from '../items/lexical-item.schema';
import { Reader } from '../readers/reader.schema';
import { Sentence } from '../sentences/sentence.schema';
import { ReviseService } from './anthropic/revise.service';
import { Retell, type RetellDocument } from './retell.schema';
import type { CreateRetellDto, ListRetellsQuery } from './dto/retell.dto';

export type RetellQuota = { used: number; limit: number; remaining: number; resetsOn: Date };

@Injectable()
export class RetellsService {
  constructor(
    @InjectModel(Retell.name) private readonly retells: Model<Retell>,
    @InjectModel(Book.name) private readonly books: Model<Book>,
    @InjectModel(Reader.name) private readonly readers: Model<Reader>,
    @InjectModel(LexicalItem.name) private readonly items: Model<LexicalItem>,
    @InjectModel(Sentence.name) private readonly sentences: Model<Sentence>,
    private readonly revise: ReviseService,
    private readonly config: ConfigService,
  ) {}

  /**
   * 옮겨 적은 글은 언제나 먼저 저장된다. 질문과 같은 규칙이다 — 답을 못 받는
   * 것과 쓴 것을 잃는 것은 전혀 다른 일이고, 쓴 것을 잃는 앱에 두 번째 글을
   * 쓰는 사람은 없다.
   */
  async create(readerId: string, dto: CreateRetellDto): Promise<RetellDocument> {
    const owner = new Types.ObjectId(readerId);
    const book = await this.books.findOne({ _id: dto.bookId, readerId: owner });
    if (!book) throw new NotFoundException('그 책을 찾지 못했어요.');

    const retell = await this.retells.create({
      readerId: owner,
      bookId: book._id,
      chapter: dto.chapter,
      draft: dto.draft,
      status: 'pending',
    });

    return this.attempt(readerId, retell, book);
  }

  async resolve(readerId: string, id: string): Promise<RetellDocument> {
    const retell = await this.find(readerId, id);
    if (retell.status === 'answered') return retell;

    const book = await this.books.findById(retell.bookId);
    if (!book) throw new NotFoundException('그 책을 찾지 못했어요.');

    return this.attempt(readerId, retell, book);
  }

  list(readerId: string, query: ListRetellsQuery): Promise<RetellDocument[]> {
    const filter: Record<string, unknown> = { readerId: new Types.ObjectId(readerId) };
    if (query.bookId) filter.bookId = new Types.ObjectId(query.bookId);
    return this.retells.find(filter).sort({ createdAt: -1 }).exec();
  }

  async find(readerId: string, id: string): Promise<RetellDocument> {
    const retell = await this.retells.findOne({
      _id: id,
      readerId: new Types.ObjectId(readerId),
    });
    if (!retell) throw new NotFoundException('그 리텔링을 찾지 못했어요.');
    return retell;
  }

  async remove(readerId: string, id: string): Promise<{ ok: true }> {
    const retell = await this.find(readerId, id);
    await this.retells.deleteOne({ _id: retell._id });
    return { ok: true };
  }

  /** 질문과 따로 센다. 한 화면이 '질문 2번 남음'이라고 말하는데 리텔링이 그걸 깎으면 거짓말이 된다. */
  async quota(readerId: string): Promise<RetellQuota> {
    const limit = Number(this.config.get('RETELL_MONTHLY_LIMIT') ?? 10);
    const now = new Date();
    const used = await this.retells.countDocuments({
      readerId: new Types.ObjectId(readerId),
      status: 'answered',
      answeredAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) },
    });

    return {
      used,
      limit,
      remaining: Math.max(0, limit - used),
      resetsOn: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    };
  }

  private async attempt(
    readerId: string,
    retell: RetellDocument,
    book: BookDocument,
  ): Promise<RetellDocument> {
    const { remaining } = await this.quota(readerId);
    if (remaining <= 0) {
      retell.status = 'pending';
      retell.pendingReason = '횟수 소진';
      return retell.save();
    }

    const owner = new Types.ObjectId(readerId);
    const reader = await this.readers.findById(readerId);
    const saved = await this.savedInBook(owner, book._id as Types.ObjectId);

    try {
      const revised = await this.revise.revise({
        chapter: retell.chapter,
        draft: retell.draft,
        level: reader?.level ?? '중급',
        bookTitle: book.title,
        savedTerms: [...saved.keys()],
      });

      retell.revisions = revised.revisions;
      retell.missedItemIds = revised.missedTerms.flatMap((term) => {
        const id = saved.get(term);
        return id ? [id] : [];
      });
      retell.status = 'answered';
      retell.answeredAt = new Date();
      retell.answeredBy = this.revise.modelName;
      retell.pendingReason = undefined;
    } catch (error) {
      if (!(error instanceof ModelUnavailable)) throw error;
      retell.status = 'pending';
      retell.pendingReason = '연결 실패';
    }

    return retell.save();
  }

  /**
   * 이 책에서 담아둔 표현들. 어휘 항목은 책에 속하지 않으므로, 그 항목이 만난
   * 문장이 이 책의 것인지를 거쳐서 찾는다.
   */
  private async savedInBook(
    readerId: Types.ObjectId,
    bookId: Types.ObjectId,
  ): Promise<Map<string, Types.ObjectId>> {
    const sentenceIds = await this.sentences.find({ readerId, bookId }).distinct('_id');
    const items = await this.items.find({
      readerId,
      'encounters.sentenceId': { $in: sentenceIds },
    });

    return new Map(items.map((item) => [item.term, item._id as Types.ObjectId]));
  }
}
