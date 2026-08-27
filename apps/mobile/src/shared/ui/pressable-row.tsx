import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

/**
 * 프로토타입의 누를 수 있는 영역. 눌림은 투명도로만 알린다 —
 * 디자인에 눌림 상태 색이 따로 없다.
 */
export function Tap({
  style,
  ...rest
}: Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      {...rest}
      style={({ pressed }) => [style, pressed && rest.onPress ? { opacity: 0.62 } : null]}
    />
  );
}
