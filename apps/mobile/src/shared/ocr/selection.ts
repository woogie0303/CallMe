import type { OcrWord } from './text-extractor';

/** 짚어서 고른 범위 */
export type Selection = {
  /** 고른 첫 낱말과 끝 낱말의 번호 — 화면이 어디를 칠할지 정한다 */
  from: number;
  to: number;
  /** 물어볼 글 */
  text: string;
  /** 짚은 것보다 넓어졌는지 — 화면이 "문장 전체로 넓혔어요"라고 말할 수 있게 */
  widened: boolean;
};

/**
 * 문장이 여기서 끝난다고 보는 글자.
 *
 * 마침표 뒤에 닫는 부호가 여럿 붙을 수 있다(`her?”`, `said.’”`). 책은 곧은
 * 따옴표가 아니라 **둥근 따옴표**(`”` `’`)를 쓰고, 인식기는 그걸 가끔 `»`로
 * 읽는다 — 곧은 따옴표만 보면 대사 한 줄을 고를 때 다음 대사까지 넘어간다.
 */
const ENDS = /[.!?…]["'”’»)\]]*$/;

/**
 * 사진 위에서 **처음 낱말과 끝 낱말을 짚으면** 물어볼 글이 된다.
 *
 * 서버에 줄을 보내 문장으로 이어달라고 하지 않는다(`POST /asks/split`). 짚은
 * 사람이 어디서 막혔는지 이미 알고 있어서, 모델이 한 번 더 문장을 나눠 줄
 * 이유가 없다 — 호출도 하나 줄고, 서버가 나눈 문장을 원래 줄에 다시 맞추는
 * 일도 없어진다.
 *
 * **다만 짚은 그대로 묻지는 않는다.** 조각(`make out whether`)만 보내면
 * 맥락 없는 뜻풀이가 되어 ADR-0001이 막으려던 그 상태로 돌아간다. 그래서
 * 앞뒤로 문장 경계까지 넓힌다 — 대충 짚어도 문장 하나가 된다.
 *
 * 넓힐 경계를 못 찾으면(마침표가 안 읽혔거나 한 쪽이 한 문장일 때) 짚은
 * 그대로 쓴다. 넓히지 못했다고 묻지 못하게 하는 것이 더 나쁘다.
 */
export function selectWords(
  words: OcrWord[],
  a: number,
  b: number,
): Selection | null {
  if (!words.length) return null;

  /** 둘 다 같은 범위로 가둔다 — 한쪽만 가두면 lo가 hi를 넘어 null이 된다 */
  const clamp = (n: number) => Math.max(0, Math.min(words.length - 1, n));
  const lo = clamp(Math.min(a, b));
  const hi = clamp(Math.max(a, b));

  /** 앞으로: 바로 앞 낱말이 문장을 끝맺었으면 거기가 시작이다 */
  let from = lo;
  while (from > 0 && !ENDS.test(words[from - 1].text)) from -= 1;

  /** 뒤로: 이 낱말이 문장을 끝맺을 때까지 */
  let to = hi;
  while (to < words.length - 1 && !ENDS.test(words[to].text)) to += 1;

  const text = words
    .slice(from, to + 1)
    .map((word) => word.text)
    .join(' ');

  return { from, to, text, widened: from < lo || to > hi };
}

/**
 * 짚는 중일 때 미리 보여줄 범위. 첫 낱말만 짚은 상태에서는 아직 넓히지 않는다 —
 * 끝을 정하기도 전에 문장이 통째로 칠해지면 무엇을 고르는 중인지 알 수 없다.
 */
export function previewWords(
  words: OcrWord[],
  a: number,
  b?: number,
): Selection | null {
  if (b === undefined) {
    const word = words[a];
    return word ? { from: a, to: a, text: word.text, widened: false } : null;
  }
  return selectWords(words, a, b);
}
