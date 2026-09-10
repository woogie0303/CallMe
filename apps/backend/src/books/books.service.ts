import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LexicalItem } from '../items/lexical-item.schema';
import { ReadingService } from '../reading/reading.service';
import { Sentence } from '../sentences/sentence.schema';
import { Book, type BookDocument } from './book.schema';
import type { CreateBookDto, UpdateBookDto } from './dto/book.dto';

@Injectable()
export class BooksService {
  constructor(
    @InjectModel(Book.name) private readonly books: Model<Book>,
    @InjectModel(Sentence.name) private readonly sentences: Model<Sentence>,
    @InjectModel(LexicalItem.name) private readonly items: Model<LexicalItem>,
    private readonly reading: ReadingService,
  ) {}

  create(readerId: string, dto: CreateBookDto): Promise<BookDocument> {
    return this.books.create({ ...dto, readerId: new Types.ObjectId(readerId) });
  }

  list(readerId: string, finished?: boolean): Promise<BookDocument[]> {
    const filter: Record<string, unknown> = { readerId: new Types.ObjectId(readerId) };
    if (finished !== undefined) {
      filter.finishedAt = finished ? { $ne: null } : null;
    }
    return this.books.find(filter).sort({ createdAt: -1 }).exec();
  }

  async find(readerId: string, id: string): Promise<BookDocument> {
    const book = await this.books.findOne({ _id: id, readerId: new Types.ObjectId(readerId) });
    if (!book) throw new NotFoundException('그 책을 찾지 못했어요.');
    return book;
  }

  /**
   * 읽은 데까지 표시를 옮기면 그 차이가 곧 오늘 읽은 양이다. 따로 적게 하지
   * 않는 이유는, 읽고 나서 한 번 더 적게 만들면 아무도 적지 않기 때문이다.
   *
   * 진도를 옮겼는데 마지막으로 읽은 날을 주지 않았으면 오늘로 찍는다 —
   * 방금 읽었다는 뜻이니까.
   */
  async update(readerId: string, id: string, dto: UpdateBookDto): Promise<BookDocument> {
    const before = await this.find(readerId, id);
    const advanced =
      dto.currentPage !== undefined ? dto.currentPage - before.currentPage : 0;

    const patch: Record<string, unknown> = { ...dto };
    if (advanced > 0 && !dto.lastReadAt) patch.lastReadAt = new Date();

    const book = await this.books.findOneAndUpdate(
      { _id: id, readerId: new Types.ObjectId(readerId) },
      patch,
      { new: true },
    );
    if (!book) throw new NotFoundException('그 책을 찾지 못했어요.');

    await this.reading.record(readerId, id, advanced);
    return book;
  }

  /**
   * 책을 지우면 그 책에서 옮겨 적은 문장도 함께 사라진다. 문장이 사라지면
   * 그 문장을 가리키던 만남도 지워야 하고, 만남이 하나도 남지 않은 어휘 항목은
   * 그때 함께 지운다 — 어디서 만났는지 말할 수 없는 항목은 서랍에서 할 말이
   * 없기 때문이다.
   */
  async remove(readerId: string, id: string): Promise<{ deletedSentences: number }> {
    const book = await this.find(readerId, id);
    const owner = new Types.ObjectId(readerId);

    const sentenceIds = await this.sentences
      .find({ bookId: book._id, readerId: owner })
      .distinct('_id');

    await this.items.updateMany(
      { readerId: owner, 'encounters.sentenceId': { $in: sentenceIds } },
      { $pull: { encounters: { sentenceId: { $in: sentenceIds } } } },
    );
    await this.items.deleteMany({ readerId: owner, encounters: { $size: 0 } });
    await this.sentences.deleteMany({ _id: { $in: sentenceIds } });
    await this.books.deleteOne({ _id: book._id });

    return { deletedSentences: sentenceIds.length };
  }
}
