import { ScrollView, StyleSheet, View } from 'react-native';

import type { Book } from '@/entities/book/model/types';
import { BookCover } from '@/entities/book/ui/book-cover';
import { color, type } from '@/shared/config';
import { AppText, Icon, Tap } from '@/shared/ui';

const COVER = { width: 62, height: 90 } as const;

/**
 * 지금 읽고 있는 책들이 서는 선반. 맨 위에 크게 선 한 권을 뺀 나머지가 여기 있고,
 * 끝에 한 권 더 놓는 자리가 있다.
 *
 * 책을 들이면 맨 위의 책이 바뀌는 것이 아니라 이 줄이 길어진다 — 새로 등록한
 * 책이 읽던 책을 밀어내면, 어제까지 읽던 쪽이 어디로 갔는지 알 수 없어진다.
 * 맨 위 자리는 가장 최근에 읽은 책이 지키고, 그 자리는 등록이 아니라 진도를
 * 옮길 때 바뀐다.
 */
export function ReadingShelf({
  books,
  onPressBook,
  onAdd,
}: {
  books: Book[];
  onPressBook?: (id: string) => void;
  onAdd?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}>
        {books.map((book) => (
          <Tap key={book.id} style={styles.item} onPress={() => onPressBook?.(book.id)}>
            <BookCover book={book} width={COVER.width} height={COVER.height} radius={8} />
            <AppText numberOfLines={1} style={styles.title}>
              {book.title}
            </AppText>
          </Tap>
        ))}

        <Tap style={styles.item} onPress={onAdd} accessibilityLabel="읽고 있는 책 추가">
          {/* 점선은 비어 있다는 말을 생김새로 한다 — 실선이면 이미 담긴 카드로 보인다 */}
          <View style={[styles.slot, COVER]}>
            <Icon name="plus" size={18} color={color.text.assistive} />
          </View>
          <AppText style={styles.addLabel}>책 추가</AppText>
        </Tap>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: -12 },
  rail: { gap: 10, paddingHorizontal: 20 },
  item: { width: COVER.width, gap: 6 },
  title: { ...type.caption2, color: color.text.meta },
  slot: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.border.default,
  },
  addLabel: { ...type.caption2, color: color.text.assistive },
});
