export type Book = {
  id: string;
  title: string;
  author: string;
  publisher?: string;
  year?: number;
  pages: number;
  /**
   * 읽은 데까지. 지금 읽는 책이 아니어도 온다 — '읽기 전에'를 펼칠지 접을지
   * 정하려면 그 책을 편 적이 있는지 알아야 하고, 진도는 그 책 문서가 이미 안다.
   */
  currentPage?: number;
  /**
   * 책등 색. 표지가 없어도 이 색이 출처를 대신한다 —
   * 문장·표현 카드가 이 색을 물려받아 라벨 없이 어느 책인지 알려준다.
   */
  spine: readonly [string, string];
  /**
   * 실제 표지 이미지. 못 받아오면 책등 그라디언트가 그대로 남는다 —
   * 표지는 있으면 좋은 것이고, 출처를 말하는 일은 여전히 책등 색이 한다.
   */
  cover?: string;
  genre?: string;
  level?: '쉬움' | '보통' | '어려움';
  rating?: number;
  raters?: number;
  summary?: string;
  /** 읽기 전에 알아두면 좋은 것 — 이 책의 문장이 어떤 결인지 */
  primer?: string;
};
