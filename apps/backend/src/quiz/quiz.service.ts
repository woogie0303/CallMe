import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  LexicalItem,
  type Encounter,
  type LexicalItemDocument,
} from '../items/lexical-item.schema';
import { Book } from '../books/book.schema';
import { Sentence, type SentenceDocument } from '../sentences/sentence.schema';
import { QuizAttempt } from './quiz-attempt.schema';
import type { AnswerQuizDto } from './dto/quiz.dto';

/** 보기 하나. 어느 것이 정답인지는 실어 보내지 않는다. */
export type Choice = { itemId: string; term: string };

/**
 * 문제 하나 — 표현을 통째로 도려낸 문장.
 *
 * 빈칸에 들어갈 말(`surface`)은 보내지 않는다. 맞힌 뒤에 채워 넣을 꼴은
 * 답을 낼 때 돌려준다 — 문제와 함께 보내면 답이 화면에 이미 와 있다.
 */
export type QuizQuestion = {
  itemId: string;
  sentenceId: string;
  bookId: string;
  /** 어느 책의 몇 쪽이었는지 — 문장 아래 한 줄로 붙는다 */
  bookTitle?: string;
  page?: number;
  before: string;
  after: string;
  /** 이 문장을 담아둔 날 — '6월 4일에 담아둔 문장이에요'는 앱이 만든다 */
  savedAt: Date;
  choices: Choice[];
};

export type AnswerResult = {
  correct: boolean;
  /** 맞히면 문장이 다시 자연스러워지도록, 그 문장에 있던 꼴 그대로 */
  surface: string;
  answer: { itemId: string; term: string; meaning: string };
  confusedWith?: { itemId: string; term: string; note: string };
  /** 판정 뒤의 상태 — 두 번 연속 맞히면 '외웠어요'가 된다 */
  status: string;
};

/** 방금 담은 것을 바로 묻는 건 시험이 아니라 베껴 쓰기다 */
const MIN_AGE_HOURS = 24;
/** 어제 물어본 것을 오늘 또 묻지 않는다 */
const MIN_REST_HOURS = 24;
/** 외웠다고 표시된 것도 이만큼 지나면 한 번 확인한다 */
const RETENTION_CHECK_DAYS = 30;
/** 보기 넷 — 정답 하나와 내가 예전에 헷갈렸던 셋 */
const CHOICES = 4;

@Injectable()
export class QuizService {
  constructor(
    @InjectModel(LexicalItem.name) private readonly items: Model<LexicalItem>,
    @InjectModel(Sentence.name) private readonly sentences: Model<Sentence>,
    @InjectModel(Book.name) private readonly books: Model<Book>,
    @InjectModel(QuizAttempt.name) private readonly attempts: Model<QuizAttempt>,
  ) {}

