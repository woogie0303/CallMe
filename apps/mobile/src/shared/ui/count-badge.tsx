import { StyleSheet, View } from 'react-native';

import { color, type } from '@/shared/config';
import { AppText } from './text';

/**
 * "2번 만남" — 서랍에서 이 배지가 붙은 카드만이 북모리가 못 하는 일이다.
 * 그래서 파랗고, 그래서 한 번만 만난 항목에는 아예 붙지 않는다.
 */
export function CountBadge({ label }: { label: string }) {
  return (
    <View style={styles.badge}>
      <AppText style={styles.label}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: color.primaryTint,
  },
  label: { ...type.caption2, fontWeight: '700', color: color.primary },
});
