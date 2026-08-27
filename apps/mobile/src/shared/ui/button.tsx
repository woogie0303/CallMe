import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { color, shadow, type } from '@/shared/config';
import { Tap } from './pressable-row';
import { AppText } from './text';

type Variant = 'primary' | 'ink' | 'subtle';

/** 화면 아래에 놓이는 한 줄짜리 행동. 파란색은 화면당 하나뿐이다. */
export function ActionButton({
  label,
  aside,
  variant = 'primary',
  onPress,
  style,
}: {
  label: string;
  /** 라벨 뒤에 붙는 곁말 — "4개" 같은 수 */
  aside?: string;
  variant?: Variant;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const v = VARIANTS[variant];
  return (
    <Tap onPress={onPress} style={[styles.base, v.container, style]}>
      <View style={styles.inner}>
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
  inner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontWeight: '600' },
  aside: { ...type.label2, fontWeight: '500' },
});
