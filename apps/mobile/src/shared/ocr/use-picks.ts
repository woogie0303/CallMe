import { useCallback, useMemo, useState } from 'react';

import { groupBySentence, overflows, type Limit } from './selection';

type Word = { text: string };

/**
 * 고른 낱말들. 사진 위에서든 손으로 적은 글 위에서든 같은 상태를 쓴다.
 *
 * 고른 것은 낱말 번호의 집합 하나뿐이고, 문장과 표현(붙은 낱말 덩어리)은 거기서
 * 매번 계산한다(`groupBySentence`) — 따로 들고 있으면 낱말 하나를 빼는 순간
 * 문장 목록과 어긋난다.
 *
 * 한 번에 물을 수 있는 것을 넘기는 변화(`overflows`)는 받지 않고, 막혔다는 것만
 * `limit`(이유와 시각)으로 알린다 — 화면이 그 시각이 바뀔 때마다 배지를 흔든다.
 *
 * `whole`이면 글 전체를 한 문장으로 묻는다 — 손으로 적은 글이 그렇다.
 */
export function usePicks(words: Word[], { whole = false } = {}) {
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());
  const [limit, setLimit] = useState<{ reason: Limit; at: number } | null>(
    null,
  );

  const groups = useMemo(
    () => groupBySentence(words, selected),
    [words, selected],
  );

  /** 통째로 바꾼다 — 끄는 동안 매 순간 이 길로 온다. 받았으면 true. */
  const change = useCallback(
    (next: ReadonlySet<number>) => {
      const reason = overflows(words, next, { whole });
      if (reason) {
        setLimit({ reason, at: Date.now() });
        return false;
      }
      setSelected(next);
      /** 다시 고를 수 있게 되었으니 막혔다는 말은 거둔다 */
      setLimit(null);
      return true;
    },
    [words, whole],
  );

  const toggle = useCallback(
    (index: number) => {
      const next = new Set(selected);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return change(next);
    },
    [selected, change],
  );

  /** 표현 하나(붙은 낱말 덩어리)를 통째로 뺀다 — 시트의 칩에서 */
  const unpick = useCallback((from: number, to: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (let i = from; i <= to; i += 1) next.delete(i);
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  return { selected, groups, change, toggle, unpick, clear, limit };
}
