import { spineFor } from '@/entities/book/lib/spine';
import type { Book } from '@/entities/book/model/types';
import type { SentenceCardData } from '@/entities/sentence/model/types';
import { savedLabel } from '@/shared/lib/date';
import type { ItemSummary } from '../api/item.api';

/**
 * **개발 빌드에서만 쓰는 가짜 서랍.**
 *
 * 담아둔 것이 하나도 없으면 홈의 '오늘 다시 볼 문장'도, 서랍의 문장 카드도
 * 전부 빈 자리로만 보여서 디자인을 눈으로 볼 수가 없다. 그래서 `__DEV__`이고
 * 진짜 기록이 0일 때만 이 열 줄을 대신 그린다 — `reading/lib/sample.ts`,
 * `sign-in.tsx`의 개발용 문과 같은 종류의 임시 장치다.
 *
 * 배포 빌드에서는 **실행되지 않는다**(`__DEV__`가 false라 부르는 자리가 죽는다).
 * 다만 Metro가 모듈 경계를 넘어 죽은 코드를 걷어내지는 않아서 함수 자체는
 * 번들에 남는다.
 *
 * **디자인 확인이 끝나면 이 파일과 부르는 자리 둘(`useItems`·`useSentenceFeed`)을
 * 함께 지운다.**
 *
 * 고른 표현들은 ADR-0001이 예로 든 것과 같은 결이다 — 낱말 뜻을 합쳐서는
 * 뜻이 나오지 않는 구동사·연어라, 문장 없이는 어느 뜻인지 고를 수 없는 것들.
 */

const BOOKS: Book[] = [
  mockBook('klara', 'Klara and the Sun', 'Kazuo Ishiguro', 303),
  mockBook('never', 'Never Let Me Go', 'Kazuo Ishiguro', 288),
  mockBook('normal', 'Normal People', 'Sally Rooney', 266),
];

function mockBook(
  id: string,
  title: string,
  author: string,
  pages: number,
): Book {
  return { id: `sample-${id}`, title, author, pages, spine: spineFor(title) };
}

/** 표현 하나와, 그것을 만난 문장 하나 */
type Seed = {
  term: string;
  surface: string;
  meaning: string;
  sentence: string;
  page: number;
  book: Book;
  /** 몇 번 만났는지. 2 이상이면 재회다. */
  met: number;
  /** 처음과 마지막 사이의 날수 — '2개월 만에'로 옮기는 일은 화면이 한다 */
  gapDays?: number;
  /** 며칠 전에 담았는지 */
  ago: number;
};

const SEEDS: Seed[] = [
  {
    term: 'make out',
    surface: 'make out',
    meaning: '흐릿하거나 멀어서 겨우 알아보다',
    sentence: 'I could not make out whether it was a statue or a person.',
    page: 41,
    book: BOOKS[0],
    met: 3,
    gapDays: 64,
    ago: 0,
  },
  {
    term: 'for the time being',
    surface: 'For the time being',
    meaning: '당분간은, 우선은',
    sentence: 'For the time being, we agreed to say nothing to the others.',
    page: 88,
    book: BOOKS[0],
    met: 2,
    gapDays: 31,
    ago: 1,
  },
  {
    term: 'come to terms with',
    surface: 'come to terms with',
    meaning: '(힘든 일을) 받아들이게 되다',
    sentence:
      'She had never quite come to terms with what happened that summer.',
    page: 152,
    book: BOOKS[1],
    met: 2,
    gapDays: 12,
    ago: 2,
  },
  {
    term: 'the better part of',
    surface: 'the better part of',
    meaning: '~의 대부분, 거의 ~ 내내',
    sentence: 'He spent the better part of an hour staring at the ceiling.',
    page: 19,
    book: BOOKS[2],
    met: 1,
    ago: 3,
  },
  {
    term: 'take after',
    surface: 'took after',
    meaning: '(부모나 윗사람을) 닮다',
    sentence: 'Everyone said the boy took after his grandfather.',
    page: 204,
    book: BOOKS[1],
    met: 1,
    ago: 4,
  },
  {
    term: 'let on',
    surface: 'let on',
    meaning: '(아는 것을) 내색하다, 티 내다',
    sentence: 'She never let on that she had already read the letter.',
    page: 77,
    book: BOOKS[2],
    met: 2,
    gapDays: 8,
    ago: 5,
  },
  {
    term: 'put up with',
    surface: 'put up with',
    meaning: '참고 견디다',
    sentence: "I don't know how she put up with him for so long.",
    page: 133,
    book: BOOKS[2],
    met: 1,
    ago: 6,
  },
  {
    term: 'wear thin',
    surface: 'wearing thin',
    meaning: '(인내심이) 바닥나기 시작하다',
    sentence: 'His patience was wearing thin by the time they arrived.',
    page: 246,
    book: BOOKS[1],
    met: 1,
    ago: 8,
  },
  {
    term: 'on the verge of',
    surface: 'on the verge of',
    meaning: '막 ~하려는 참인',
    sentence: 'They were on the verge of leaving when the phone rang.',
    page: 60,
    book: BOOKS[0],
    met: 1,
    ago: 11,
  },
  {
    term: 'get around to',
    surface: 'got around to',
    meaning: '(미루다가) 결국 ~하게 되다',
    sentence: 'I never got around to asking her name.',
    page: 12,
    book: BOOKS[2],
    met: 1,
    ago: 14,
  },
];

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

/** 서랍에 담긴 표현 열 개 — `useItems`가 빈손일 때 대신 쓴다 */
export function sampleItems(): ItemSummary[] {
  return SEEDS.map((seed, i) => {
    const sentenceId = `sample-sentence-${i}`;
    const at = daysAgo(seed.ago);
    return {
      id: `sample-item-${i}`,
      term: seed.term,
      meaning: seed.meaning,
      /** 재회가 있는 것만 아직 헷갈리는 것으로 둔다 — 오늘의 문장이 그중에서 뽑힌다 */
      status: seed.met > 1 ? '헷갈려요' : '외웠어요',
      met: seed.met,
      encounters: [{ sentenceId, surface: seed.surface }],
      gapDays: seed.gapDays,
      books: [seed.book],
      latest: {
        sentenceId,
        text: seed.sentence,
        page: seed.page,
        bookTitle: seed.book.title,
        savedLabel: savedLabel(at),
      },
    };
  });
}

/** 같은 열 줄을 서랍의 문장 카드 모양으로 — `useSentenceFeed`가 빈손일 때 */
export function sampleFeed(): SentenceCardData[] {
  return SEEDS.map((seed, i) => {
    const at = daysAgo(seed.ago);
    return {
      id: `sample-sentence-${i}`,
      text: seed.sentence,
      page: seed.page,
      book: seed.book,
      asked: true,
      translation: seed.meaning,
      marks: [
        {
          surface: seed.surface,
          term: seed.term,
          meaning: seed.meaning,
          itemId: `sample-item-${i}`,
          met: seed.met,
        },
      ],
      claimed: true,
      savedLabel: savedLabel(at),
      savedAt: at,
    };
  });
}
