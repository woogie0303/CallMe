import { StyleSheet, View } from 'react-native';

import { accent, color, slate } from '@/shared/config';

/**
 * 찍어둔 책 페이지. 글자를 읽히려는 게 아니라 "종이 한 장을 담아뒀다"는
 * 사실만 보여준다 — 포인트 색 줄 하나가 그중 무엇을 집었는지 가리킨다.
 */
export function PageThumb({
  width,
  height,
  lines = [0.88, 0.96, 0.7, 0.92, 0.8, 0.94, 0.6],
  /** 몇 번째 줄이 표현이 있는 줄인지 */
  markedLine = 2,
  lineHeight = 4,
  padding = 12,
  gap = 5,
}: {
  width: number;
  height: number;
  lines?: number[];
  markedLine?: number;
  lineHeight?: number;
  padding?: number;
  gap?: number;
}) {
  return (
    <View
      style={[
        styles.page,
        {
          width,
          height,
          paddingVertical: padding,
          paddingHorizontal: padding - 2,
          gap,
        },
      ]}
    >
      {lines.map((w, i) => (
        <View
          key={i}
          style={{
            width: `${w * 100}%`,
            height: lineHeight,
            borderRadius: 2,
            backgroundColor:
              i === markedLine
                ? accent(0.5)
                : i === lines.length - 1
                  ? slate(0.12)
                  : slate(0.18),
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    borderRadius: 12,
    backgroundColor: color.surface.page,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border.default,
    overflow: 'hidden',
  },
});
