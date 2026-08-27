import { Text, type TextProps, type TextStyle } from 'react-native';

import { color, family } from '@/shared/config';

/**
 * 앱이 하는 말. 한국어 UI는 전부 이쪽이다.
 *
 * 화면에서 `<Text>`를 직접 쓰지 않는 이유는 하나다 — 산세리프/세리프의 경계가
 * 흐려지는 순간 Reread는 평범한 단어장처럼 보이기 시작한다.
 */
export function AppText({ style, ...rest }: TextProps) {
  return <Text {...rest} style={[{ fontFamily: family.sans, color: color.text.primary }, style]} />;
}

/**
 * 책에서 그대로 옮겨온 영어 — 문장, 표현, 인용.
 * 앱이 지어낸 문장에는 쓰지 않는다.
 */
export function Quote({ style, ...rest }: TextProps) {
  return <Text {...rest} style={[{ fontFamily: family.serif, color: color.text.primary }, style]} />;
}

/** 문장 안에서 한 조각만 강조할 때 — 부모의 크기·행간을 물려받는다. */
export const emphasis = (tone: string = color.text.primary): TextStyle => ({
  fontWeight: '700',
  color: tone,
});
