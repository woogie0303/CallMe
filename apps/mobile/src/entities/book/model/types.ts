import { GENRES, type Genre } from '@/shared/api/types';

export { GENRES, type Genre };

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
   * 책등 색. 표지가 없을 때 출처를 대신한다 — `BookCover`가 표지 대신 이 색과
   * 제목으로 그린다.
   */
  spine: readonly [string, string];
  /**
   * 실제 표지 이미지. 출처를 가장 빨리 알려준다 — 서랍 카드가 이걸 썸네일로 쓴다.
   * 못 받아오면 책등 그라디언트가 그대로 남는다.
   */
  cover?: string;
  genre?: Genre;
  /** 홈 맨 위에 고정했는지 — 고정한 책이 가장 최근에 읽은 책보다 앞에 선다 */
  pinned?: boolean;
  level?: '쉬움' | '보통' | '어려움';
  rating?: number;
  raters?: number;
  summary?: string;
  /** 읽기 전에 알아두면 좋은 것 — 이 책의 문장이 어떤 결인지 */
  primer?: string;
};
