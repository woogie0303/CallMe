import { StyleSheet, View } from 'react-native';

import type { ReadingWeek } from '@/entities/reading/model/types';
import { blue, color, type } from '@/shared/config';
import { AltPanel, AppText, emphasis } from '@/shared/ui';

/**
 * 이번 주 읽기. 막대는 아래에서 차오른다.
 *
 * 오늘 막대에 따로 색을 주지 않는다 — 아직 읽지 않았으면 다른 빈 날과
 * 똑같이 비어 있는 게 맞다. 오늘이라는 사실은 라벨만 말한다.
 */
export function ReadingWeekChart({ week }: { week: ReadingWeek }) {
  return (
    <AltPanel style={styles.panel}>
      <View style={styles.head}>
        <AppText style={styles.eyebrow}>이번 주</AppText>
        <AppText style={styles.month}>{week.monthLabel}</AppText>
      </View>

      <AppText style={styles.summary}>
        {week.days}일 읽었어요 · 연속{' '}
        <AppText style={emphasis(color.primary)}>{week.streak}일</AppText>
      </AppText>

      <View style={styles.bars}>
        {week.bars.map((bar) => (
          <View key={bar.label} style={styles.column}>
            <View style={styles.track}>
              {bar.amount > 0 ? (
                <View style={[styles.fill, { height: `${Math.min(1, bar.amount) * 100}%` }]} />
              ) : null}
            </View>
            <AppText style={[styles.day, bar.today ? styles.dayToday : null]}>
              {bar.label}
            </AppText>
          </View>
        ))}
      </View>
    </AltPanel>
  );
}

const styles = StyleSheet.create({
  /** 회색 대신 옅은 파랑 — 홈에서 이 판만 색을 갖는다 */
  panel: { padding: 20, gap: 12, borderRadius: 24, backgroundColor: blue(0.05) },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { ...type.caption1, color: color.text.meta },
  month: { ...type.caption1, color: color.text.meta },
  summary: { ...type.headline2, fontWeight: '700', color: color.text.primary },

  bars: { flexDirection: 'row', gap: 8, marginTop: 4 },
  column: { flex: 1, alignItems: 'center', gap: 8 },
  /** 아래에서 차오르게 — 막대는 바닥에 붙는다 */
  track: {
    width: '100%',
    height: 72,
    borderRadius: 999,
    backgroundColor: blue(0.12),
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  fill: { width: '100%', borderRadius: 999, backgroundColor: color.primary },
  day: { ...type.caption2, color: color.text.meta },
  dayToday: { fontWeight: '700', color: color.primary },
});
