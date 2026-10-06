import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { color, type } from '@/shared/config';
import type { ReminderTime } from '@/shared/notifications/reminder';
import { ActionButton, AltPanel, AppText, OptionSheet, Tap } from '@/shared/ui';
import { useReminderSetting } from '../model/use-reminder';
import { TimeWheel, formatReminderTime } from './time-wheel';

/**
 * 복습 알림 — 하루에 한 번, 다시 볼 표현을 알려준다. 켜면 시각을 분 단위로 고른다.
 *
 * 켜는 순간에 처음으로 알림 허락을 묻는다(`useReminderSetting`). 담아둔 표현이
 * 아직 없으면 켜도 울릴 것이 없어서 그렇다고 말해 준다 — 켰는데 아무 일도 없는 것이
 * 고장처럼 보이지 않게.
 */
export function ReminderSettings() {
  const { setting, ready, toggle, setTime, hasItems } = useReminderSetting();
  const [picking, setPicking] = useState(false);
  /** 휠을 굴리는 동안은 따로 들고 있다가 '저장'에서 한 번에 예약한다 */
  const [draft, setDraft] = useState<ReminderTime>(setting);

  const open = () => {
    setDraft({ hour: setting.hour, minute: setting.minute });
    setPicking(true);
  };

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
        <Tap
          onPress={open}
          accessibilityRole="button"
          accessibilityLabel={`알림 시각 ${formatReminderTime(setting)}`}
          accessibilityHint="눌러서 시각 바꾸기"
          style={styles.timeRow}
        >
          <AppText style={styles.timeTitle}>알림 시각</AppText>
          <View style={styles.timePill}>
            <AppText style={styles.timeValue}>
              {formatReminderTime(setting)}
            </AppText>
          </View>
        </Tap>
      ) : null}

      {setting.enabled && !hasItems ? (
        <AppText style={styles.note}>
          담아둔 표현이 생기면 그때부터 알려드려요.
        </AppText>
      ) : null}

      <OptionSheet visible={picking} onClose={() => setPicking(false)}>
        <AppText style={styles.sheetTitle}>알림 시각</AppText>
        <TimeWheel value={draft} onChange={setDraft} />
        <ActionButton
          label="저장"
          onPress={() => {
            setTime(draft);
            setPicking(false);
          }}
        />
      </OptionSheet>
    </AltPanel>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 18, gap: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  text: { flex: 1, gap: 3 },
  title: { ...type.label1, fontWeight: '700', color: color.text.primary },
  body: { ...type.caption1, lineHeight: 17, color: color.text.meta },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeTitle: { ...type.label2, fontWeight: '600', color: color.text.secondary },
  /** 눌리는 값이라는 것을 알약으로 말한다 — 앱의 칩과 같은 모양 */
  timePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: color.primaryTint,
  },
  timeValue: { ...type.label1, fontWeight: '700', color: color.primary },
  sheetTitle: {
    ...type.body2,
    fontWeight: '700',
    color: color.text.primary,
    textAlign: 'center',
  },
  note: { ...type.caption1, color: color.text.meta },
});
