import type { Level } from '@/shared/api/types';

/**
 * 레벨 화면에 뜨는 선택지 셋. 값은 서버가 갖는 것과 같은 셋이지만
 * (`@/shared/api/types`의 Level), 설명 문구는 화면이 하는 말이라 여기 둔다.
 */
export const LEVELS: { value: Level; blurb: string }[] = [
  { value: '입문', blurb: '아는 낱말도 문장 안에서는 자주 막혀요' },
  { value: '중급', blurb: '줄거리는 따라가지만 구동사에서 자주 걸려요' },
  { value: '고급', blurb: '대체로 읽히고, 뉘앙스 차이가 궁금해요' },
];
