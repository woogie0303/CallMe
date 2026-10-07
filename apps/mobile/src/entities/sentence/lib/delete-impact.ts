import type { ItemSummary } from '@/entities/lexical-item/api/item.api';

/** 문장 하나를 지우면 서랍에서 함께 벌어지는 일 */
export type DeleteImpact = {
  /** 통째로 사라지는 표현 — 이 문장 말고는 만난 적이 없는 것들 */
  removed: string[];
  /** 이 문장만 빠지고 서랍에는 남는 표현 — 다른 문장에서도 만났다 */
  kept: string[];
};

/**
 * `DELETE /api/sentences/:id`는 문장만 지우지 않는다. 그 문장을 가리키던 만남을
 * 모든 항목에서 빼고, 만남이 하나도 안 남은 항목은 **통째로 지운다.**
 *
 * 단어 중심 서랍에서는 이 경로가 깊이 묻혀 있었지만 문장 피드에서는 한 번
 * 누르면 닿는다(ADR-0004). 그래서 묻기 전에 무엇이 함께 사라지는지 세어서
 * 말해야 한다 — 표현이 소리 없이 없어지는 것이 이 앱에서 가장 나쁜 일이다.
 *
 * 문장→항목 방향 API가 없어서 항목 목록을 뒤집어 센다.
 */
export function deleteImpact(
  sentenceId: string,
  items: ItemSummary[],
): DeleteImpact {
  const removed: string[] = [];
  const kept: string[] = [];

  for (const item of items) {
    const meets = item.encounters.filter(
      (met) => met.sentenceId === sentenceId,
    ).length;
    if (!meets) continue;
    /** 이 문장이 그 항목의 마지막 만남이면 항목도 같이 간다 */
    if (meets >= item.encounters.length) removed.push(item.term);
    else kept.push(item.term);
  }

  return { removed, kept };
}

/** 셋까지는 이름을 부르고, 그 뒤는 세어서 말한다 */
const SHOWN = 3;

function name(terms: string[]): string {
  const head = terms
    .slice(0, SHOWN)
    .map((t) => `‘${t}’`)
    .join(', ');
  const rest = terms.length - SHOWN;
  return rest > 0 ? `${head} 외 ${rest}개` : head;
}

/**
 * 확인 문구. 수를 세는 데서 그치지 않고 **이름을 부른다** — '표현 2개'보다
 * '‘make out’, ‘let on’'이 지울지 말지를 실제로 정하게 해준다.
 *
 * 표현 이름 뒤에 조사를 붙이지 않는다. 영어 뒤의 은/는·이/가는 발음으로
 * 갈리는데(‘make out’은 '아웃'이라 받침이 있고 ‘Klara’는 없다) 그걸 코드로
 * 맞추면 반은 틀린다. 줄표로 끊어 이름을 나열하면 조사가 아예 필요 없다.
 */
export function deleteMessage(impact: DeleteImpact): string {
  return [
    ...impactLines(impact, '담아둔 문장 하나를 지워요.'),
    '되돌릴 수 없어요.',
  ].join('\n\n');
}

/**
 * 문장은 두고 담은 표현만 지울 때의 확인 문구 — 하트를 켠 문장을 '담은 표현' 쪽에서
 * 지운다. 어떤 표현이 사라지는지는 문장 삭제와 같고, 문장이 남는다는 말이 붙는다.
 */
export function clearMessage(impact: DeleteImpact): string {
  return [
    ...impactLines(impact, '이 문장에서 담은 표현을 지워요.'),
    "문장은 '마음에 들었던 문장'에 그대로 남아요.",
    '되돌릴 수 없어요.',
  ].join('\n\n');
}

function impactLines({ removed, kept }: DeleteImpact, empty: string): string[] {
  const lines: string[] = [];

  if (removed.length) {
    lines.push(
      `서랍에서 함께 사라져요 — ${name(removed)}\n이 문장 말고는 만난 적이 없는 표현이에요.`,
    );
  }
  if (kept.length) {
    lines.push(
      `이 문장만 빠져요 — ${name(kept)}\n다른 문장에서도 만나서 표현은 서랍에 남아요.`,
    );
  }
  if (!lines.length) lines.push(empty);
  return lines;
}
