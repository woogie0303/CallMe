/**
 * 날짜를 사람이 말하듯 옮긴다. 서버는 언제나 시각만 주고, 그걸 '어제'라고
 * 부를지 '8월 20일'이라고 부를지는 화면이 정한다.
 */
export function savedLabel(iso: string | Date): string {
  const date = new Date(iso);
  const days = daysAgo(date);

  if (days <= 0) return '오늘';
  if (days === 1) return '어제';
  if (days < 7) return `${days}일 전`;
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

/** 처음과 마지막 사이 — 이 간격이 제품의 요지다 */
export function gapLabel(days: number): string {
  if (days < 1) return '같은 날';
  if (days < 30) return `${days}일 만에`;
  return `${Math.round(days / 30)}개월 만에`;
}

export function daysAgo(date: Date, now = new Date()): number {
  const a = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function daysBetween(from: string | Date, to: string | Date): number {
  return Math.round(
    (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000,
  );
}
