/**
 * 낱말을 골라 물을 문장을 만드는 규칙. 사진 위의 낱말(`OcrWord`)에도, 손으로 적은
 * 글을 쪼갠 낱말(`tokenize`)에도 똑같이 쓴다 — 둘 다 `{ text }`의 줄일 뿐이다.
 *
 * 독자는 **모르는 낱말만** 누른다. 문장은 여기서 만든다 — 고른 낱말의 앞뒤를
 * 문장 경계까지 넓혀서. 조각(`make out whether`)만 보내면 맥락 없는 뜻풀이가 되어
 * ADR-0001이 막으려던 그 상태로 돌아간다.
 *
 * 서버에 줄을 보내 문장으로 이어달라고 하지 않는다. 경계는 마침표로 충분히 찾고,
 * 틀리면 독자가 시트에서 문장을 고친다 — 호출 하나를 아끼는 쪽이 낫다.
 */

type Word = { text: string };

/** 한 번에 물을 수 있는 문장 수. 넘으면 고르기를 막는다 — 서버도 한 번 더 자른다. */
export const MAX_SENTENCES = 5;
/** 한 문장에서 고를 수 있는 표현 수 — 서버와 같은 수 */
export const MAX_PICKS = 8;

/**
 * 문장이 여기서 끝난다고 보는 글자.
 *
 * 마침표 뒤에 닫는 부호가 여럿 붙을 수 있다(`her?”`, `said.’”`). 책은 곧은
 * 따옴표가 아니라 **둥근 따옴표**(`”` `’`)를 쓰고, 인식기는 그걸 가끔 `»`로
 * 읽는다 — 곧은 따옴표만 보면 대사 한 줄을 고를 때 다음 대사까지 넘어간다.
 */
const ENDS = /[.!?…]["'”’»)\]]*$/;

/**
 * 마침표로 끝나도 문장이 끝난 게 아닌 낱말. 칭호와 흔한 줄임말, 이름 머리글자
 * (`J.`)다. 여기서 끊으면 'Mr.'에서 문장이 잘려 엉뚱한 반쪽을 묻게 된다.
 * `etc.`는 일부러 넣지 않았다 — 문장 끝에 오는 일이 더 많다.
 */
const NOT_ENDS = new Set([
  'mr.',
  'mrs.',
  'ms.',
  'dr.',
  'st.',
  'prof.',
  'sr.',
  'jr.',
  'mt.',
  'vs.',
  'e.g.',
  'i.e.',
  'cf.',
  'no.',
]);

function ends(word: Word): boolean {
  const bare = word.text.replace(/^["'“‘(\[«]+/, '').toLowerCase();
  if (NOT_ENDS.has(bare)) return false;
  /** 이름 머리글자 — 'J. K. Rowling' */
  if (/^[a-z]\.$/.test(bare)) return false;
  return ENDS.test(word.text);
}

/** 고른 표현 하나 — 붙어 있는 낱말들의 범위 */
export type Pick = { from: number; to: number; surface: string };

/** 물을 문장 하나와, 그 안에서 고른 표현들 */
export type SentenceGroup = {
  from: number;
  to: number;
  text: string;
  picks: Pick[];
};

/** 손으로 적은 글을 낱말로 쪼갠다. 사진의 낱말과 같은 모양이 된다. */
export function tokenize(text: string): Word[] {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((piece) => ({ text: piece }));
}

/** 그 낱말이 든 문장의 범위 */
export function sentenceAround(
  words: Word[],
  from: number,
  to: number = from,
): { from: number; to: number } {
  let start = from;
  while (start > 0 && !ends(words[start - 1])) start -= 1;
  let end = to;
  while (end < words.length - 1 && !ends(words[end])) end += 1;
  return { from: start, to: end };
}

/**
 * 고른 낱말이 문장에 실릴 꼴. 낱말에 붙은 문장부호는 뗀다 — 'off,'를 고른 것은
 * 'off'를 고른 것이다. 낱말 가운데의 부호(`don't`, `well-known`)는 둔다.
 */
export function surfaceOf(words: Word[], from: number, to: number): string {
  return words
    .slice(from, to + 1)
    .map((word) => word.text)
    .join(' ')
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
}

/** 고른 낱말 번호들을 붙어 있는 덩어리로 묶는다 — 붙은 낱말은 한 표현(구)이다 */
export function runsOf(
  selected: Iterable<number>,
): { from: number; to: number }[] {
  const sorted = [...new Set(selected)].sort((a, b) => a - b);
  const runs: { from: number; to: number }[] = [];
  for (const i of sorted) {
    const last = runs[runs.length - 1];
    if (last && i === last.to + 1) last.to = i;
    else runs.push({ from: i, to: i });
  }
  return runs;
}

/**
 * 고른 낱말들을 문장별로 나눈다. 같은 문장에 든 표현은 한 문장 아래 모이고,
 * 문장 경계를 넘겨 끈 표현은 두 문장을 하나로 잇는다(겹치는 범위는 합친다).
 */
export function groupBySentence(
  words: Word[],
  selected: Iterable<number>,
): SentenceGroup[] {
  const runs = runsOf(selected).filter(
    (run) => run.from >= 0 && run.to < words.length,
  );

  const groups: SentenceGroup[] = [];
  for (const run of runs) {
    const span = sentenceAround(words, run.from, run.to);
    const pick: Pick = {
      ...run,
      surface: surfaceOf(words, run.from, run.to),
    };
    const last = groups[groups.length - 1];
    /** 덩어리는 앞에서부터 오므로 바로 앞 문장과만 겹칠 수 있다 */
    if (last && span.from <= last.to) {
      last.to = Math.max(last.to, span.to);
      last.picks.push(pick);
    } else {
      groups.push({ ...span, text: '', picks: [pick] });
    }
  }

  return groups
    .map((group) => ({
      ...group,
      text: words
        .slice(group.from, group.to + 1)
        .map((word) => word.text)
        .join(' '),
      /** 부호만 고른 덩어리('—')는 표현이 아니다 */
      picks: group.picks.filter((pick) => pick.surface),
    }))
    .filter((group) => group.picks.length);
}

/** 막힌 이유 — 문장이 너무 많거나, 한 문장에서 표현을 너무 많이 골랐다 */
export type Limit = 'sentences' | 'picks';

/**
 * 이 고르기가 한 번에 물을 수 있는 것을 넘는지. `whole`이면 글 전체를 한 문장으로
 * 묻는다(손으로 적은 글) — 표현 수를 글 전체에서 센다.
 */
export function overflows(
  words: Word[],
  selected: Iterable<number>,
  { maxSentences = MAX_SENTENCES, whole = false } = {},
): Limit | null {
  if (whole) {
    return runsOf(selected).length > MAX_PICKS ? 'picks' : null;
  }
  const groups = groupBySentence(words, selected);
  if (groups.length > maxSentences) return 'sentences';
  if (groups.some((group) => group.picks.length > MAX_PICKS)) return 'picks';
  return null;
}

/**
 * 고친 문장에 고른 표현이 아직 있는지. 시트에서 독자가 문장을 고치다 표현을
 * 지웠을 수 있다 — 없는 것을 물으면 모델이 문장 밖의 뜻을 지어낸다.
 */
export function pickStillIn(sentence: string, surface: string): boolean {
  return sentence.toLowerCase().includes(surface.toLowerCase());
}
