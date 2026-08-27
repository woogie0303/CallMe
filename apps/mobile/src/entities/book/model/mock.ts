import type { Book } from './types';

/** 웹(apps/web/src/entities/book/model/mock.ts)과 같은 책, 같은 책등 색이다. */
export const BOOKS: Book[] = [
  {
    id: 'klara',
    title: 'Klara and the Sun',
    author: 'Kazuo Ishiguro',
    publisher: 'Faber',
    year: 2021,
    pages: 303,
    spine: ['#0066FF', '#5B37ED'],
    genre: '소설',
    level: '보통',
    rating: 4.2,
    raters: 12480,
    summary:
      '태양광으로 움직이는 인공 친구 클라라가 쇼윈도 너머의 세계를 관찰하며, 함께 살게 된 소녀 조시를 지켜보는 이야기. 담백한 1인칭 서술과 반복되는 일상 표현이 많아 회화 연습에 잘 맞아요.',
    primer:
      '1인칭 관찰 시점이라 “I noticed that…”, “It seemed to me…” 같은 표현이 자주 나와요. 회화에서 바로 쓸 수 있는 문장들이에요.',
  },
  {
    id: 'normal-people',
    title: 'Normal People',
    author: 'Sally Rooney',
    pages: 266,
    spine: ['#00BF40', '#0066FF'],
    genre: '소설',
    level: '쉬움',
  },
  {
    id: 'remains',
    title: 'The Remains of the Day',
    author: 'Kazuo Ishiguro',
    pages: 258,
    spine: ['#FF9200', '#FF4242'],
    genre: '소설',
    level: '어려움',
  },
  {
    id: 'piranesi',
    title: 'Piranesi',
    author: 'Susanna Clarke',
    pages: 245,
    spine: ['#6541F2', '#0F0F10'],
    genre: '판타지',
    level: '보통',
  },
  {
    id: 'small-things',
    title: 'Small Things Like These',
    author: 'Claire Keegan',
    pages: 116,
    spine: ['#00A8E8', '#5B37ED'],
    genre: '소설',
    level: '쉬움',
  },
];

export const bookById = (id: string) => BOOKS.find((b) => b.id === id);

/** 다음에 읽어볼 만한 책 — 지금 읽는 책은 뺀다. */
export const NEXT_BOOKS = BOOKS.filter((b) => b.id !== 'klara');
