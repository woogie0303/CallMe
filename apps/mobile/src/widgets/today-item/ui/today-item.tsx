import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { SpineEdge } from "@/entities/book/ui/spine-edge";
import type { ItemSummary } from "@/entities/lexical-item/api/item.api";
import { color, type } from "@/shared/config";
import { gapLabel } from "@/shared/lib/date";
import { AppText, Quote, Tap, emphasis } from "@/shared/ui";

/**
 * 오늘의 표현 — 담아둔 것 중 하나를 홈으로 끌어올린다.
 *
 * 서랍처럼 목록을 펴지 않는다. 홈에 있어도 되는 이유는 고를 거리를 주기
 * 때문이 아니라 **오늘 이걸 다시 볼 이유**를 대기 때문이다. 그래서 뜻보다
 * 아래 한 줄이 중요하다 — 얼마 만에 또 헷갈렸는지.
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
  const gap = item.gapDays === undefined ? undefined : gapLabel(item.gapDays);
  /** 카드 왼쪽 엣지는 가장 최근에 만난 책의 색이다 */
  const book = item.books[item.books.length - 1];

  return (
    <Tap style={[styles.card, style]} onPress={onPress}>
      {book ? <SpineEdge book={book} /> : null}
      <View style={styles.body}>
        <AppText style={styles.eyebrow}>오늘의 표현</AppText>
        <Quote numberOfLines={1} style={styles.term}>
          {item.term}
        </Quote>
        <AppText numberOfLines={1} ellipsizeMode="tail" style={styles.meaning}>
          {item.meaning}
        </AppText>
        <AppText style={styles.reason}>
          {gap ? (
            <>
              <AppText style={emphasis(color.primary)}>{gap}</AppText> 또
              헷갈렸어요
            </>
          ) : (
            `${item.latest?.savedLabel ?? '언젠가'}에 담아뒀어요`
          )}
        </AppText>
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  /**
   * 제 내용만큼만 쓴다. 가로줄에 서던 카드라 flex: 1을 달고 있었는데, 세로로
   * 쌓이는 홈에서는 그게 '남는 높이를 다 가져가라'는 말이 되어 카드가 늘어났다.
   * 남는 높이는 아래의 '읽고 있는 책 추가'가 받는다.
   */
  card: {
    flexShrink: 1,
    flexDirection: "row",
    borderRadius: 18,
    backgroundColor: color.surface.base,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border.subtle,
    overflow: "hidden",
  },
  /** 판이 검색 타일과 키를 맞추느라 늘어나도 글은 가운데에 선다 */
  body: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    gap: 3,
    paddingHorizontal: 14,
  },
  eyebrow: { ...type.caption2, color: color.text.meta },
  term: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "600",
    color: color.text.primary,
  },
  meaning: { ...type.label2, color: color.text.secondary },
  reason: { ...type.caption2, color: color.text.meta, marginTop: 3 },
});
