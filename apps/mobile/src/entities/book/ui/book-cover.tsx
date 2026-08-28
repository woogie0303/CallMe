import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { color, spineGradient } from '@/shared/config';
import { Quote } from '@/shared/ui';
import type { Book } from '../model/types';

/**
 * 표지 이미지가 있으면 그것을, 없거나 못 받아오면 책등 그라디언트를 보여준다.
 * 그라디언트를 지우지 않고 이미지를 그 위에 덮는 이유가 이것이다 — 표지가
 * 비어도 색만으로 어느 책인지 알 수 있어야 한다.
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
      {book.cover ? (
        <Image
          source={{ uri: book.cover }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
          accessibilityLabel={`${book.title} 표지`}
        />
      ) : null}
      {showTitle && !book.cover ? (
        <Quote style={[styles.title, { fontSize: titleSize, lineHeight: titleSize * 1.15 }]}>
          {book.title}
        </Quote>
      ) : null}
      {showAuthor && !book.cover ? <AuthorLine author={book.author} /> : null}
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
