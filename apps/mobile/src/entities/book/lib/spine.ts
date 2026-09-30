import type { Book } from '../model/types';

/**
 * 책등 색은 라벨 없이 출처를 말하는 일을 한다. 직접 등록한 책에는 표지가 없을
 * 때가 많아서, 제목에서 색을 정해준다 — 같은 책은 언제나 같은 색으로 서고,
 * 나란히 놓인 책들끼리는 서로 다른 색이 될 가능성이 크다.
 */
const SPINES: readonly (readonly [string, string])[] = [
  ['#C74B3F', '#8E2F26'],
  ['#3F5B8E', '#26375C'],
  ['#4A7C59', '#2E5138'],
  ['#8E6B3F', '#5C4526'],
  ['#6B4A8E', '#432E5C'],
  ['#2F6F7C', '#1D474F'],
  ['#8E3F6B', '#5C2643'],
  ['#5C6784', '#3B4258'],
];

export function spineFor(title: string): readonly [string, string] {
  let seed = 0;
  for (const char of title.trim())
    seed = (seed * 31 + char.charCodeAt(0)) % 100_003;
  return SPINES[seed % SPINES.length];
}

/** 아직 저장되지 않은 책 — 입력하는 동안 표지를 미리 그려 보여준다 */
export function draftBook(title: string, author: string, pages?: number): Book {
  return {
    id: 'draft',
    title: title.trim() || '제목',
    author: author.trim() || '지은이',
    pages: pages ?? 0,
    spine: spineFor(title),
  };
}
