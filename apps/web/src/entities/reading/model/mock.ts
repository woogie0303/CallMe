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

export type ReadingYear = {
  /** 올해 읽은 날 수 */
  days: number;
  /** 연속 일수 */
  streak: number;
  /** 0=안 읽음, 1~4=읽은 양. 7행 × 52주. */
  weeks: number[][];
};

/** 재현 가능한 목업 — 매 렌더 같은 그림이 나와야 한다. */
function buildYear(): ReadingYear {
  const weeks: number[][] = [];
  let seed = 20260824;
  const next = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  let days = 0;
  let streak = 0;
  for (let w = 0; w < 52; w += 1) {
    const col: number[] = [];
    // 뒤로 갈수록 습관이 붙는다 — 최근 주가 더 진하다.
    const momentum = 0.25 + (w / 52) * 0.5;
    for (let d = 0; d < 7; d += 1) {
      const r = next();
      // 읽는 날이 늘어날 뿐 아니라 한 번에 읽는 양도 같이 늘어난다.
      const level =
        r > 1 - momentum
          ? Math.min(4, 1 + Math.floor(next() * (1 + momentum * 3.4)))
          : 0;
      if (level > 0) days += 1;
      col.push(level);
    }
    weeks.push(col);
  }
  // 마지막 9일은 연속으로 채운다 — 사이드바의 "연속 9일"과 같은 사실이어야 한다.
  streak = 9;
  const flat: Array<[number, number]> = [];
  for (let w = 51; w >= 0; w -= 1)
    for (let d = 6; d >= 0; d -= 1) flat.push([w, d]);
  flat.slice(0, streak).forEach(([w, d]) => {
    if (weeks[w][d] === 0) days += 1;
    weeks[w][d] = Math.max(2, weeks[w][d]);
  });
  return { days, streak, weeks };
}

export const READING_YEAR: ReadingYear = buildYear();
