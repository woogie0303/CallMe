import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';
import { Types } from 'mongoose';

/** 경로의 id가 ObjectId 꼴인지만 본다 — 없는 문서인지는 서비스가 답한다. */
@Injectable()
export class ObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException('id가 올바르지 않아요.');
    }
    return value;
  }
}
