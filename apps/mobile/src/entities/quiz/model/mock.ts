/**
 * 빈칸은 낱말이 아니라 **표현 하나를 통째로** 도려낸 자리다.
 * 보기도 표제형 표현이고, 방향은 언제나 영어 → 뜻이다 —
 * 한국어를 보고 영어를 지어내는 카드가 애초에 실패한 방식이었다. (Q19)
 */
export type QuizQuestion = {
  id: string;
  /** 정답 어휘 항목 */
  itemId: string;
  bookId: string;
  page: number;
  /** 빈칸 앞뒤 원문 */
  before: string;
  after: string;
  /** 문장에 실제로 있던 꼴. 맞히면 이 꼴로 빈칸이 채워져 문장이 다시 자연스러워진다. */
  surface: string;
  /** 예전에 헷갈렸던 다른 항목들에서 고른 오답 */
  distractorIds: string[];
  askedLabel: string;
};

export const QUIZ: QuizQuestion[] = [
  {
    id: 'q1',
    itemId: 'brush-it-off',
    bookId: 'klara',
    page: 132,
    before: '“She ',
    surface: 'brushed it off',
    after: ' and kept walking, as if nothing had happened.”',
    distractorIds: ['shrug-off', 'put-up-with', 'make-out'],
    askedLabel: '어제 담아둔 문장이에요',
  },
  {
    id: 'q2',
    itemId: 'the-better-part-of',
    bookId: 'normal-people',
    page: 58,
    before: '“I had put up with the noise for ',
    surface: 'the better part of',
    after: ' a year.”',
    distractorIds: ['for-the-time-being', 'come-to-terms-with', 'make-out'],
    askedLabel: '6월 4일에 담아둔 문장이에요',
  },
  {
    id: 'q3',
    itemId: 'make-out',
    bookId: 'piranesi',
    page: 88,
    before: '“I could not ',
    surface: 'make out',
    after: ' whether it was a statue or a person.”',
    distractorIds: ['brush-it-off', 'put-up-with', 'come-to-terms-with'],
    askedLabel: '8월 20일에 담아둔 문장이에요',
  },
];

export const QUIZ_TOTAL = 5;
/** 지금 몇 번째 문제인지 — 1부터 센다. */
export const QUIZ_INDEX = 2;

/**
 * 보기 순서는 문제마다 고정이어야 한다 — 다시 그릴 때마다 답이 옮겨 다니면
 * 위치를 외우게 되고, 그건 표현을 외운 게 아니다.
 */
export function choiceIdsOf(question: QuizQuestion): string[] {
  const all = [question.itemId, ...question.distractorIds];
  const seed = question.id.charCodeAt(question.id.length - 1);
  return all
    .map((id, i) => ({ id, key: (i + 1) * 7919 + seed * 104729 }))
    .sort((a, b) => (a.key % 97) - (b.key % 97))
    .map((x) => x.id);
}
