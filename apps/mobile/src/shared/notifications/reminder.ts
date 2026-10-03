import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * 복습 알림의 기기 쪽 일 — 허락 받기 · 설정 저장 · 예약과 취소. 무엇을 말할지는
 * 여기서 정하지 않는다(`widgets/review-reminder`가 표현을 골라 넘긴다).
 *
 * 전부 **로컬 알림**이다. 서버가 보내는 푸시가 아니라 기기가 스스로 때를 보고
 * 울리는 것이라 APNs 권한도, 푸시 토큰도, 서버가 독자의 기기를 알 일도 없다.
 * (`app.config.js`가 `expo-notifications` 플러그인의 `aps-environment`를 일부러 뺀다.)
 */

/** 고를 수 있는 시각 — 읽는 때가 사람마다 달라서 넷만 둔다 */
export const REMINDER_HOURS = [8, 12, 20, 22] as const;

export type ReminderSetting = { enabled: boolean; hour: number };

export const DEFAULT_REMINDER: ReminderSetting = { enabled: false, hour: 20 };

export type ScheduledReminder = {
  at: Date;
  title: string;
  body: string;
  /** 알림을 눌렀을 때 열 표현 */
  itemId: string;
};

const SETTING_KEY = 'reminder.setting';
/** 이 앱이 예약한 알림만 골라 지우려고 붙이는 이름표 */
const ID_PREFIX = 'reread-reminder-';
const CHANNEL_ID = 'reminders';

/**
 * 앱이 켜져 있는 동안에도 알림을 보여준다 — 기본값은 앞에 떠 있는 앱에는 조용히
 * 넘어가서, 독자가 앱을 보고 있는 시각에 맞춰 울리면 아무 일도 없는 것처럼 보인다.
 * 모듈이 처음 불릴 때 한 번만 건다.
 */
export function configureNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function readReminder(): Promise<ReminderSetting> {
  try {
    const raw = await SecureStore.getItemAsync(SETTING_KEY);
    if (!raw) return DEFAULT_REMINDER;
    const parsed = JSON.parse(raw) as Partial<ReminderSetting>;
    return {
      enabled: parsed.enabled === true,
      hour: (REMINDER_HOURS as readonly number[]).includes(parsed.hour ?? -1)
        ? (parsed.hour as number)
        : DEFAULT_REMINDER.hour,
    };
  } catch {
    return DEFAULT_REMINDER;
  }
}

export async function saveReminder(setting: ReminderSetting): Promise<void> {
  await SecureStore.setItemAsync(SETTING_KEY, JSON.stringify(setting));
}

/** 이미 허락돼 있는가 — 허락을 *묻지는* 않는다(앱을 열 때마다 묻지 않으려고) */
export async function hasReminderPermission(): Promise<boolean> {
  const { granted } = await Notifications.getPermissionsAsync();
  return granted;
}

/**
 * 알림을 켜는 바로 그 순간에만 묻는다. 앱을 처음 열 때 묻는 허락은 왜 필요한지
 * 모른 채 거절하게 되고, 한 번 거절하면 시스템이 다시 묻지 않는다.
 * `blocked`는 이미 거절돼 설정 앱에서만 켤 수 있다는 뜻이다.
 */
export async function requestReminderPermission(): Promise<
  'granted' | 'blocked'
> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return 'granted';
  if (!current.canAskAgain) return 'blocked';

  const asked = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: false },
  });
  return asked.granted ? 'granted' : 'blocked';
}

/** 이 앱이 예약해 둔 복습 알림을 전부 지운다 — 다른 알림은 건드리지 않는다 */
export async function cancelReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(ID_PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

/** 지금 예약돼 있는 복습 알림 수 — 확인용 */
export async function countScheduledReminders(): Promise<number> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.filter((n) => n.identifier.startsWith(ID_PREFIX)).length;
}

/**
 * 예약을 통째로 갈아끼운다. 하나씩 고치지 않는다 — 표현이 늘거나 외워서 순서가
 * 바뀌면 이레치가 전부 달라지고, 반쯤 남은 예약이 어긋난 글을 울리는 것보다
 * 지우고 다시 짜는 쪽이 틀릴 일이 없다.
 */
export async function scheduleReminders(
  entries: ScheduledReminder[],
): Promise<void> {
  await cancelReminders();

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: '복습 알림',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await Promise.all(
    entries.map((entry, i) =>
      Notifications.scheduleNotificationAsync({
        identifier: `${ID_PREFIX}${i}`,
        content: {
          title: entry.title,
          body: entry.body,
          data: { itemId: entry.itemId },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: entry.at,
          channelId: CHANNEL_ID,
        },
      }),
    ),
  );
}

/** 로그아웃·계정 삭제 — 남의 계정으로 알림이 울리지 않게 예약도 설정도 지운다 */
export async function clearReminder(): Promise<void> {
  await cancelReminders().catch(() => undefined);
  await SecureStore.deleteItemAsync(SETTING_KEY).catch(() => undefined);
}
