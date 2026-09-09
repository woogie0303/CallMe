import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Ask } from '../asks/ask.schema';
import { Book } from '../books/book.schema';
import { LexicalItem } from '../items/lexical-item.schema';
import { Sentence, type SentenceDocument } from './sentence.schema';
import type {
  CreateSentenceDto,
  ListSentencesQuery,
  UpdateSentenceDto,
} from './dto/sentence.dto';

@Injectable()
export class SentencesService {
  constructor(
    @InjectModel(Sentence.name) private readonly sentences: Model<Sentence>,
    @InjectModel(Book.name) private readonly books: Model<Book>,
    @InjectModel(LexicalItem.name) private readonly items: Model<LexicalItem>,
    @InjectModel(Ask.name) private readonly asks: Model<Ask>,
  ) {}

  async create(readerId: string, dto: CreateSentenceDto): Promise<SentenceDocument> {
    const owner = new Types.ObjectId(readerId);
    const book = await this.books.exists({ _id: dto.bookId, readerId: owner });
    if (!book) throw new NotFoundException('그 책을 찾지 못했어요.');

    return this.sentences.create({
      ...dto,
      bookId: new Types.ObjectId(dto.bookId),
      readerId: owner,
    });
  }

  /**
   * liked=true는 '그냥 좋아서 담아둔 문장'을 뜻한다. 문장에 표시해 두지 않고
   * 만남 쪽에서 물어보는 이유는, 표현을 나중에 담거나 지우면 같은 문장이
   * 이쪽에서 저쪽으로 옮겨가기 때문이다 — 문장에 적어두면 그때마다 어긋난다.
   *
   * 물어본 문장도 뺀다. 몰라서 물어놓고 아직 아무것도 안 고른 문장은 '좋아서
   * 담아둔 줄'이 아니라 답을 기다리는 줄이다.
   */
  async list(readerId: string, query: ListSentencesQuery): Promise<SentenceDocument[]> {
    const owner = new Types.ObjectId(readerId);
    const filter: Record<string, unknown> = { readerId: owner };
    if (query.bookId) filter.bookId = new Types.ObjectId(query.bookId);

    if (query.liked) {
      const claimed = await this.items.distinct('encounters.sentenceId', { readerId: owner });
      const asked = await this.asks.distinct('sentenceId', { readerId: owner });
      filter._id = { $nin: [...claimed, ...asked] };
    }

    return this.sentences.find(filter).sort({ createdAt: -1 }).exec();
  }

  async find(readerId: string, id: string): Promise<SentenceDocument> {
    const sentence = await this.sentences.findOne({
      _id: id,
      readerId: new Types.ObjectId(readerId),
    });
    if (!sentence) throw new NotFoundException('그 문장을 찾지 못했어요.');
    return sentence;
  }

  async update(
    readerId: string,
    id: string,
    dto: UpdateSentenceDto,
  ): Promise<SentenceDocument> {
    const sentence = await this.sentences.findOneAndUpdate(
      { _id: id, readerId: new Types.ObjectId(readerId) },
      dto,
      { new: true },
    );
    if (!sentence) throw new NotFoundException('그 문장을 찾지 못했어요.');
    return sentence;
  }

  /** 문장이 사라지면 그 문장을 가리키던 만남도, 만남이 다 없어진 항목도 함께 간다. */
  async remove(readerId: string, id: string): Promise<{ ok: true }> {
    const sentence = await this.find(readerId, id);
    const owner = new Types.ObjectId(readerId);

    await this.items.updateMany(
      { readerId: owner, 'encounters.sentenceId': sentence._id },
      { $pull: { encounters: { sentenceId: sentence._id } } },
    );
    await this.items.deleteMany({ readerId: owner, encounters: { $size: 0 } });
    await this.sentences.deleteOne({ _id: sentence._id });

    return { ok: true };
  }
}
