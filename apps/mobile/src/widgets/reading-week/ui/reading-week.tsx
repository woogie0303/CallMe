import { StyleSheet, View } from 'react-native';

import type { ReadingWeek } from '@/entities/reading/model/types';
import { color, type } from '@/shared/config';
import { AltPanel, AppText, emphasis } from '@/shared/ui';

/** 막대가 설 수 있는 높이. 이 안에서 비율만큼 차오른다. */
const TRACK = 60;
/** 조금이라도 읽은 날은 이만큼은 보인다 — 1쪽이 0px이면 안 읽은 날과 같아진다 */
const MIN_BAR = 6;

/**
 * 이번 주 읽기.
 *
 * 한동안 빈 날을 **가득 찬 빈 캡슐**로 그렸는데, 기록이 없는 주에는 커다란
 * 빈 통 일곱 개가 판을 차지해서 차트가 고장난 것처럼 보였다. 지금은 반대다 —
 * 읽은 날만 막대가 서고, 안 읽은 날은 바닥에 점 하나로 남는다. 아무것도 안
 * 읽은 주는 조용한 밑줄 하나로 보이는 것이 맞다.
 *
 * 오늘 막대에 따로 색을 주지 않는다 — 아직 읽지 않았으면 다른 빈 날과 똑같이
 * 비어 있는 게 맞다. 오늘이라는 사실은 라벨만 말한다.
 *
 * 막대 높이는 **그 주에 가장 많이 읽은 날에 대한 비율**이라 절대량을 말하지
 * 못한다. 그래서 합계 쪽수는 위에 글로 적는다.
 */
export function ReadingWeekChart({ week }: { week: ReadingWeek }) {
  const read = week.days > 0;

  return (
    <AltPanel style={styles.panel}>
      <View style={styles.head}>
        <AppText style={styles.eyebrow}>이번 주</AppText>
        <AppText style={styles.month}>{week.monthLabel}</AppText>
      </View>

      {read ? (
        <AppText style={styles.summary}>
          {week.pages}쪽 읽었어요 · {week.days}일
          {week.streak > 0 ? (
            <AppText style={emphasis(color.primary)}> · 연속 {week.streak}일</AppText>
          ) : null}
        </AppText>
      ) : (
        /* 0을 굵게 적어 봐야 못 읽은 것을 크게 말할 뿐이다 */
        <AppText style={styles.quiet}>이번 주는 아직이에요</AppText>
      )}

      <View
        style={styles.bars}
        accessibilityRole="image"
        accessibilityLabel={
          read
            ? `이번 주 ${week.days}일, 모두 ${week.pages}쪽 읽었어요`
            : '이번 주에는 아직 읽은 기록이 없어요'
        }>
        {week.bars.map((bar, i) => (
          <View key={i} style={styles.column}>
            <View style={styles.track}>
              {bar.amount > 0 ? (
                <View
                  style={[
                    styles.bar,
                    { height: Math.max(MIN_BAR, Math.min(1, bar.amount) * TRACK) },
                  ]}
                />
              ) : (
                <View style={styles.none} />
              )}
            </View>
            <AppText style={[styles.day, bar.today ? styles.dayToday : null]}>{bar.label}</AppText>
          </View>
        ))}
      </View>
    </AltPanel>
  );
}

const styles = StyleSheet.create({
  /**
   * 중립 회색판이다. 예전에는 옅은 포인트 색을 깔았는데, 포인트 색이 테라코타가
   * 되자 판 전체가 분홍빛으로 떠서 막대가 묻혔다. 판이 조용해야 막대가 선다.
   */
  panel: { padding: 20, gap: 12, borderRadius: 24 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { ...type.caption1, color: color.text.meta },
  month: { ...type.caption1, color: color.text.meta },
  summary: { ...type.headline2, fontWeight: '700', color: color.text.primary },
  quiet: { ...type.headline2, fontWeight: '700', color: color.text.secondary },

  bars: { flexDirection: 'row', gap: 8, marginTop: 6 },
  column: { flex: 1, alignItems: 'center', gap: 10 },
  /** 막대는 바닥에서 차오른다 */
  track: { height: TRACK, justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: 10, borderRadius: 5, backgroundColor: color.primary },
  /** 안 읽은 날 — 빈 통이 아니라 바닥의 점 하나 */
  none: { width: 10, height: 3, borderRadius: 2, backgroundColor: color.fill.bold },
  day: { ...type.caption2, color: color.text.meta },
  dayToday: { fontWeight: '700', color: color.primary },
});
