import { StyleSheet, View } from 'react-native';

import { color, type } from '@/shared/config';
import { AppText } from './text';
import { Mark, type MarkName } from './marks';

/**
 * 데이터가 없는 자리. 글만 있으면 화면이 덜 만들어진 것처럼 보인다 —
 * 캐릭터를 먼저 두고, 그 아래에 짧게만 적는다.
 */
export function EmptyState({
  mark,
  title,
  body,
  compact,
}: {
  mark: MarkName;
  title: string;
  body?: string;
  /** 화면 전체가 아니라 한 구획 안에 놓일 때 — 위아래 여백을 줄인다 */
  compact?: boolean;
}) {
  return (
    <View style={[styles.wrap, compact ? styles.compact : null]}>
      <Mark name={mark} size={compact ? 84 : 112} />
      <AppText style={styles.title}>{title}</AppText>
      {body ? <AppText style={styles.body}>{body}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24, gap: 10 },
  compact: { paddingVertical: 20 },
  title: { ...type.label1, fontWeight: '600', color: color.text.secondary, textAlign: 'center' },
  body: {
    ...type.caption1,
    lineHeight: 18,
    color: color.text.secondary,
    textAlign: 'center',
  },
});
