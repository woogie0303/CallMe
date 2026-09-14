import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, type } from '@/shared/config';
import { AppText, Icon, Tap } from '@/shared/ui';

/**
 * 퀴즈의 머리. 지금 어디인지(퀴즈)와 몇 번째인지를 말한다.
 *
 * 진행률 막대는 걷어냈다 — 가늘게 차오르는 막대는 화면 로딩바처럼 보여서
 * '지금 불러오는 중인가' 하는 착각을 준다. 숫자 하나(n/총)면 충분하다.
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
      <View style={styles.side}>
        <Tap hitSlop={12} onPress={onBack} accessibilityLabel="뒤로">
          <Icon name="arrowLeft" size={20} color={color.text.primary} />
        </Tap>
      </View>
      <AppText style={styles.title}>퀴즈</AppText>
      <View style={[styles.side, styles.trailing]}>
        {total > 0 ? (
          <AppText style={styles.count}>
            {index} / {total}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  side: { minWidth: 40, justifyContent: 'center' },
  trailing: { alignItems: 'flex-end' },
  title: { ...type.label2, fontWeight: '600', color: color.text.meta },
  count: { ...type.caption1, fontWeight: '600', color: color.text.meta },
});
