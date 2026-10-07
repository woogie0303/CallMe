import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { CoverThumb } from '@/entities/book/ui/cover-thumb';
import type { ItemSummary } from '@/entities/lexical-item/api/item.api';
import { markSegments } from '@/entities/sentence/lib/segments';
import { color, type } from '@/shared/config';
import { AppText, Quote, Tap } from '@/shared/ui';

/**
 * 오늘 다시 볼 문장 — 담아둔 것 중 하나를 홈으로 끌어올린다.
 *
 * 서랍처럼 목록을 펴지 않는다. 문장 하나와 그 안의 밑줄만 세우고, 누르면
 * 그 표현이 만난 문장들로 간다. 몇 번 만났는지·얼마 만인지·뜻 보기 같은
 * 되짚기 장치는 여기 두지 않는다 — 나중에 퀴즈를 들일 때 그쪽에서 다시 짓는다.
 *
 * 예전에는 표제형을 크게 세우고 그 밑에 한국어 뜻을 붙였는데, 그게 바로
 * ADR-0004가 서랍에서 걷어낸 단어장 모양이었다. 서랍은 문장으로 바꿔놓고
 * 홈만 낱말 카드로 두면 같은 앱으로 보이지 않는다. 그래서 여기도 **문장이
 * 먼저고 표현은 그 안의 밑줄**이다.
 */
export function TodayItem({
  item,
  style,
  onPress,
}: {
  item: ItemSummary;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  /** 카드 왼쪽 표지는 가장 최근에 만난 책이다 */
  const book = item.books[item.books.length - 1];
  const latest = item.latest;

  /** 그 문장에 쳐진 밑줄 — 같은 표현도 문장마다 나타난 꼴이 다르다 */
  const surface = latest
    ? item.encounters.find((met) => met.sentenceId === latest.sentenceId)
        ?.surface
    : undefined;
  const segments = latest
    ? markSegments(
        latest.text,
        surface ? [{ surface, term: item.term, meaning: item.meaning }] : [],
      )
    : [];

  return (
    <Tap
      style={[styles.card, style]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.term}을 만난 문장 모두 보기`}
    >
      {book ? <CoverThumb book={book} style={styles.thumb} /> : null}
      <View style={styles.body}>
        <AppText style={styles.eyebrow}>오늘 다시 볼 문장</AppText>

        {latest ? (
          <Quote numberOfLines={3} style={styles.sentence}>
            {segments.map((seg, i) =>
              seg.mark ? (
                <Quote key={i} style={styles.marked}>
                  {seg.text}
                </Quote>
              ) : (
                <Quote key={i}>{seg.text}</Quote>
              ),
            )}
          </Quote>
        ) : (
          /* 문장을 못 찾은 항목 — 표현만이라도 세운다 */
          <Quote style={styles.sentence}>{item.term}</Quote>
        )}
      </View>
    </Tap>
  );
}

/**
 * 담아둔 것이 아직 없을 때. 자리를 비워두지 않는 이유는, 홈 맨 아래가 통째로
 * 비면 화면이 덜 만들어진 것처럼 보이기 때문이다 — 여기 무엇이 올지 미리
 * 말해두면 빈자리가 약속이 된다.
 */
export function TodayItemEmpty({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.card, styles.blank, style]}>
      <View style={styles.blankBody}>
        <AppText style={styles.eyebrow}>오늘 다시 볼 문장</AppText>
        <AppText style={styles.blankText}>
          읽다 막힌 쪽을 찍어두면, 그때 담은 문장이 여기로 올라와요.
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 18,
    backgroundColor: color.surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border.subtle,
    overflow: 'hidden',
  },
  /** 본문 여백과 같은 선에 — 표지 윗변이 첫 줄 글자 윗변과 맞는다 */
  thumb: { marginTop: 14, marginLeft: 15 },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 15,
  },

  eyebrow: { ...type.caption2, color: color.text.meta },

  sentence: { fontSize: 16, lineHeight: 25, color: color.text.primary },
  marked: {
    color: color.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
    textDecorationColor: color.primaryLine,
  },

  /** 빈 자리는 조용해야 한다 — 카드처럼 떠 있지 않고 점선으로만 자리를 잡는다 */
  blank: {
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
    borderColor: color.border.default,
  },
  blankBody: { flex: 1, gap: 5, paddingVertical: 18, paddingHorizontal: 16 },
  blankText: { ...type.label2, lineHeight: 20, color: color.text.secondary },
});
