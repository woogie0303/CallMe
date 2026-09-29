import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Book } from '../books/book.schema';
import { Retell, type RetellDocument } from './retell.schema';
import type { CreateRetellDto, ListRetellsQuery } from './dto/retell.dto';

@Injectable()
export class RetellsService {
  constructor(
    @InjectModel(Retell.name) private readonly retells: Model<Retell>,
    @InjectModel(Book.name) private readonly books: Model<Book>,
  ) {}

  async create(readerId: string, dto: CreateRetellDto): Promise<RetellDocument> {
    const owner = new Types.ObjectId(readerId);
    const book = await this.books.findOne({ _id: dto.bookId, readerId: owner });
    if (!book) throw new NotFoundException('그 책을 찾지 못했어요.');

    return this.retells.create({
      readerId: owner,
      bookId: book._id,
      chapter: dto.chapter,
      draft: dto.draft,
    });
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
}
