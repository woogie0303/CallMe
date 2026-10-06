import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Book, type Genre } from '../books/book.schema';
import { Reader } from '../readers/reader.schema';
import { ReadingLog } from './reading-log.schema';

export type ReadingDay = { date: Date; pages: number };
export type GenreStat = { genre: Genre | '장르 없음'; pages: number };
/** 달력이 오갈 수 있는 달 — 둘 다 그 달 1일 */
export type ReadingRange = { first: Date; last: Date };

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
  constructor(
    @InjectModel(ReadingLog.name) private readonly logs: Model<ReadingLog>,
    @InjectModel(Book.name) private readonly books: Model<Book>,
    @InjectModel(Reader.name) private readonly readers: Model<Reader>,
  ) {}

  /**
   * 달력이 오갈 수 있는 달. 앞끝은 **가입한 달** — 그 전엔 기록이 있을 수 없어서
   * 빈 달만 이어진다. 뒤끝은 이번 달과 마지막 기록이 있는 달 중 늦은 쪽이다.
   * 평소엔 이번 달이고, 날짜가 어긋난 기록이 있어도 그 달까지는 가 볼 수 있다.
   */
  async range(readerId: string): Promise<ReadingRange> {
    const owner = new Types.ObjectId(readerId);
    const reader = await this.readers
      .findById(owner, { createdAt: 1 })
      .lean<{ createdAt?: Date }>();
    const latest = await this.logs
      .findOne({ readerId: owner, pages: { $gt: 0 } }, { day: 1 })
      .sort({ day: -1 })
      .lean();

    const now = new Date();
    const joined = reader?.createdAt ?? now;
    const lastDay = latest?.day && latest.day > now ? latest.day : now;

    return {
      first: new Date(joined.getFullYear(), joined.getMonth(), 1),
      last: new Date(lastDay.getFullYear(), lastDay.getMonth(), 1),
    };
  }

  /**
   * 진도가 옮겨 간 만큼 읽은 양을 맞춘다. 같은 날 같은 책이면 한 줄에 쌓인다.
   *
   * **뒤로 가면 그만큼 덜어낸다.** 67쪽으로 잘못 적었다가 30쪽으로 고치면 읽은 쪽도 37쪽
   * 줄어야 한다 — 그대로 두면 '67쪽 읽었어요'가 통계에 남는다. 한 책의 기록을 모두 더한 값은
   * 늘 그 책의 현재 쪽수를 따라가게 만든다(등록할 때 적은 쪽수도 기록하고, 옮길 때마다
   * 차이를 더하거나 덜어서). 덜어내는 순서는 **가장 최근 날부터**다 — 방금 잘못 적은 것을
   * 먼저 되돌리고, 그 날의 기록이 모자라면 그 전날로 거슬러 간다. 다시 읽어서 앞으로 가면
   * 다시 더해지므로 합은 어긋나지 않는다. 기록보다 많이 덜어낼 일은 없다(0에서 멈춘다).
   */
  async record(readerId: string, bookId: string, pages: number): Promise<void> {
    if (pages === 0) return;
    if (pages < 0) return this.trim(readerId, bookId, -pages);

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

  /** 가장 최근 날의 기록부터 `pages`만큼 덜어낸다. 0이 된 줄은 지운다. */
  private async trim(
    readerId: string,
    bookId: string,
    pages: number,
  ): Promise<void> {
    const rows = await this.logs
      .find({
        readerId: new Types.ObjectId(readerId),
        bookId: new Types.ObjectId(bookId),
        pages: { $gt: 0 },
      })
      .sort({ day: -1 })
      .lean();

    let left = pages;
    for (const row of rows) {
      if (left <= 0) break;
      const take = Math.min(row.pages, left);
      if (take === row.pages) {
        await this.logs.deleteOne({ _id: row._id });
      } else {
        await this.logs.updateOne({ _id: row._id }, { $inc: { pages: -take } });
      }
      left -= take;
    }
  }

  /**
   * 책을 지우면 그 책의 읽은 기록도 지운다. 남겨두면 주인 없는 쪽수가 되어
   * 장르 통계에서 '장르 없음'으로 잡히고 — 책을 지우는 건 대개 잘못 들였기
   * 때문이라, 그 쪽수가 이번 주 그래프에 남아 있는 것도 맞지 않다.
   */
  async forgetBook(readerId: string, bookId: string): Promise<void> {
    await this.logs.deleteMany({
      readerId: new Types.ObjectId(readerId),
      bookId: new Types.ObjectId(bookId),
    });
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
    const pagesByDay = new Map(
      rows.map((row) => [startOfDay(row._id).getTime(), row.pages]),
    );

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
   * 그 달의 하루하루와 쪽수, 1일부터 마지막 날까지 — 읽은 날 달력이 쓴다.
   * 안 읽은 날도 0으로 채워서 준다 — 빈 날이 빠지면 달력의 칸이 밀린다.
   *
   * 이레보다 길게, 하지만 무한정 거슬러 보여주지 않는다. 달 하나가 '이번 달
   * 읽었나'를 보기 좋은 단위이고, 그 너머(작년 이맘때 등)는 이 화면이 답할
   * 질문이 아니다 — 이전·다음 버튼으로 달을 옮기면 늘 그 달 전체를 새로 받는다.
   */
  async month(
    readerId: string,
    year: number,
    month: number,
  ): Promise<ReadingDay[]> {
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 1);

    const rows = await this.logs.aggregate<{ _id: Date; pages: number }>([
      {
        $match: {
          readerId: new Types.ObjectId(readerId),
          day: { $gte: from, $lt: to },
        },
      },
      { $group: { _id: '$day', pages: { $sum: '$pages' } } },
    ]);
    const pagesByDay = new Map(
      rows.map((row) => [startOfDay(row._id).getTime(), row.pages]),
    );

    const result: ReadingDay[] = [];
    for (let date = from; date < to; date = addDays(date, 1)) {
      result.push({ date, pages: pagesByDay.get(date.getTime()) ?? 0 });
    }
    return result;
  }

  /**
   * 지금까지 읽은 쪽수를 책의 장르로 묶는다. 쪽수 기준인 이유는 책 한 권을
   * '장르 하나'로 셀 때보다, 두꺼운 책을 오래 읽은 만큼 그 장르가 그래프에서
   * 크게 보여야 하기 때문이다 — 300쪽 소설과 30쪽 만에 그만둔 에세이가 같은
   * 무게로 잡히면 실제로 무엇을 읽었는지 왜곡된다.
   *
   * 장르를 못 채운 책(카카오·Open Library로 들어왔거나 등록할 때 안 골랐던
   * 옛 책)은 '장르 없음'으로 따로 묶는다 — 조용히 지워 합계를 틀리게 하지 않는다.
   */
  async genreStats(readerId: string): Promise<GenreStat[]> {
    const owner = new Types.ObjectId(readerId);
    const rows = await this.logs.aggregate<{
      _id: Types.ObjectId;
      pages: number;
    }>([
      { $match: { readerId: owner } },
      { $group: { _id: '$bookId', pages: { $sum: '$pages' } } },
    ]);
    if (!rows.length) return [];

    const books = await this.books
      .find({ _id: { $in: rows.map((row) => row._id) } }, { genre: 1 })
      .lean();
    const genreByBook = new Map(
      books.map((book) => [String(book._id), book.genre]),
    );

    const pagesByGenre = new Map<string, number>();
    for (const row of rows) {
      const genre = genreByBook.get(String(row._id)) ?? '장르 없음';
      pagesByGenre.set(genre, (pagesByGenre.get(genre) ?? 0) + row.pages);
    }

    return [...pagesByGenre.entries()]
      .map(([genre, pages]) => ({ genre: genre as Genre | '장르 없음', pages }))
      .sort((a, b) => b.pages - a.pages);
  }

  /**
   * 오늘부터 거슬러 세되, 오늘 아직 안 읽었으면 어제부터 센다 — 아침에 앱을
   * 열었다고 어제까지의 연속이 끊긴 것처럼 보이면 안 된다.
   */
  private async streak(readerId: Types.ObjectId, today: Date): Promise<number> {
    const read = await this.logs
      .find({
        readerId,
        day: { $gte: addDays(today, -LOOKBACK) },
        pages: { $gt: 0 },
      })
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
