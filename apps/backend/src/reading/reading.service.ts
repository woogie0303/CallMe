import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ReadingLog } from './reading-log.schema';

export type ReadingDay = { date: Date; pages: number };

export type ReadingWeek = {
  /** 월요일부터 오늘까지가 아니라, 늘 이레치를 준다 */
  days: ReadingDay[];
  /** 이번 이레 중 읽은 날 수 */
  daysRead: number;
  /** 오늘(또는 어제)까지 이어진 연속 일수 — 지난주에서 이어질 수 있다 */
  streak: number;
};

/** 이레를 보여준다 — 한 달은 훑는 그림이 되고, 사흘은 흐름이 안 보인다 */
const WINDOW = 7;
/** 연속을 거슬러 볼 만큼만 */
const LOOKBACK = 400;

@Injectable()
export class ReadingService {
  constructor(@InjectModel(ReadingLog.name) private readonly logs: Model<ReadingLog>) {}

  /**
   * 읽은 양을 더한다. 같은 날 같은 책이면 한 줄에 쌓인다.
   *
   * 뒤로 돌아가는 것(다시 읽기, 잘못 적은 쪽수 고치기)은 세지 않는다 —
   * 음수를 더하면 어제 읽은 것이 오늘 지워진다.
   */
  async record(readerId: string, bookId: string, pages: number): Promise<void> {
    if (pages <= 0) return;

    await this.logs.updateOne(
      {
        readerId: new Types.ObjectId(readerId),
        bookId: new Types.ObjectId(bookId),
        day: startOfDay(new Date()),
      },
      { $inc: { pages } },
      { upsert: true },
    );
  }

  async week(readerId: string): Promise<ReadingWeek> {
    const owner = new Types.ObjectId(readerId);
    const today = startOfDay(new Date());
    const from = addDays(today, -(WINDOW - 1));

    /** 하루에 책 두 권을 읽었으면 두 줄이 같은 날에 있다 */
    const rows = await this.logs.aggregate<{ _id: Date; pages: number }>([
      { $match: { readerId: owner, day: { $gte: from } } },
      { $group: { _id: '$day', pages: { $sum: '$pages' } } },
    ]);
    const pagesByDay = new Map(rows.map((row) => [startOfDay(row._id).getTime(), row.pages]));

    const days: ReadingDay[] = [];
    for (let i = 0; i < WINDOW; i += 1) {
      const date = addDays(from, i);
      days.push({ date, pages: pagesByDay.get(date.getTime()) ?? 0 });
    }

    return {
      days,
      daysRead: days.filter((day) => day.pages > 0).length,
      streak: await this.streak(owner, today),
    };
  }

  /**
   * 오늘부터 거슬러 세되, 오늘 아직 안 읽었으면 어제부터 센다 — 아침에 앱을
   * 열었다고 어제까지의 연속이 끊긴 것처럼 보이면 안 된다.
   */
  private async streak(readerId: Types.ObjectId, today: Date): Promise<number> {
    const read = await this.logs
      .find({ readerId, day: { $gte: addDays(today, -LOOKBACK) }, pages: { $gt: 0 } })
      .distinct('day');

    const seen = new Set(read.map((day: Date) => startOfDay(day).getTime()));
    let cursor = seen.has(today.getTime()) ? today : addDays(today, -1);
    let count = 0;

    while (seen.has(cursor.getTime())) {
      count += 1;
      cursor = addDays(cursor, -1);
    }

    return count;
  }
}

function startOfDay(date: Date): Date {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}
