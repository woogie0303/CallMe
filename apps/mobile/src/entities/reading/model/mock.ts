export type ReadingProgress = {
  bookId: string;
  currentPage: number;
  totalPages: number;
  chapter: string;
  /** 이 책을 펴기 시작한 날 */
  startedLabel: string;
  lastReadLabel: string;
};

export const CURRENT_READING: ReadingProgress = {
  bookId: 'klara',
  currentPage: 132,
  totalPages: 303,
  chapter: 'Chapter 12',
  startedLabel: '2026. 2. 1. 부터',
  lastReadLabel: '어제 읽었어요',
};

export type ReadingDay = {
  label: string;
  /** 그날 읽은 양, 0~1. 0이면 안 읽은 날 */
  amount: number;
  /** 오늘 — 아직 지나지 않은 날이라 채우지 않고 테두리만 그린다 */
  today?: boolean;
};

export type ReadingWeek = {
  monthLabel: string;
  /** 이번 주에 읽은 날 수 */
  days: number;
  /** 연속 일수 — 지난주까지 이어진다 */
  streak: number;
  bars: ReadingDay[];
};

/**
 * 분기 히트맵을 주간 막대로 바꿨다. 칸 91개는 훑는 그림이었고,
 * 이건 이번 주에 내가 어떻게 읽었는지를 하루 단위로 보여준다.
 *
 * 숫자끼리 어긋나지 않게 맞춰뒀다 — 월~토를 모두 읽어서 6일이고,
 * 지난주에서 사흘이 이어져 연속 9일이다. 오늘은 아직 읽지 않았다.
 */
export const READING_WEEK: ReadingWeek = {
  monthLabel: '8월',
  days: 6,
  streak: 9,
  bars: [
    { label: '월', amount: 0.4 },
    { label: '화', amount: 0.85 },
    { label: '수', amount: 0.2 },
    { label: '목', amount: 1 },
    { label: '금', amount: 0.55 },
    { label: '토', amount: 0.35 },
    { label: '오늘', amount: 0, today: true },
  ],
};
