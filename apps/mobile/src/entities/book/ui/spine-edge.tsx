import { LinearGradient } from 'expo-linear-gradient';
import type { ViewStyle } from 'react-native';

import { spineGradient } from '@/shared/config';
import type { Book } from '../model/types';

/**
 * 카드 왼쪽에 서는 4px 엣지. 라벨 없이 출처만 말한다 —
 * 문장·항목 카드는 전부 이 색을 물려받는다.
 */
export function SpineEdge({ book, style }: { book: Book; style?: ViewStyle }) {
  return (
    <LinearGradient
      colors={book.spine}
      start={spineGradient.start}
      end={spineGradient.end}
      style={[{ width: 4, alignSelf: 'stretch' }, style]}
    />
  );
}

/** 여러 책에서 온 것을 한 줄로 보여줄 때 쓰는 작은 점 */
export function SpineDot({ book, size = 8 }: { book: Book; size?: number }) {
  return (
    <LinearGradient
      colors={book.spine}
      start={spineGradient.start}
      end={spineGradient.end}
      style={{ width: size, height: size, borderRadius: size / 2 }}
    />
  );
}
