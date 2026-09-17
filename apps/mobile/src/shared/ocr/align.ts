import type { OcrLine } from './text-extractor';

/**
 * 문장 하나가 사진에서 차지하는 자리.
 * 한 문장이 서너 줄에 걸치므로 줄이 여럿이다.
 */
export type SentencePlacement = {
  sentence: string;
  /** 이 문장을 이루는 줄들의 번호 */
  lines: number[];
};

/**
 * 서버가 이어 준 문장을, 인식기가 읽어낸 원래 **줄**에 다시 맞춘다.
 *
 * 왜 필요한가: 인식기는 줄 단위로 좌표를 주고, 서버(`POST /asks/split`)는 줄을
 * 이어 문장을 돌려주는데 **어느 줄이 어느 문장이 됐는지는 알려주지 않는다.**
 * 사진 위에서 문장을 짚으려면 그 사이를 앱이 이어야 한다.
 *
 * 방법: 줄을 순서대로 이어 붙인 글에서 각 문장이 차지한 구간을 찾고, 그 구간과
 * 겹치는 줄을 모은다. 문장은 줄에서 만들어졌으니 순서가 보장되고, 그래서 앞에서
 * 부터 한 번만 훑으면 된다 — 한 줄이 두 문장에 걸치는 경우("…person. The sun…")도
 * 구간이 겹치므로 양쪽 모두에 들어간다.
 *
 * 공백은 무시하고 맞춘다. 서버가 줄을 이으면서 줄바꿈을 공백으로 바꾸거나
 * 이중 공백을 줄이기 때문에, 글자 그대로 찾으면 대부분 빗나간다.
 */
export function alignSentences(lines: OcrLine[], sentences: string[]): SentencePlacement[] {
  /** 이어 붙인 글에서 각 줄이 차지한 구간 */
  const spans: { start: number; end: number }[] = [];
  let joined = '';
  for (const line of lines) {
    if (joined.length) joined += ' ';
    const start = joined.length;
    joined += line.text;
    spans.push({ start, end: joined.length });
  }

  /** 공백을 지운 글과, 그 글의 각 글자가 원래 몇 번째였는지 */
  const squeezed: string[] = [];
  const backTo: number[] = [];
  for (let i = 0; i < joined.length; i++) {
    const ch = joined[i];
    if (/\s/.test(ch)) continue;
    squeezed.push(ch.toLowerCase());
    backTo.push(i);
  }
  const hay = squeezed.join('');

  let cursor = 0;
  return sentences.map((sentence) => {
    const needle = sentence.replace(/\s+/g, '').toLowerCase();
    if (!needle) return { sentence, lines: [] };

    const at = hay.indexOf(needle, cursor);
    if (at < 0) return { sentence, lines: [] };

    const from = backTo[at];
    const to = backTo[at + needle.length - 1] + 1;
    cursor = at + needle.length;

    const hit: number[] = [];
    for (let i = 0; i < spans.length; i++) {
      if (from < spans[i].end && to > spans[i].start) hit.push(i);
    }
    return { sentence, lines: hit };
  });
}
