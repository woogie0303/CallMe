/*
 * 제스처 콜백(onBegin·onUpdate…)은 렌더 중이 아니라 손이 움직일 때 돈다. React
 * Compiler 규칙은 그걸 구분하지 못해 콜백 안의 ref를 '렌더 중 접근'으로 본다.
 */
/* eslint-disable react-hooks/refs */
import { useRef } from 'react';
import { Gesture } from 'react-native-gesture-handler';

type Point = { x: number; y: number };

/**
 * 낱말 위에서 **누르면 하나, 끌면 지나간 만큼** 고르는 손짓. 사진 위의 낱말과
 * 손으로 적은 글의 낱말이 같은 손짓을 쓴다 — 어디서 고르든 손이 같은 것을 기억한다.
 *
 * - 누르기: 그 낱말을 고르거나 푼다.
 * - 끌기: 처음 닿은 낱말부터 지금 손가락 아래 낱말까지 읽는 순서로 칠한다. 처음
 *   닿은 낱말이 이미 골라져 있었으면 지우개가 된다. 되돌아 끌면 칠한 것도 줄어든다
 *   — 끌기 전의 상태(`base`)에서 매번 다시 계산하기 때문이다.
 *
 * 붙은 낱말은 하나의 표현(구)이 되므로, 끌기는 "구를 한 번에 고르는 빠른 길"이고
 * 낱말을 하나씩 눌러도 같은 결과가 된다. 그래서 끌 수 없는 사람(스크린리더)도
 * 구를 고를 수 있다.
 *
 * `horizontal`이면 옆으로 움직일 때만 끌기가 시작된다 — 스크롤 안에 놓였을 때
 * 위아래 손짓은 스크롤에 양보한다.
 *
 * 콜백은 JS에서 돈다(`runOnJS(true)`). 낱말이 어디 있는지 재는 일(`hit`)이 화면
 * 상태를 읽어야 해서다 — 낱말 수가 한 쪽 분량이라 충분히 빠르다.
 */
export function useWordPaint({
  hit,
  selected,
  onChange,
  horizontal = false,
}: {
  /** 이 점 아래의 낱말 번호. 없으면 null */
  hit: (point: Point) => number | null;
  selected: ReadonlySet<number>;
  /** 받으면 true — 상한에 걸려 거절하면 끌기는 마지막으로 받은 상태에 머문다 */
  onChange: (next: ReadonlySet<number>) => boolean;
  horizontal?: boolean;
}) {
  /**
   * 끄는 동안의 상태. 손이 움직일 때마다 고르기가 바뀌어 다시 그려지는데, 그 사이에도
   * 끌기 시작한 자리와 그때의 고르기는 그대로 있어야 한다 — 그래서 렌더 밖에 둔다.
   */
  const drag = useRef<{
    start: Point;
    anchor: number | null;
    base: ReadonlySet<number>;
    erase: boolean;
  } | null>(null);

  const paintTo = (point: Point) => {
    const d = drag.current;
    if (!d) return;
    if (d.anchor === null) {
      const anchor = hit(d.start) ?? hit(point);
      if (anchor === null) return;
      d.anchor = anchor;
      d.erase = d.base.has(anchor);
    }
    const end = hit(point);
    if (end === null) return;

    const next = new Set(d.base);
    const lo = Math.min(d.anchor, end);
    const hi = Math.max(d.anchor, end);
    for (let i = lo; i <= hi; i += 1) {
      if (d.erase) next.delete(i);
      else next.add(i);
    }
    onChange(next);
  };

  const pan = Gesture.Pan().runOnJS(true);
  if (horizontal) pan.activeOffsetX([-10, 10]).failOffsetY([-12, 12]);
  else pan.minDistance(6);
  pan
    .onBegin((e) => {
      drag.current = {
        start: { x: e.x, y: e.y },
        anchor: null,
        base: new Set(selected),
        erase: false,
      };
    })
    .onStart((e) => paintTo({ x: e.x, y: e.y }))
    .onUpdate((e) => paintTo({ x: e.x, y: e.y }))
    .onFinalize(() => {
      drag.current = null;
    });

  const tap = Gesture.Tap()
    .runOnJS(true)
    .maxDistance(8)
    .onEnd((e, success) => {
      if (!success) return;
      const index = hit({ x: e.x, y: e.y });
      if (index === null) return;
      const next = new Set(selected);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      onChange(next);
    });

  return Gesture.Race(pan, tap);
}
