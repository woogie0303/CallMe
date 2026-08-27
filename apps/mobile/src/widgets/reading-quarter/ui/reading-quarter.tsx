import { StyleSheet, View } from 'react-native';

import type { ReadingQuarter } from '@/entities/reading/model/mock';
import { blue, color, neutral, type } from '@/shared/config';
import { AltPanel, AppText, emphasis } from '@/shared/ui';

/** 읽은 날의 농도. 진할수록 그날 많이 읽었다. */
const LEVEL = [neutral(0.1), blue(0.25), blue(0.55), blue(0.8), color.primary];

/**
 * 습관을 세지 않고 보여준다 — 칸이 촘촘해지는 것만으로 충분하다.
 */
export function ReadingQuarterGrid({ quarter }: { quarter: ReadingQuarter }) {
  return (
    <AltPanel style={styles.panel}>
      <View style={styles.head}>
        <AppText style={styles.title}>
          이번 분기에 <AppText style={emphasis(color.primary)}>{quarter.days}일</AppText> 읽었어요
        </AppText>
        <AppText style={styles.streak}>연속 {quarter.streak}일</AppText>
      </View>
      <View style={styles.grid}>
        {quarter.weeks.map((week, w) => (
          <View key={w} style={styles.week}>
            {week.map((level, d) => (
              <View key={d} style={[styles.cell, { backgroundColor: LEVEL[level] }]} />
            ))}
          </View>
        ))}
      </View>
    </AltPanel>
  );
}

const styles = StyleSheet.create({
  panel: { paddingHorizontal: 16, paddingVertical: 14, gap: 10, borderRadius: 20 },
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  title: { ...type.label2, fontWeight: '700', color: color.text.primary },
  streak: { ...type.caption2, color: color.text.meta },
  grid: { flexDirection: 'row', gap: 3 },
  week: { gap: 3 },
  cell: { width: 8, height: 8, borderRadius: 2 },
});
