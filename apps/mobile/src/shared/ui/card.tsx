import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { color, shadow } from '@/shared/config';

/**
 * 흰 카드. 테두리는 실선이 아니라 머리카락 굵기의 안쪽 선이다 —
 * Wanted의 카드는 선보다 그림자로 떠 있다.
 */
export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** 회색 바탕 위에 얹는 조용한 블록 — 부연 설명, 곁들이는 정보. */
export function AltPanel({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.alt, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.surface.card,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border.subtle,
    ...shadow.card,
  },
  alt: {
    backgroundColor: color.surface.alt,
    borderRadius: 18,
  },
});
