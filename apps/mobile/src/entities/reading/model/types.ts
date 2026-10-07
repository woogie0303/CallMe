/**
 * 읽고 있는 책 하나의 진도. 실제 값은 서버에서 온다
 * (`entities/reading/api/reading.api.ts`, `entities/book/api/book.api.ts`) —
 * 여기서는 화면이 주고받을 모양만 정한다.
 */
export type ReadingProgress = {
  bookId: string;
  currentPage: number;
  totalPages: number;
  /**
   * 아직 화면이 쓰지 않는다. 서버가 챕터를 주기 시작하면 그때 그리면 되고,
   * 그때까지는 없어도 되는 값이라 비워둔다 — 필수로 두면 부르는 쪽이
   * 빈 문자열을 지어내서 채우게 된다.
   */
  chapter?: string;
  /** 이 책을 펴기 시작한 날 */
  startedLabel?: string;
  /** 아직 한 번도 안 폈으면 없다 — 없다는 사실 자체를 화면이 말하지 않는다 */
  lastReadLabel?: string;
};

export type ReadingDay = {
  label: string;
  /** 그날 읽은 양, 0~1. 그 주에 가장 많이 읽은 날이 1이다. */
  amount: number;
  /** 그날 실제로 읽은 쪽수 — 막대 높이는 비율이지만 합계는 이쪽에서 센다 */
  pages: number;
  /** 오늘 — 아직 지나지 않은 날이라 라벨로만 표시한다 */
  today?: boolean;
};

export type ReadingWeek = {
  monthLabel: string;
  /** 이번 주에 읽은 날 수 */
  days: number;
  /** 이레치 합계 쪽수 — 막대는 비율만 말하므로 양은 글로 적는다 */
  pages: number;
  /** 연속 일수 — 지난주까지 이어진다 */
  streak: number;
  bars: ReadingDay[];
};

export type ReadingCalendarDay = { date: Date; pages: number };

export type GenreShare = {
  genre: string;
  pages: number;
  /** 전체 대비 비율, 0~1 — 막대 폭을 정한다 */
  ratio: number;
};
