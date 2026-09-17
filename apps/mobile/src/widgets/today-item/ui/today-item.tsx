import { useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { SpineEdge } from '@/entities/book/ui/spine-edge';
import type { ItemSummary } from '@/entities/lexical-item/api/item.api';
import { markSegments } from '@/entities/sentence/lib/segments';
import { color, type } from '@/shared/config';
import { gapLabel } from '@/shared/lib/date';
import { AppText, Icon, Quote, Tap, emphasis } from '@/shared/ui';

/**
 * 오늘 다시 볼 문장 — 담아둔 것 중 하나를 홈으로 끌어올린다.
 *
 * 서랍처럼 목록을 펴지 않는다. 홈에 있어도 되는 이유는 고를 거리를 주기
 * 때문이 아니라 **오늘 이걸 다시 볼 이유**를 대기 때문이다. 그래서 뜻보다
 * 아래 한 줄이 중요하다 — 얼마 만에 또 헷갈렸는지.
 *
 * 예전에는 표제형을 크게 세우고 그 밑에 한국어 뜻을 붙였는데, 그게 바로
 * ADR-0004가 서랍에서 걷어낸 단어장 모양이었다. 서랍은 문장으로 바꿔놓고
 * 홈만 낱말 카드로 두면 같은 앱으로 보이지 않는다. 그래서 여기도 **문장이
 * 먼저고 표현은 그 안의 밑줄**이며, 한국어는 눌러야 열린다.
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
  const [open, setOpen] = useState(false);
  const gap = item.gapDays === undefined ? undefined : gapLabel(item.gapDays);
  /** 카드 왼쪽 엣지는 가장 최근에 만난 책의 색이다 */
  const book = item.books[item.books.length - 1];
  const latest = item.latest;

  /** 그 문장에 쳐진 밑줄 — 같은 표현도 문장마다 나타난 꼴이 다르다 */
  const surface = latest
    ? item.encounters.find((met) => met.sentenceId === latest.sentenceId)?.surface
    : undefined;
  const segments = latest
    ? markSegments(
        latest.text,
        surface ? [{ surface, term: item.term, meaning: item.meaning }] : [],
      )
    : [];

  return (
    <View style={[styles.card, style]}>
      {book ? <SpineEdge book={book} /> : null}
      <View style={styles.body}>
        <View style={styles.head}>
          <AppText style={styles.eyebrow}>오늘 다시 볼 문장</AppText>
          {item.met > 1 ? <AppText style={styles.met}>{item.met}번 만남</AppText> : null}
        </View>

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

        {/* 한국어는 옆이 아니라 아래로, 청했을 때만 */}
        {open ? (
          <View style={styles.meaning}>
            <Quote style={styles.meaningTerm}>{item.term}</Quote>
            <AppText style={styles.meaningText}>{item.meaning}</AppText>
          </View>
        ) : null}

        <View style={styles.foot}>
          <AppText style={styles.reason}>
            {gap ? (
              <>
                <AppText style={emphasis(color.primary)}>{gap}</AppText> 또 헷갈렸어요
              </>
            ) : (
              `${latest?.savedLabel ?? '언젠가'}에 담아뒀어요`
            )}
          </AppText>

          <Tap
            hitSlop={8}
            onPress={() => setOpen((v) => !v)}
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
            accessibilityLabel={open ? '뜻 닫기' : '뜻 보기'}>
            <AppText style={styles.reveal}>{open ? '뜻 닫기' : '뜻 보기'}</AppText>
          </Tap>

          <Tap
            hitSlop={8}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${item.term}을 만난 문장 모두 보기`}>
            <Icon name="chevronRight" size={14} color={color.text.meta} />
          </Tap>
        </View>
      </View>
    </View>
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
  body: { flex: 1, minWidth: 0, gap: 8, paddingVertical: 14, paddingHorizontal: 15 },

  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  eyebrow: { ...type.caption2, color: color.text.meta },
  met: { ...type.caption2, fontWeight: '700', color: color.primary },

  sentence: { fontSize: 16, lineHeight: 25, color: color.text.primary },
  marked: {
    color: color.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
    textDecorationColor: color.primaryLine,
  },

  meaning: {
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: color.primaryBg,
  },
  meaningTerm: { fontSize: 14, lineHeight: 19, fontWeight: '600', color: color.primary },
  meaningText: { ...type.label2, lineHeight: 20, color: color.text.body },

  foot: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  reason: { flex: 1, ...type.caption2, color: color.text.meta },
  reveal: { ...type.caption2, fontWeight: '600', color: color.text.meta },

  /** 빈 자리는 조용해야 한다 — 카드처럼 떠 있지 않고 점선으로만 자리를 잡는다 */
  blank: {
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
    borderColor: color.border.default,
  },
  blankBody: { flex: 1, gap: 5, paddingVertical: 18, paddingHorizontal: 16 },
  blankText: { ...type.label2, lineHeight: 20, color: color.text.secondary },
});
