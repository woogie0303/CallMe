import { StyleSheet, Switch, View } from 'react-native';

import { color, type } from '@/shared/config';
import { REMINDER_HOURS } from '@/shared/notifications/reminder';
import { AltPanel, AppText, Tap } from '@/shared/ui';
import { useReminderSetting } from '../model/use-reminder';

const HOUR_LABEL: Record<number, string> = {
  8: '오전 8시',
  12: '낮 12시',
  20: '저녁 8시',
  22: '밤 10시',
};

/**
 * 복습 알림 — 하루에 한 번, 다시 볼 표현을 알려준다. 켜면 시각을 고른다.
 *
 * 켜는 순간에 처음으로 알림 허락을 묻는다(`useReminderSetting`). 담아둔 표현이
 * 아직 없으면 켜도 울릴 것이 없어서 그렇다고 말해 준다 — 켰는데 아무 일도 없는 것이
 * 고장처럼 보이지 않게.
 */
export function ReminderSettings() {
  const { setting, ready, toggle, setHour, hasItems } = useReminderSetting();

  return (
    <AltPanel style={styles.panel}>
      <View style={styles.head}>
        <View style={styles.text}>
          <AppText style={styles.title}>복습 알림</AppText>
          <AppText style={styles.body}>
            하루에 한 번, 다시 볼 표현을 알려드려요.
          </AppText>
        </View>
        <Switch
          value={setting.enabled}
          disabled={!ready}
          onValueChange={toggle}
          trackColor={{ true: color.primary, false: color.border.strong }}
          accessibilityLabel="복습 알림"
        />
      </View>

      {setting.enabled ? (
        <View style={styles.times}>
          {REMINDER_HOURS.map((hour) => {
            const on = hour === setting.hour;
            return (
              <Tap
                key={hour}
                onPress={() => setHour(hour)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[styles.time, on ? styles.timeOn : null]}
              >
                <AppText
                  style={[styles.timeLabel, on ? styles.timeLabelOn : null]}
                >
                  {HOUR_LABEL[hour]}
                </AppText>
              </Tap>
            );
          })}
        </View>
      ) : null}

      {setting.enabled && !hasItems ? (
        <AppText style={styles.note}>
          담아둔 표현이 생기면 그때부터 알려드려요.
        </AppText>
      ) : null}
    </AltPanel>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 18, gap: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  text: { flex: 1, gap: 3 },
  title: { ...type.label1, fontWeight: '700', color: color.text.primary },
  body: { ...type.caption1, lineHeight: 17, color: color.text.meta },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  time: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: color.fill.default,
  },
  timeOn: { backgroundColor: color.primaryTint },
  timeLabel: { ...type.label2, fontWeight: '600', color: color.text.secondary },
  timeLabelOn: { color: color.primary },
  note: { ...type.caption1, color: color.text.meta },
});
