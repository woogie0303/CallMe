import type { ItemSummary } from '@/entities/lexical-item/api/item.api';
import type { ReminderTime } from '@/shared/notifications/reminder';

/** 앞으로 며칠치를 미리 예약해 두는가 — 앱을 열 때마다 새로 짠다 */
export const REMINDER_DAYS = 7;

export type PlannedReminder = {
  at: Date;
  title: string;
  body: string;
  itemId: string;
};

/**
 * 복습 알림을 짠다 — 하루에 하나, 앞으로 이레치.
 *
 * 서버가 보내는 푸시가 아니라 **기기에 미리 예약해 두는 로컬 알림**이다. 반복 알림은
 * 글이 고정이라 '오늘 다시 볼 표현'을 말해줄 수 없어서, 날마다 다른 표현을 담아
 * 이레치를 예약하고 앱을 열 때마다 다시 짠다. 그래서 이레 넘게 앱을 안 열면 알림도
 * 끊긴다 — 쉬는 독자에게 계속 말을 거는 일이 이 앱이 원하는 일은 아니다.
 *
 * 고르는 순서는 홈의 '오늘 다시 볼 문장'과 같다(`useTodayItem`): 아직 **헷갈려요**인
 * 표현 가운데 처음과 마지막 만남 사이가 긴 것부터. 오래 지나 다시 만난 것이 지금
 * 다시 꺼내 볼 값이 가장 크다. 외웠어요로 표시한 것은 말을 걸지 않는다.
 *
 * 담아둔 표현이 없으면 아무것도 예약하지 않는다 — 비어 있는 알림은 알림이 아니라 광고다.
 */
export function planReminders(
  items: ItemSummary[],
  time: ReminderTime,
  now: Date = new Date(),
): PlannedReminder[] {
  const confused = items
    .filter((item) => item.status === '헷갈려요')
    .sort(
      (a, b) =>
        (b.gapDays ?? 0) - (a.gapDays ?? 0) ||
        b.met - a.met ||
        a.term.localeCompare(b.term),
    );
  if (confused.length === 0) return [];

  /** 오늘 그 시각이 아직 안 지났으면 오늘부터, 지났으면(1분 여유) 내일부터 */
  const first = new Date(now);
  first.setHours(time.hour, time.minute, 0, 0);
  if (first.getTime() <= now.getTime() + 60_000)
    first.setDate(first.getDate() + 1);

  return Array.from({ length: REMINDER_DAYS }, (_, day) => {
    const item = confused[day % confused.length];
    const at = new Date(first);
    at.setDate(first.getDate() + day);
    return {
      at,
      title: '오늘 다시 볼 표현',
      body: item.latest?.bookTitle
        ? `「${item.latest.bookTitle}」에서 만난 “${item.term}”, 기억나나요?`
        : `“${item.term}”, 기억나나요?`,
      itemId: item.id,
    };
  });
}
