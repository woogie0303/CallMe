import { StyleSheet, View } from 'react-native';

import { color, type } from '@/shared/config';
import { AppText, Icon, Tap } from '@/shared/ui';

/**
 * 답을 기다리는 문장이 있을 때만 홈에 뜬다. 배지도 숫자 알림도 아니다 —
 * 밀린 것처럼 보이는 순간 이 앱은 사람을 읽기에서 밀어낸다. (Q11·Q16)
 */
export function PendingBanner({ count, onPress }: { count: number; onPress?: () => void }) {
  return (
    <Tap style={styles.banner} onPress={onPress}>
      <Icon name="clock" size={16} color={color.primary} />
      <View style={styles.text}>
        <AppText style={styles.title}>문장 {count}개가 답을 기다려요</AppText>
        <AppText style={styles.hint}>다음 달에 자동으로 풀려요</AppText>
      </View>
      <Icon name="chevronRight" size={14} color={color.text.assistive} />
    </Tap>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: color.primaryBgSoft,
  },
  text: { flex: 1, gap: 2 },
  title: { ...type.label2, fontWeight: '700', color: color.text.primary },
  hint: { ...type.caption2, color: color.text.meta },
});
