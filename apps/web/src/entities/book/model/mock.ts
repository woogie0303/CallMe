import type { Book } from './types';

export const BOOKS: Book[] = [
  {
    id: 'klara',
    title: 'Klara and the Sun',
    author: 'Kazuo Ishiguro',
    publisher: 'Faber',
    year: 2021,
    pages: 303,
    spine: 'linear-gradient(150deg,#0066FF,#5B37ED)',
    genre: '소설',
    level: '보통',
    rating: 4.2,
    raters: 12480,
    summary:
      '태양광으로 움직이는 인공 친구 클라라가 쇼윈도 너머의 세계를 관찰하며, 함께 살게 된 소녀 조시를 지켜보는 이야기. 담백한 1인칭 서술과 반복되는 일상 표현이 많아 회화 연습에 잘 맞아요.',
  },
  {
    id: 'normal-people',
    title: 'Normal People',
    author: 'Sally Rooney',
    pages: 266,
    spine: 'linear-gradient(150deg,#00BF40,#0066FF)',
    genre: '소설',
    level: '쉬움',
  },
  {
    id: 'remains',
    title: 'The Remains of the Day',
    author: 'Kazuo Ishiguro',
    pages: 258,
    spine: 'linear-gradient(150deg,#FF9200,#FF4242)',
    genre: '소설',
    level: '어려움',
  },
  {
    id: 'piranesi',
    title: 'Piranesi',
    author: 'Susanna Clarke',
    pages: 245,
    spine: 'linear-gradient(150deg,#6541F2,#0F0F10)',
    genre: '판타지',
    level: '보통',
  },
  {
    id: 'small-things',
    title: 'Small Things Like These',
    author: 'Claire Keegan',
    pages: 116,
    spine: 'linear-gradient(150deg,#00A8E8,#5B37ED)',
    genre: '소설',
    level: '쉬움',
  },
];

export const bookById = (id: string) => BOOKS.find((b) => b.id === id);
