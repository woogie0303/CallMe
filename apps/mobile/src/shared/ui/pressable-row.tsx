import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

/**
 * 누를 수 있는 영역. 눌림은 투명도로만 알린다 —
 * 디자인에 눌림 상태 색이 따로 없다.
 *
 * 누를 수 없는 것은 눌린 척하지 않는다. `disabled`거나 `onPress`가 아예 없으면
 * 투명도도 움직이지 않는다 — 눌리는 시늉을 해놓고 아무 일도 안 일어나면,
 * 누른 사람은 앱이 고장났다고 읽는다.
 */
export function Tap({
  style,
  ...rest
}: Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle> }) {
  const live = Boolean(rest.onPress) && !rest.disabled;
  return (
    <Pressable
      {...rest}
      disabled={rest.disabled ?? !rest.onPress}
      style={({ pressed }) => [
        style,
        pressed && live ? { opacity: 0.62 } : null,
      ]}
    />
  );
}
