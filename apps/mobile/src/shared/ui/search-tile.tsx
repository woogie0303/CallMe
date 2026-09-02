import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { color, type } from '@/shared/config';
import { Icon } from './icon';
import { Tap } from './pressable-row';
import { AppText } from './text';

/**
 * 검색으로 들어가는 자리. 입력창이 아니라 타일이다.
 *
 * 홈에서 바로 타이핑하게 두지 않는 이유는, 여기서 칠 글자를 받아줄 목록이
 * 홈에 없기 때문이다 — 아무 반응 없는 입력창은 고장난 것처럼 보인다.
 * 가로로 긴 입력창은 그 오해를 부르기까지 했다. 폭을 아이콘만큼 줄이니
 * 눌러서 넘어가는 자리라는 게 생김새로 먼저 보이고, 남은 가로 폭은 오늘의
 * 표현이 가져간다.
 */
export function SearchTile({
  label = '찾기',
  onPress,
  style,
}: {
  label?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Tap
      style={[styles.tile, style]}
      onPress={onPress}
      accessibilityRole="search"
      accessibilityLabel="책이나 표현 찾기">
      <Icon name="search" size={19} color={color.text.secondary} />
      <AppText style={styles.label}>{label}</AppText>
    </Tap>
  );
}

const styles = StyleSheet.create({
  /** 오늘의 표현과 키를 맞춘다 — 높이는 행이 정한다 */
  tile: {
    width: 68,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 18,
    backgroundColor: color.surface.alt,
  },
  label: { ...type.caption2, color: color.text.secondary },
});
