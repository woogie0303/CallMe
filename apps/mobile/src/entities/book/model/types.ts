export type Book = {
  id: string;
  title: string;
  author: string;
  publisher?: string;
  year?: number;
  pages: number;
  /**
   * 책등 색. 표지가 없어도 이 색이 출처를 대신한다 —
   * 문장·표현 카드가 이 색을 물려받아 라벨 없이 어느 책인지 알려준다.
   */
  spine: readonly [string, string];
  genre?: string;
  level?: '쉬움' | '보통' | '어려움';
  rating?: number;
  raters?: number;
  summary?: string;
  /** 읽기 전에 알아두면 좋은 것 — 이 책의 문장이 어떤 결인지 */
  primer?: string;
};
