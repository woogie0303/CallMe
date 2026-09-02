import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { toView, type ReaderView } from '../auth/auth.service';
import { Reader } from './reader.schema';
import type { UpdateReaderDto } from './dto/update-reader.dto';

@Injectable()
export class ReadersService {
  constructor(@InjectModel(Reader.name) private readonly readers: Model<Reader>) {}

  async find(readerId: string): Promise<ReaderView> {
    const reader = await this.readers.findById(readerId);
    if (!reader) throw new NotFoundException('그 독자를 찾지 못했어요.');
    return toView(reader);
  }

  async update(readerId: string, dto: UpdateReaderDto): Promise<ReaderView> {
    const reader = await this.readers.findByIdAndUpdate(readerId, dto, { new: true });
    if (!reader) throw new NotFoundException('그 독자를 찾지 못했어요.');
    return toView(reader);
  }
}
