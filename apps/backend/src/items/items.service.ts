import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Book, type BookDocument } from '../books/book.schema';
import { Sentence, type SentenceDocument } from '../sentences/sentence.schema';
import { LexicalItem, type LexicalItemDocument } from './lexical-item.schema';
import type {
  AddEncounterDto,
  ListItemsQuery,
  SaveItemDto,
  UpdateItemDto,
} from './dto/item.dto';

/**
 * 담은 결과. 이미 있던 표현이었는지, 그렇다면 처음 만난 뒤 며칠 만인지를
 * 함께 돌려준다 — 화면이 "2개월 만에 또 헷갈렸어요"라고 말할 수 있는 근거가
 * 이 두 값이다. 며칠인지를 어떤 말로 옮길지는 앱이 정한다.
 */
export type SaveResult = {
  item: LexicalItemDocument;
  reencountered: boolean;
  gapDays?: number;
  previousSavedAt?: Date;
  previousSentenceId?: Types.ObjectId;
};

export type ResolvedEncounter = {
  sentenceId: Types.ObjectId;
  savedAt: Date;
  sentence: SentenceDocument | null;
  book: BookDocument | null;
};

@Injectable()
export class ItemsService {
  constructor(
    @InjectModel(LexicalItem.name) private readonly items: Model<LexicalItem>,
    @InjectModel(Sentence.name) private readonly sentences: Model<Sentence>,
    @InjectModel(Book.name) private readonly books: Model<Book>,
  ) {}

  /**
   * 같은 표현을 두 번 만들지 않는다. (readerId, term) 유일 인덱스가 그것을
   * 막고, 두 번째 저장은 문서를 만드는 대신 만남을 하나 더 붙인다.
   *
   * 다시 만난 표현의 상태는 '헷갈려요'로 되돌린다 — 외웠다고 표시해 둔 것을
   * 또 담았다면, 외웠다는 말이 더는 사실이 아니기 때문이다.
   */
  async save(readerId: string, dto: SaveItemDto): Promise<SaveResult> {
    const owner = new Types.ObjectId(readerId);
    const sentence = await this.sentences.findOne({ _id: dto.sentenceId, readerId: owner });
    if (!sentence) throw new NotFoundException('그 문장을 찾지 못했어요.');

    const term = dto.term.trim();
    const existing = await this.items.findOne({ readerId: owner, term });

    if (!existing) {
      const created = await this.items.create({
        readerId: owner,
        term,
        meaning: dto.meaning,
        register: dto.register,
        encounters: [{ sentenceId: sentence._id, savedAt: new Date() }],
      });
      return { item: created, reencountered: false };
    }

    const met = existing.encounters.some((encounter) =>
      encounter.sentenceId.equals(sentence._id),
    );
    if (met) return { item: existing, reencountered: false };

    const previous = existing.encounters[existing.encounters.length - 1];
    const first = existing.encounters[0];
    const savedAt = new Date();

    existing.encounters.push({ sentenceId: sentence._id, savedAt });
    existing.status = '헷갈려요';
    await existing.save();

    return {
      item: existing,
      reencountered: true,
      gapDays: daysBetween(first.savedAt, savedAt),
      previousSavedAt: previous.savedAt,
      previousSentenceId: previous.sentenceId,
    };
  }

  list(readerId: string, query: ListItemsQuery): Promise<LexicalItemDocument[]> {
    const filter: Record<string, unknown> = { readerId: new Types.ObjectId(readerId) };
    if (query.status) filter.status = query.status;
    /** 두 번째 만남이 있는지만 보면 된다 */
    if (query.reencountered) filter['encounters.1'] = { $exists: true };

    return this.items.find(filter).sort({ updatedAt: -1 }).exec();
  }

  async find(readerId: string, id: string): Promise<LexicalItemDocument> {
    const item = await this.items.findOne({ _id: id, readerId: new Types.ObjectId(readerId) });
    if (!item) throw new NotFoundException('그 표현을 찾지 못했어요.');
    return item;
  }

