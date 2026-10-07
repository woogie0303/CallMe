import { Platform, type TextStyle } from 'react-native';

/**
 * Reread의 타이포 규칙은 하나뿐이다 — **세리프는 책에서 온 영어에만 쓴다.**
 *
 * 원문 문장·표현·인용은 세리프(iOS의 Iowan Old Style), 앱이 하는 말은 전부
 * 산세리프. 이 구분이 무너지면 화면이 평범해진다. 그래서 두 패밀리를 여기서만
 * 정의하고, 화면에서는 `<AppText>` / `<Quote>` 로만 고른다.
 */
export const family = {
  /** 앱이 하는 말 — 한국어 UI */
  sans: Platform.select({
    // iOS는 시스템 서체(San Francisco)를 그대로 쓴다.
    web: "'Pretendard Variable', Pretendard, -apple-system, 'Apple SD Gothic Neo', system-ui, sans-serif",
    default: undefined,
  }),
  /** 책에서 온 영어 */
  serif: Platform.select({
    ios: 'Iowan Old Style',
    web: "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif",
    default: 'serif',
  }),
} as const;

/**
 * 타입 램프. 크기·행간·자간이 한 벌로 묶여 있다.
 *
 * Wanted Design System에서 씨를 받았지만 이제 여기가 원본이다 — 웹의 `.wds-*`와
 * 값을 맞추려 들지 않는다. 두 앱을 잇는 코드가 없어서 맞춰둬도 어긋난 것을
 * 아무도 알려주지 않고, 실제로 이미 어긋나 있었다.
 */
export const type = {
  title2: t(28, 38, '700', -0.66),
  title3: t(24, 32, '700', -0.55),
  heading1: t(22, 30, '600', -0.43),
  heading2: t(20, 28, '600', -0.24),
  headline1: t(18, 26, '600', -0.04),
  headline2: t(17, 24, '600', 0),
  body1: t(16, 24, '500', 0.09),
  body1Reading: t(16, 26, '500', 0.09),
  body2: t(15, 22, '500', 0.14),
  body2Reading: t(15, 24, '500', 0.14),
  label1: t(14, 20, '500', 0.2),
  label2: t(13, 18, '500', 0.25),
  caption1: t(12, 16, '500', 0.3),
  caption2: t(11, 14, '500', 0.34),
} satisfies Record<string, TextStyle>;

function t(
  fontSize: number,
  lineHeight: number,
  fontWeight: TextStyle['fontWeight'],
  letterSpacing: number,
): TextStyle {
  return { fontSize, lineHeight, fontWeight, letterSpacing };
}

/** 램프 위에 굵기만 얹을 때 — 크기·행간은 그대로 둔다. */
export const bold = (
  style: TextStyle,
  fontWeight: TextStyle['fontWeight'] = '700',
): TextStyle => ({
  ...style,
  fontWeight,
});
