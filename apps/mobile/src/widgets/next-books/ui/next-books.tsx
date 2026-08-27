import { ScrollView, StyleSheet, View } from 'react-native';

import type { Book } from '@/entities/book/model/types';
import { BookCover } from '@/entities/book/ui/book-cover';
import { color, type } from '@/shared/config';
import { AppText, SectionHeader, Tap } from '@/shared/ui';

export function NextBooks({
  books,
  onPressBook,
  onPressMore,
}: {
  books: Book[];
  onPressBook?: (id: string) => void;
  onPressMore?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <Tap onPress={onPressMore}>
        <SectionHeader title="다음에 읽어볼 만한 책" aside="더보기" />
      </Tap>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}>
        {books.map((book) => (
          <Tap key={book.id} style={styles.item} onPress={() => onPressBook?.(book.id)}>
            <BookCover book={book} width={88} height={96} radius={10} />
            <AppText numberOfLines={1} style={styles.title}>
              {book.title}
            </AppText>
          </Tap>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  rail: { gap: 12, paddingRight: 20 },
  item: { width: 88, gap: 7 },
  title: { ...type.caption2, fontWeight: '600', color: color.text.primary },
});
