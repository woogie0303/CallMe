/*
 * 제스처 콜백(onBegin·onUpdate…)은 렌더 중이 아니라 손이 움직일 때 돈다. React
 * Compiler 규칙은 그걸 구분하지 못해 콜백 안의 ref를 '렌더 중 접근'으로 본다.
 */
/* eslint-disable react-hooks/refs */
import { useRef } from 'react';
import { Gesture } from 'react-native-gesture-handler';

import { rangesOf, toggleRange, type Range } from '@/shared/ocr/selection';

type Point = { x: number; y: number };

/**
 * 단어 위에서 **누르면 따로, 끌면 한 덩어리로** 고르는 손짓. 사진 위의 단어와 손으로
 * 적은 글의 단어가 같은 손짓을 쓴다 — 어디서 고르든 손이 같은 것을 기억한다.
 *
 * - 누르기: 단어 하나가 **독립된 표현**이다. 바로 옆 단어가 이미 골라져 있어도 합치지
 *   않는다. 이미 고른 표현 위를 누르면 그 표현 전체가 풀린다.
 * - 끌기: 처음 닿은 단어부터 지금 손가락 아래 단어까지가 **표현 하나**다. 되돌아 끌면
 *   줄어든다 — 끌기 전의 상태(`base`)에서 매번 다시 계산하기 때문이다. 문장 끝(`.` `?`
 *   `!`)을 넘어가지는 못한다(`clamp`) — 두 문장에 걸친 표현은 하나로 묻기 어렵다.
 *   이미 고른 표현에서 끌기 시작하면 그 표현이 풀린다(누르기와 같다).
 *
 * `horizontal`이면 옆으로 움직일 때만 끌기가 시작된다 — 스크롤 안에 놓였을 때
 * 위아래 손짓은 스크롤에 양보한다.
 *
 * 콜백은 JS에서 돈다(`runOnJS(true)`). 단어가 어디 있는지 재는 일(`hit`)이 화면
 * 상태를 읽어야 해서다 — 단어 수가 한 쪽 분량이라 충분히 빠르다.
 */
export function useWordPaint({
  hit,
  ranges,
  onChange,
  clamp,
  horizontal = false,
}: {
  /** 이 점 아래의 단어 번호. 없으면 null */
  hit: (point: Point) => number | null;
  ranges: Range[];
  /** 받으면 true — 상한에 걸려 거절하면 끌기는 마지막으로 받은 상태에 머문다 */
  onChange: (next: Range[]) => boolean;
  /** 이 단어에서 시작한 표현이 뻗을 수 있는 범위(그 단어가 든 문장) */
  clamp?: (anchor: number) => Range;
  horizontal?: boolean;
}) {
  /**
   * 끄는 동안의 상태. 손이 움직일 때마다 고르기가 바뀌어 다시 그려지는데, 그 사이에도
   * 끌기 시작한 자리와 그때의 고르기는 그대로 있어야 한다 — 그래서 렌더 밖에 둔다.
   */
  const drag = useRef<{
    start: Point;
    anchor: number | null;
    base: Range[];
    /** 이미 고른 표현에서 시작해 그 표현을 풀었다 — 더는 칠하지 않는다 */
    erased: boolean;
  } | null>(null);

  const paintTo = (point: Point) => {
    const d = drag.current;
    if (!d || d.erased) return;
    if (d.anchor === null) {
      const anchor = hit(d.start) ?? hit(point);
      if (anchor === null) return;
      d.anchor = anchor;
      if (d.base.some((r) => anchor >= r.from && anchor <= r.to)) {
        d.erased = true;
        onChange(toggleRange(d.base, anchor));
        return;
      }
    }
    const end = hit(point);
    if (end === null) return;

    const bound = clamp?.(d.anchor);
    const lo = Math.max(Math.min(d.anchor, end), bound?.from ?? 0);
    const hi = Math.min(Math.max(d.anchor, end), bound?.to ?? Infinity);
    onChange(rangesOf([...d.base, { from: lo, to: hi }]));
  };

  const pan = Gesture.Pan().runOnJS(true);
  if (horizontal) pan.activeOffsetX([-10, 10]).failOffsetY([-12, 12]);
  else pan.minDistance(6);
  pan
    .onBegin((e) => {
      drag.current = {
        start: { x: e.x, y: e.y },
        anchor: null,
        base: ranges.map((r) => ({ ...r })),
        erased: false,
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
      onChange(toggleRange(ranges, index));
    });

  return Gesture.Race(pan, tap);
}
