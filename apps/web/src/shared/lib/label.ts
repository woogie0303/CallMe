/**
 * 날짜 라벨에 조사 '에'를 붙인다.
 * "2월 18일" → "2월 18일에", "어제" → "어제" (이미 부사라 조사가 붙지 않는다)
 */
export const on = (label: string) =>
  /\d일$/.test(label) ? `${label}에` : label;
