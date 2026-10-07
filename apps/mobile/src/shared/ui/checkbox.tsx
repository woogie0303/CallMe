import { StyleSheet, View } from 'react-native';

import { color } from '@/shared/config';
import { Icon } from './icon';

/**
 * 고르는 칸. 누르는 일은 줄 전체가 받는다 — 칸만 눌리게 두면 작아서 놓친다. 그래서 이
 * 조각은 상태를 그리기만 하고, 스크린리더에는 줄이 `selected`를 말한다.
 */
export function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View
      style={[styles.box, checked ? styles.on : null]}
      importantForAccessibility="no-hide-descendants"
    >
      {checked ? (
        <Icon name="check" size={16} color={color.text.onInk} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: color.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.surface.base,
  },
  on: { backgroundColor: color.primary, borderColor: color.primary },
});
