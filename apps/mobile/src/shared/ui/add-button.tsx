import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { color, type } from '@/shared/config';
import { Icon } from './icon';
import { Tap } from './pressable-row';
import { AppText } from './text';

/**
 * 아직 없는 것을 채워 넣는 자리. 테두리를 점선으로 둔 이유가 그것이다 —
 * 실선으로 두르면 이미 무언가 담긴 카드처럼 보이고, 점선은 비어 있다는 말을
 * 생김새로 한다.
 */
export function AddButton({
  label,
  onPress,
  style,
}: {
  label: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Tap
      style={[styles.button, style]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Icon name="plus" size={15} color={color.text.meta} />
      <AppText style={styles.label}>{label}</AppText>
    </Tap>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 64,
    borderRadius: 18,
    /** 점선은 굵기가 1 이상이어야 점으로 끊긴다 */
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.border.default,
  },
  label: { ...type.label2, fontWeight: '600', color: color.text.secondary },
});
