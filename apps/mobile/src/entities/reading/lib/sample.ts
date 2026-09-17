import type { ReadingWeek } from '../model/types';

/**
 * **개발 빌드에서만 쓰는 가짜 이레.**
 *
 * 읽은 기록이 하나도 없으면 막대가 전부 비어서 차트 디자인을 눈으로 볼 수가
 * 없다. 그래서 `__DEV__`이고 이번 주 기록이 0일 때만 이 값을 대신 그린다 —
 * `sign-in.tsx`의 개발용 로그인 문과 같은 종류의 임시 장치다.
 *
 * 배포 빌드에서는 **실행되지 않는다** — `__DEV__`가 false라 부르는 자리가 죽는다.
 * 다만 Metro가 모듈 경계를 넘어 죽은 코드를 걷어내지는 않아서, 함수 자체는
 * 번들에 실린 채로 남는다(확인함). 사용자에게 보일 일은 없지만 짐은 짐이다.
 *
 * 실기기에서 진도를 한 번이라도 옮기면 진짜 기록이 생기고 이 값은 쓰이지 않는다.
 *
 * **차트 디자인 확인이 끝나면 이 파일과 부르는 자리를 함께 지운다.**
 */
export function sampleWeek(monthLabel: string, todayLabel: string): ReadingWeek {
  /** 일부러 고르지 않게 — 읽은 날, 안 읽은 날, 조금 읽은 날이 섞여야 눈에 보인다 */
  const pages = [18, 32, 0, 41, 12, 0, 7];
  const labels = ['금', '토', '일', '월', '화', '수', todayLabel];
  const most = Math.max(1, ...pages);

  return {
    monthLabel,
    days: pages.filter((p) => p > 0).length,
    pages: pages.reduce((sum, p) => sum + p, 0),
    streak: 2,
    bars: pages.map((p, i) => ({
      label: labels[i],
      amount: p / most,
      pages: p,
      today: i === pages.length - 1,
    })),
  };
}