  /**
   * 오늘 낼 문제들.
   *
   * 고르는 기준은 넷이다. 여러 책에서 다시 만난 것(재회 자체가 헷갈린다는
   * 증거다), 지난번에 틀린 것, 아직 한 번도 안 나온 것, 그리고 오래 안 본 것.
   * 맞힐수록 뜸해진다. 방금 담은 것과 어제 물어본 것은 빼는데, 앞의 것은
   * 시험이 아니라 베껴 쓰기가 되고 뒤의 것은 아직 잊을 시간이 없었다.
   *
   * 보기는 **전부 내가 담아둔 표현**이다. 사전에서 아무 낱말이나 끌어오면
   * 고르기는 쉬워지지만, 정작 내가 헷갈리던 것끼리 부딪히는 순간이 사라진다.
   */
  async session(readerId: string, size = 5): Promise<QuizQuestion[]> {
    const owner = new Types.ObjectId(readerId);
    const all = await this.items.find({ readerId: owner });
    /** 보기를 채울 수 없으면 문제를 내지 않는다 — 같은 것을 두 번 세우지 않는다 */
    if (all.length < CHOICES) return [];

    const now = Date.now();
    const ranked = all
      .flatMap((item) => {
        const encounter = quizzable(item);
        if (!encounter) return [];
        if (!eligible(item, encounter, now)) return [];
        return [{ item, encounter, score: score(item, encounter, now) }];
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, size);

    const sentences = await this.sentences.find({
      _id: { $in: ranked.map((r) => r.encounter.sentenceId) },
    });
    const sentenceById = new Map(sentences.map((s) => [s.id as string, s]));
    const books = await this.books.find({
      _id: { $in: sentences.map((sentence) => sentence.bookId) },
    });
    const titleById = new Map(books.map((book) => [book.id as string, book.title]));

    return ranked.flatMap(({ item, encounter }) => {
      const sentence = sentenceById.get(encounter.sentenceId.toString());
      if (!sentence) return [];

      const blank = cut(sentence, encounter.surface);
      /** 문장에서 그 자리를 찾지 못하면 이 문제는 조용히 거른다 */
      if (!blank) return [];

      return [
        {
          itemId: item.id as string,
          sentenceId: sentence.id as string,
          bookId: sentence.bookId.toString(),
          bookTitle: titleById.get(sentence.bookId.toString()),
          page: sentence.page,
          before: blank.before,
          after: blank.after,
          savedAt: encounter.savedAt,
          choices: this.choicesFor(item, all),
        },
      ];
    });
  }

  /**
   * 답을 낸다.
   *
   * 맞히면 다음에 뜸하게 나오고, 두 번 연속 맞히면 '외웠어요'로 넘어간다.
   * 틀리면 연속 횟수가 0으로 돌아가고 상태도 '헷갈려요'로 되돌아간다 —
   * 외웠다고 표시해 둔 것을 틀렸다면, 외웠다는 말이 더는 사실이 아니다.
   */
  async answer(readerId: string, dto: AnswerQuizDto): Promise<AnswerResult> {
    const owner = new Types.ObjectId(readerId);
    const item = await this.items.findOne({ _id: dto.itemId, readerId: owner });
    if (!item) throw new NotFoundException('그 표현을 찾지 못했어요.');

    const correct = dto.choiceItemId === dto.itemId;
    const encounter = item.encounters.find((e) => e.sentenceId.toString() === dto.sentenceId);

    item.review.quizzedAt = new Date();
    if (correct) {
      item.review.streak += 1;
      if (item.review.streak >= 2) item.status = '외웠어요';
    } else {
      item.review.streak = 0;
      item.review.wrongCount += 1;
      item.review.lastWrongAt = new Date();
      item.status = '헷갈려요';
    }
    await item.save();

    await this.attempts.create({
      readerId: owner,
      itemId: item._id,
      sentenceId: new Types.ObjectId(dto.sentenceId),
      chosenItemId: new Types.ObjectId(dto.choiceItemId),
      correct,
    });

    const pair = item.confusedWith
      ? await this.items.findOne({ _id: item.confusedWith.itemId, readerId: owner })
      : null;

    return {
      correct,
      surface: encounter?.surface ?? item.term,
      answer: { itemId: item.id as string, term: item.term, meaning: item.meaning },
      confusedWith:
        pair && item.confusedWith
          ? { itemId: pair.id as string, term: pair.term, note: item.confusedWith.note }
          : undefined,
      status: item.status,
    };
  }

  /**
   * 오답은 내가 담아둔 다른 표현에서 고른다. 헷갈리기 쉬운 짝이 적혀 있으면
   * 반드시 넣고, 그다음은 같은 말투(구어체·문어체)에서 고른다 — 말투가 다르면
   * 문장에 넣어보기도 전에 걸러지기 때문이다.
   */
  private choicesFor(answer: LexicalItemDocument, all: LexicalItemDocument[]): Choice[] {
    const others = all.filter((item) => item.id !== answer.id);
    const picked: LexicalItemDocument[] = [];

    const pair = answer.confusedWith
      ? others.find((item) => item.id === answer.confusedWith?.itemId.toString())
      : undefined;
    if (pair) picked.push(pair);

    for (const item of others) {
      if (picked.length >= CHOICES - 1) break;
      if (picked.some((p) => p.id === item.id)) continue;
      if (item.register === answer.register) picked.push(item);
    }
    for (const item of others) {
      if (picked.length >= CHOICES - 1) break;
      if (picked.some((p) => p.id === item.id)) continue;
      picked.push(item);
    }

    /**
     * 보기 순서는 문제마다 고정이어야 한다 — 다시 그릴 때마다 답이 옮겨 다니면
     * 위치를 외우게 되고, 그건 표현을 외운 게 아니다.
     */
    return [answer, ...picked]
      .map((item) => ({
        choice: { itemId: item.id as string, term: item.term },
        key: seed(item.id as string) + seed(answer.id as string),
      }))
      .sort((a, b) => (a.key % 97) - (b.key % 97))
      .map((x) => x.choice);
  }
}

/** 빈칸을 뚫을 수 있는 만남 중 가장 오래된 것 — 처음 걸렸던 그 문장에서 묻는다 */
function quizzable(item: LexicalItemDocument): Encounter | undefined {
  return item.encounters.find((encounter) => Boolean(encounter.surface));
}

function eligible(item: LexicalItemDocument, encounter: Encounter, now: number): boolean {
  if (hoursSince(encounter.savedAt, now) < MIN_AGE_HOURS) return false;

  const quizzedAt = item.review?.quizzedAt;
  if (quizzedAt && hoursSince(quizzedAt, now) < MIN_REST_HOURS) return false;

  /** 외웠다고 둔 것은 한참 뒤에 한 번 확인만 한다 */
  if (item.status === '외웠어요') {
    const last = quizzedAt ?? encounter.savedAt;
    return hoursSince(last, now) >= RETENTION_CHECK_DAYS * 24;
  }

  return true;
}

function score(item: LexicalItemDocument, encounter: Encounter, now: number): number {
  const review = item.review;
  let value = 0;

  /** 여러 문장에서 다시 만났다는 것 자체가 헷갈린다는 증거다 */
  if (item.encounters.length > 1) value += 3;
  if (review?.lastWrongAt && hoursSince(review.lastWrongAt, now) < 14 * 24) value += 3;
  if (!review?.quizzedAt) value += 2;

  const rested = hoursSince(review?.quizzedAt ?? encounter.savedAt, now) / 24;
  value += Math.min(3, rested / 7);

  /** 맞힐수록 뜸하게 */
  value -= (review?.streak ?? 0) * 1.5;

  return value;
}

/** 문장에서 그 자리를 잘라낸다. 그대로 못 찾으면 대소문자를 무시하고 한 번 더 본다. */
function cut(
  sentence: SentenceDocument,
  surface?: string,
): { before: string; after: string } | undefined {
  if (!surface) return undefined;

  let at = sentence.text.indexOf(surface);
  if (at < 0) at = sentence.text.toLowerCase().indexOf(surface.toLowerCase());
  if (at < 0) return undefined;

  return {
    before: sentence.text.slice(0, at),
    after: sentence.text.slice(at + surface.length),
  };
}

function hoursSince(date: Date, now: number): number {
  return (now - date.getTime()) / 3_600_000;
}

function seed(id: string): number {
  let value = 0;
  for (const char of id) value = (value * 31 + char.charCodeAt(0)) % 100_003;
  return value;
}
