/**
 * 스스로 밝힌 영어 레벨. 어떤 항목을 추천할지와 뜻을 얼마나 풀어 쓸지를
 * 함께 정한다 — 그래서 같은 표현이라도 사람마다 설명이 다르다. (Q24)
 */
export type Level = '입문' | '중급' | '고급';

export const LEVELS: { value: Level; blurb: string }[] = [
  { value: '입문', blurb: '아는 낱말도 문장 안에서는 자주 막혀요' },
  { value: '중급', blurb: '줄거리는 따라가지만 구동사에서 자주 걸려요' },
  { value: '고급', blurb: '대체로 읽히고, 뉘앙스 차이가 궁금해요' },
];

export const READER = {
  level: '중급' as Level,
  /** 이 권을 다 읽으면 레벨을 다시 물어본다 */
  booksFinished: 3,
};
