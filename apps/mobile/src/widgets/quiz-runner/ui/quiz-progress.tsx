import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, type } from '@/shared/config';
import { AppText, Icon, ProgressBar, Tap } from '@/shared/ui';

/** 퀴즈의 헤더는 남은 길이를 보여주는 게 일이다. */
export function QuizProgress({
  index,
  total,
  onClose,
}: {
  index: number;
  total: number;
  onClose?: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.row, { paddingTop: insets.top + 6 }]}>
      <Tap hitSlop={12} onPress={onClose}>
        <Icon name="close" size={20} color={color.text.primary} />
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
