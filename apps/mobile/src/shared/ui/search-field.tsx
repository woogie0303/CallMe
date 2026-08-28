import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { color, type } from '@/shared/config';
import { Icon } from './icon';
import { Tap } from './pressable-row';
import { AppText } from './text';

/**
 * 입력창처럼 보이지만 눌러서 검색 화면으로 들어가는 자리.
 *
 * 홈에서 바로 타이핑하게 두지 않는 이유는, 여기서 칠 글자를 받아줄 목록이
 * 홈에 없기 때문이다 — 아무 반응 없는 입력창은 고장난 것처럼 보인다.
 */
export function SearchField({
  placeholder = '책이나 표현 찾기',
  onPress,
  style,
}: {
  placeholder?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Tap style={[styles.field, style]} onPress={onPress} accessibilityRole="search">
      <Icon name="search" size={17} color={color.text.assistive} />
      <AppText style={styles.placeholder}>{placeholder}</AppText>
    </Tap>
  );
}

const styles = StyleSheet.create({
  field: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: color.surface.alt,
  },
  placeholder: { ...type.label1, color: color.text.assistive },
});
