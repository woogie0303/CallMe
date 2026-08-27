import { LinearGradient } from 'expo-linear-gradient';

import { spineGradient } from '@/shared/config';
import type { Book } from '../model/types';

/**
 * 라벨 없는 출처 표시. 문장 카드·메모 카드 왼쪽에 서서
 * "이건 그 책에서 온 것"이라고만 말한다.
 */
export function BookSpine({
  book,
  width = 34,
  height = 46,
  radius = 6,
}: {
  book: Book;
  width?: number;
  height?: number;
  radius?: number;
}) {
  return (
    <LinearGradient
      colors={book.spine}
      start={spineGradient.start}
      end={spineGradient.end}
      style={{ width, height, borderRadius: radius }}
    />
  );
}
