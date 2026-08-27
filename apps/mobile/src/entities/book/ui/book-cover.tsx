import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { color, spineGradient } from '@/shared/config';
import { Quote } from '@/shared/ui';
import type { Book } from '../model/types';

/**
 * 표지 대신 책등 색. 제목은 세리프로 아래에 눕는다 — 책에서 온 영어니까.
 */
export function BookCover({
  book,
  width,
  height,
  radius = 10,
  showTitle = true,
  showAuthor = false,
  titleSize = 11,
  style,
}: {
  book: Book;
  width: number;
  height: number;
  radius?: number;
  showTitle?: boolean;
  showAuthor?: boolean;
  titleSize?: number;
  style?: ViewStyle;
}) {
  return (
    <LinearGradient
      colors={book.spine}
      start={spineGradient.start}
      end={spineGradient.end}
      style={[{ width, height, borderRadius: radius }, styles.cover, style]}>
      {showTitle ? (
        <Quote style={[styles.title, { fontSize: titleSize, lineHeight: titleSize * 1.15 }]}>
          {book.title}
        </Quote>
      ) : null}
      {showAuthor ? <AuthorLine author={book.author} /> : null}
    </LinearGradient>
  );
}

function AuthorLine({ author }: { author: string }) {
  return (
    <View style={styles.authorWrap}>
      <Quote style={styles.author}>{author.toUpperCase()}</Quote>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { justifyContent: 'flex-end', padding: 9, overflow: 'hidden' },
  title: { color: color.text.onInkStrong },
  authorWrap: { marginTop: 6 },
  author: { fontSize: 9, letterSpacing: 0.54, color: 'rgba(255,255,255,0.7)' },
});
