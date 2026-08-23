export type Book = {
  id: string;
  title: string;
  author: string;
  publisher?: string;
  year?: number;
  pages: number;
  /** 책등 색. 표지가 없어도 이 색이 출처를 대신한다. */
  spine: string;
  genre?: string;
  level?: '쉬움' | '보통' | '어려움';
  rating?: number;
  raters?: number;
  summary?: string;
};