  /**
   * 항목 하나를 열면 만난 문장이 전부 보여야 하고, 문장마다 어느 책이었는지도
   * 보여야 한다. 세 번 부르게 하지 않고 여기서 이어 붙여 돌려준다 — 재회는
   * 문장과 책을 나란히 놓아야만 눈에 보이는 사실이기 때문이다.
   */
  async findDetail(
    readerId: string,
    id: string,
  ): Promise<{ item: LexicalItemDocument; encounters: ResolvedEncounter[] }> {
    const item = await this.find(readerId, id);
    const sentenceIds = item.encounters.map((encounter) => encounter.sentenceId);

    const sentences = await this.sentences.find({ _id: { $in: sentenceIds } });
    const books = await this.books.find({
      _id: { $in: sentences.map((sentence) => sentence.bookId) },
    });

    const sentenceById = new Map(sentences.map((s) => [s.id as string, s]));
    const bookById = new Map(books.map((b) => [b.id as string, b]));

    const encounters = item.encounters.map((encounter) => {
      const sentence = sentenceById.get(encounter.sentenceId.toString()) ?? null;
      return {
        sentenceId: encounter.sentenceId,
        savedAt: encounter.savedAt,
        sentence,
        book: sentence ? (bookById.get(sentence.bookId.toString()) ?? null) : null,
      };
    });

    return { item, encounters };
  }

  async update(
    readerId: string,
    id: string,
    dto: UpdateItemDto,
  ): Promise<LexicalItemDocument> {
    const item = await this.items.findOneAndUpdate(
      { _id: id, readerId: new Types.ObjectId(readerId) },
      dto,
      { new: true },
    );
    if (!item) throw new NotFoundException('그 표현을 찾지 못했어요.');
    return item;
  }

  async addEncounter(
    readerId: string,
    id: string,
    dto: AddEncounterDto,
  ): Promise<LexicalItemDocument> {
    const owner = new Types.ObjectId(readerId);
    const item = await this.find(readerId, id);
    const sentence = await this.sentences.findOne({ _id: dto.sentenceId, readerId: owner });
    if (!sentence) throw new NotFoundException('그 문장을 찾지 못했어요.');

    if (item.encounters.some((encounter) => encounter.sentenceId.equals(sentence._id))) {
      throw new ConflictException('이미 이 문장에서 담아둔 표현이에요.');
    }

    item.encounters.push({ sentenceId: sentence._id, savedAt: new Date() });
    item.status = '헷갈려요';
    return item.save();
  }

  /**
   * 만남 하나만 떼어낸다. 마지막 하나까지 떼면 항목 자체를 지운다 —
   * 어디서 만났는지 말할 수 없는 항목은 서랍에서 할 말이 없다.
   */
  async removeEncounter(
    readerId: string,
    id: string,
    sentenceId: string,
  ): Promise<{ removed: 'encounter' | 'item' }> {
    const item = await this.find(readerId, id);
    const target = new Types.ObjectId(sentenceId);

    if (!item.encounters.some((encounter) => encounter.sentenceId.equals(target))) {
      throw new NotFoundException('그 문장에서 담은 기록이 없어요.');
    }

    if (item.encounters.length === 1) {
      await this.items.deleteOne({ _id: item._id });
      return { removed: 'item' };
    }

    item.encounters = item.encounters.filter(
      (encounter) => !encounter.sentenceId.equals(target),
    );
    await item.save();
    return { removed: 'encounter' };
  }

  async remove(readerId: string, id: string): Promise<{ ok: true }> {
    const item = await this.find(readerId, id);
    await this.items.deleteOne({ _id: item._id });
    return { ok: true };
  }
}

/** 처음 만난 날과 마지막으로 만난 날 사이. 이 간격이 제품의 요지다. */
function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}
