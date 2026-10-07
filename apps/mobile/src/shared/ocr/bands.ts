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
 * 기울어진 줄에서는 띠의 방향을 줄의 첫 낱말이 정한다. 각 낱말의 중심을 그 방향의
 * 축에 내려서 가장 왼쪽과 오른쪽 끝을 찾고, 수직 방향은 낱말 중심의 평균에 둔다 —
 * 반듯한 네모의 합집합이 아니라 **줄을 따라 돌아간** 합집합이라서 기울어진 사진에서도
 * 위아래 줄을 덮지 않는다.
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

  return [...byLine.values()].map((row) => {
    const angle = row[0].frame.angle ?? 0;
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    /** 줄에 수직인 방향 */
    const nx = -uy;
    const ny = ux;

    let left = Infinity;
    let right = -Infinity;
    let across = 0;
    let height = 0;
    for (const { frame } of row) {
      const cx = frame.x + frame.width / 2;
      const cy = frame.y + frame.height / 2;
      const along = cx * ux + cy * uy;
      left = Math.min(left, along - frame.width / 2);
      right = Math.max(right, along + frame.width / 2);
      across += cx * nx + cy * ny;
      height = Math.max(height, frame.height);
    }
    across /= row.length;

    const mid = (left + right) / 2;
    const cx = mid * ux + across * nx;
    const cy = mid * uy + across * ny;
    const width = right - left;
    return { x: cx - width / 2, y: cy - height / 2, width, height, angle };
  });
}
