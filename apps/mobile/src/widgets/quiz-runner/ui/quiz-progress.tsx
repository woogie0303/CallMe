import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, type } from '@/shared/config';
import { AppText, Icon, ProgressBar, Tap } from '@/shared/ui';

/**
 * 퀴즈의 머리는 남은 길이를 보여주는 게 일이다.
 *
 * 닫기(✕) 대신 뒤로(←)를 둔다. 푸는 도중에 나가는 일은 그만두는 게 아니라
 * 잠깐 물러나는 것에 가깝고, ✕는 지금까지 푼 것이 사라진다는 말처럼 읽힌다.
 */
export function QuizProgress({
  index,
  total,
  onBack,
}: {
  index: number;
  total: number;
  onBack?: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.row, { paddingTop: insets.top + 6 }]}>
      <Tap hitSlop={12} onPress={onBack} accessibilityLabel="뒤로">
        <Icon name="arrowLeft" size={20} color={color.text.primary} />
      </Tap>
      <View style={styles.bar}>
        <ProgressBar
          value={index / total}
          height={6}
          track="rgba(112,115,124,0.1)"
          fill={color.surface.ink}
        />
      </View>
      <AppText style={styles.count}>
        {index} / {total}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  bar: { flex: 1 },
  count: { ...type.caption1, fontWeight: '600', color: color.text.meta },
});
