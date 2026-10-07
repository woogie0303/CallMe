import type { OcrWord } from './text-extractor';

/** 한 줄 안에서 이어 칠할 하나의 띠 — 돌리기 전의 네모와 돌린 각도(라디안, 시계 방향) */
export type Band = {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
};

/**
 * 고른 낱말 범위를 **줄마다 하나의 띠**로 묶는다. 낱말마다 칠하면 사이 틈이 비어서
 * 글을 따라 낱알이 찍힌 것처럼 보이는데, 손으로 적은 글에서는 붙은 낱말이 한 덩어리로
 * 칠해진다 — 사진 위도 그렇게 보여야 같은 손짓이 같은 결과를 낸다.
 *
 * 기울어진 줄에서는 띠의 방향·수직 위치·높이를 **그 줄 전체 낱말의 중앙값**으로 정한다
 * (`words` 전체에서 `line`이 같은 것을 모아 구한다. 뜻풀이 범위 안의 낱말만으로는 한
 * 글자짜리 낱말 하나가 줄 전체를 대표해버릴 수 있다). Vision은 낱말마다 따로 칸을
 * 읽어서 글자 하나짜리처럼 짧은 낱말은 각도가 줄 전체보다 더 튀는데, 중앙값을 쓰면
 * 그 낱말 하나가 띠를 비뚤게 끌고 가지 않는다. 가로 폭(왼쪽·오른쪽 끝)만 뜻풀이
 * 범위 안의 낱말로 잰다 — 거기까지 줄 전체로 재면 옆 낱말까지 칠해진다.
 */
export function bandsOf(words: OcrWord[], from: number, to: number): Band[] {
  const byLine = new Map<number, OcrWord[]>();
  for (let i = from; i <= to; i += 1) {
    const word = words[i];
    if (!word) continue;
    const row = byLine.get(word.line);
    if (row) row.push(word);
    else byLine.set(word.line, [word]);
  }

  const lineStats = new Map<
    number,
    { angle: number; ux: number; uy: number; nx: number; ny: number; across: number; height: number }
  >();
  const statsFor = (line: number) => {
    const cached = lineStats.get(line);
    if (cached) return cached;

    const siblings = words.filter((word) => word.line === line);
    const angle = median(siblings.map((word) => word.frame.angle ?? 0));
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    /** 줄에 수직인 방향 */
    const nx = -uy;
    const ny = ux;
    const across = median(
      siblings.map(({ frame }) => {
        const cx = frame.x + frame.width / 2;
        const cy = frame.y + frame.height / 2;
        return cx * nx + cy * ny;
      }),
    );
    const height = median(siblings.map((word) => word.frame.height));

    const stats = { angle, ux, uy, nx, ny, across, height };
    lineStats.set(line, stats);
    return stats;
  };

  return [...byLine.values()].map((row) => {
    const { angle, ux, uy, nx, ny, across, height } = statsFor(row[0].line);

    let left = Infinity;
    let right = -Infinity;
    for (const { frame } of row) {
      const cx = frame.x + frame.width / 2;
      const cy = frame.y + frame.height / 2;
      const along = cx * ux + cy * uy;
      left = Math.min(left, along - frame.width / 2);
      right = Math.max(right, along + frame.width / 2);
    }

    const mid = (left + right) / 2;
    const cx = mid * ux + across * nx;
    const cy = mid * uy + across * ny;
    const width = right - left;
    return { x: cx - width / 2, y: cy - height / 2, width, height, angle };
  });
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}
