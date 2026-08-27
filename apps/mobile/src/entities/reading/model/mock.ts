export type ReadingProgress = {
  bookId: string;
  currentPage: number;
  totalPages: number;
  chapter: string;
  lastReadLabel: string;
};

export const CURRENT_READING: ReadingProgress = {
  bookId: 'klara',
  currentPage: 132,
  totalPages: 303,
  chapter: 'Chapter 12',
  lastReadLabel: '어제 읽었어요',
};

export type ReadingQuarter = {
  /** 이번 분기에 읽은 날 수 */
  days: number;
  /** 연속 일수 */
  streak: number;
  /** 0=안 읽음, 1~3=읽은 양. 7행 × 13주. */
  weeks: number[][];
};

/**
 * 재현 가능한 목업 — 매 렌더 같은 그림이 나와야 한다.
 * 뒤로 갈수록 습관이 붙어서 최근 주가 더 진하다.
 */
function buildQuarter(): ReadingQuarter {
  const weeks: number[][] = [];
  let seed = 20260824;
  const next = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  let days = 0;
  for (let w = 0; w < 13; w += 1) {
    const col: number[] = [];
    const momentum = 0.42 + (w / 13) * 0.5;
    for (let d = 0; d < 7; d += 1) {
      const level = next() > 1 - momentum ? 1 + Math.floor(next() * (1 + momentum * 2.2)) : 0;
      const capped = Math.min(3, level);
      if (capped > 0) days += 1;
      col.push(capped);
    }
    weeks.push(col);
  }
  // 마지막 9일은 연속으로 채운다 — 화면의 "연속 9일"과 같은 사실이어야 한다.
  const streak = 9;
  const flat: [number, number][] = [];
  for (let w = 12; w >= 0; w -= 1) for (let d = 6; d >= 0; d -= 1) flat.push([w, d]);
  flat.slice(0, streak).forEach(([w, d]) => {
    if (weeks[w][d] === 0) days += 1;
    weeks[w][d] = Math.max(2, weeks[w][d]);
  });
  return { days, streak, weeks };
}

export const READING_QUARTER: ReadingQuarter = buildQuarter();
