import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { color, shadow, type } from '@/shared/config';
import { Tap } from './pressable-row';
import { AppText } from './text';

type Variant = 'primary' | 'ink' | 'subtle';

/**
 * 화면 아래에 놓이는 한 줄짜리 행동. 포인트 색은 화면당 하나뿐이다.
 *
 * 아직 누를 수 없는 것은 `disabled`로 말한다 — 색을 subtle로 바꿔 말하지
 * 않는다. 그렇게 하면 '아직 안 됨'이 '이것도 누를 수 있는 다른 선택'처럼
 * 보여서, 화면에 진짜 버튼이 둘 있는 것이 된다.
 *
 * `loading`은 누름까지 함께 막는다. 글자만 '저장하는 중…'으로 바꿔두면
 * 두 번 눌리고, 그때마다 서버에 두 번 쓴다.
 */
export function ActionButton({
  label,
  aside,
  variant = 'primary',
  disabled,
  loading,
  onPress,
  style,
}: {
  label: string;
  /** 라벨 뒤에 붙는 곁말 — "4개" 같은 수 */
  aside?: string;
  variant?: Variant;
  /** 지금은 누를 수 없다 — 왜인지는 라벨이나 곁의 글이 말한다 */
  disabled?: boolean;
  /** 눌러서 무언가 도는 중 — 누름도 함께 막힌다 */
  loading?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const v = VARIANTS[variant];
  const off = Boolean(disabled || loading);

  return (
    <Tap
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={aside ? `${label} ${aside}` : label}
      accessibilityState={{ disabled: off, busy: Boolean(loading) }}
      style={[styles.base, v.container, off ? styles.off : null, style]}>
      <View style={styles.inner}>
        {loading ? <ActivityIndicator size="small" color={v.label.color} /> : null}
        <AppText style={[styles.label, v.label]}>{label}</AppText>
        {aside ? <AppText style={[styles.aside, v.aside]}>{aside}</AppText> : null}
      </View>
    </Tap>
  );
}

const VARIANTS = {
  primary: {
    container: { backgroundColor: color.primary, height: 52, ...shadow.primary },
    label: { color: color.text.onInk, fontSize: 16 },
    aside: { color: color.text.onInkMuted },
  },
  ink: {
    container: { backgroundColor: color.surface.ink, height: 52 },
    label: { color: color.text.onInk, fontSize: 15 },
    aside: { color: color.text.onInkMuted },
  },
  subtle: {
    container: { backgroundColor: color.fill.default, height: 48 },
    label: { color: color.text.body, fontSize: 15 },
    aside: { color: color.text.meta },
  },
} as const;

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** 떠 있는 그림자까지 함께 거둔다 — 누를 수 없는 것은 떠 있지 않다 */
  off: {
    opacity: 0.42,
    shadowOpacity: 0,
    elevation: 0,
  },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontWeight: '600' },
  aside: { ...type.label2, fontWeight: '500' },
});
