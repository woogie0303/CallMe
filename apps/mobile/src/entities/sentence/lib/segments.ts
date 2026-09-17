import type { SentenceMark } from '../model/types';

/** 문장을 잘라낸 조각 하나. `mark`가 있으면 밑줄이 그어진다. */
export type Segment = {
  text: string;
  mark?: SentenceMark;
};

/**
 * 문장을 밑줄 칠 자리로 잘라낸다.
 *
 * 모델이 준 `surface`를 문장에서 찾아 그 구간만 표시로 바꾼다. 세 가지를
 * 조심한다:
 *
 * 1. **못 찾을 수 있다.** 모델이 표제형을 `surface`로 주거나 철자가 어긋나면
 *    문장에 없다. 그때는 그 표현을 조용히 건너뛴다 — 찾지 못했다고 문장을
 *    못 그리면 안 된다.
 * 2. **겹칠 수 있다.** `make out`과 `out of`처럼 구간이 물리면 먼저 잡은
 *    쪽만 남긴다. 겹친 채로 그리면 조각이 어긋나 글자가 사라진다.
 * 3. **같은 말이 여러 번 나온다.** 표현 둘이 같은 낱말을 가리키면 앞에서부터
 *    하나씩 다른 자리를 잡는다 — 둘 다 같은 구간에 밑줄을 그으면 하나가 사라진다.
 *
 * 대소문자는 무시하고 찾되, 잘라낸 글자는 **문장에 있던 그대로** 돌려준다.
 */
export function markSegments(text: string, marks: SentenceMark[]): Segment[] {
  const hay = text.toLowerCase();
  const taken: { start: number; end: number; mark: SentenceMark }[] = [];

  for (const mark of marks) {
    const needle = mark.surface?.trim().toLowerCase();
    if (!needle) continue;

    /** 이미 잡힌 구간과 겹치지 않는 첫 자리를 찾는다 */
    let from = 0;
    for (;;) {
      const start = hay.indexOf(needle, from);
      if (start < 0) break;
      const end = start + needle.length;
      const clash = taken.some((t) => start < t.end && end > t.start);
      if (!clash) {
        taken.push({ start, end, mark });
        break;
      }
      from = start + 1;
    }
  }

  if (!taken.length) return [{ text }];

  taken.sort((a, b) => a.start - b.start);

  const out: Segment[] = [];
  let at = 0;
  for (const slot of taken) {
    if (slot.start > at) out.push({ text: text.slice(at, slot.start) });
    out.push({ text: text.slice(slot.start, slot.end), mark: slot.mark });
    at = slot.end;
  }
  if (at < text.length) out.push({ text: text.slice(at) });

  return out;
}
