import { bookById } from '@/entities/book/model/mock';
import type { Book } from '@/entities/book/model/types';
import { SENTENCES, sentenceById, type Sentence } from '@/entities/sentence/model/mock';
import { ITEMS } from '../model/mock';
import type { Encounter, LexicalItem } from '../model/types';

export type ResolvedEncounter = Encounter & { sentence: Sentence; book: Book };

/** 만난 순서대로 — 문장과 책까지 붙여서 돌려준다. */
export function encountersOf(item: LexicalItem): ResolvedEncounter[] {
  return item.encounters.flatMap((e) => {
    const sentence = sentenceById(e.sentenceId);
    const book = sentence ? bookById(sentence.bookId) : undefined;
    return sentence && book ? [{ ...e, sentence, book }] : [];
  });
}

/** 두 번 이상 만났다는 것 — 서랍이 보여주려는 사실이 이것뿐이다. */
export const isReencountered = (item: LexicalItem) => item.encounters.length > 1;

/** 이 항목이 건너온 책들, 중복 없이 */
export function booksOf(item: LexicalItem): Book[] {
  const seen = new Set<string>();
  const books: Book[] = [];
  for (const { book } of encountersOf(item)) {
    if (seen.has(book.id)) continue;
    seen.add(book.id);
    books.push(book);
  }
  return books;
}

/** 카드에 한 줄만 보일 때 쓸 문장 — 가장 최근에 만난 쪽 */
export function latestEncounter(item: LexicalItem): ResolvedEncounter | undefined {
  const all = encountersOf(item);
  return all[all.length - 1];
}

/**
 * 처음 만난 날과 마지막으로 만난 날 사이. 이 간격이 제품의 요지다 —
 * 6개월 만에 같은 걸 또 헷갈렸다는 사실만큼 설득력 있는 화면은 없다.
 */
export function gapLabel(item: LexicalItem): string | undefined {
  if (item.encounters.length < 2) return undefined;
  const first = new Date(item.encounters[0].savedOn).getTime();
  const last = new Date(item.encounters[item.encounters.length - 1].savedOn).getTime();
  const days = Math.round((last - first) / 86_400_000);
  if (days < 1) return '같은 날';
  if (days < 30) return `${days}일 만에`;
  return `${Math.round(days / 30)}개월 만에`;
}

/** 이 책에서 건져 올린 항목들 — 책 화면이 보는 목록 */
export function itemsFromBook(bookId: string): LexicalItem[] {
  return ITEMS.filter((item) =>
    item.encounters.some((e) => sentenceById(e.sentenceId)?.bookId === bookId),
  );
}

/**
 * 어휘 항목이 딸리지 않은 문장 — 뜻을 몰라서가 아니라 그냥 좋아서 담아둔 줄이다.
 * 서랍은 항목별로 모이므로 이 문장들은 갈 곳이 없다. 그래서 책에 남는다. (Q25)
 */
export function likedSentencesOf(bookId: string): Sentence[] {
  const claimed = new Set(ITEMS.flatMap((i) => i.encounters.map((e) => e.sentenceId)));
  return SENTENCES.filter((s) => s.bookId === bookId && !claimed.has(s.id));
}

/**
 * 오늘 다시 볼 표현 하나. 아직 헷갈린다고 둔 것 중에서 처음과 마지막 사이가
 * 가장 벌어진 항목을 고른다 — 오래 잊고 지내다 또 걸린 표현일수록 오늘 다시
 * 꺼낼 이유가 크다. 재회한 항목이 아직 없으면 가장 최근에 담은 것을 준다.
 */
export function todayItem(): LexicalItem | undefined {
  const confused = ITEMS.filter((i) => i.status === '헷갈려요');
  if (!confused.length) return undefined;
  const span = (item: LexicalItem) => {
    const days = item.encounters.map((e) => new Date(e.savedOn).getTime());
    return Math.max(...days) - Math.min(...days);
  };
  const latest = (item: LexicalItem) =>
    Math.max(...item.encounters.map((e) => new Date(e.savedOn).getTime()));
  return [...confused].sort((a, b) => span(b) - span(a) || latest(b) - latest(a))[0];
}
