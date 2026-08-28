import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import type { Book } from '../model/types';

/**
 * 카드 위쪽에 꽂힌 책갈피. 색은 책등에서 온다 —
 * 지금 펼쳐둔 책이 어느 책인지 제목을 읽지 않아도 알게 하는 것이 전부다.
 */
export function SpineRibbon({
  book,
  width = 26,
  height = 34,
}: {
  book: Book;
  width?: number;
  height?: number;
}) {
  const id = `ribbon-${book.id}`;
  return (
    <Svg width={width} height={height} viewBox="0 0 26 34">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0.75" y2="1">
          <Stop offset="0" stopColor={book.spine[0]} />
          <Stop offset="1" stopColor={book.spine[1]} />
        </LinearGradient>
      </Defs>
      {/* 아래쪽 V 홈이 책갈피처럼 보이게 한다 */}
      <Path d="M0 0 H26 V34 L13 24.5 L0 34 Z" fill={`url(#${id})`} />
    </Svg>
  );
}
