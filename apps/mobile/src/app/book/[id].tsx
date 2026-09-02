import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { bookById } from '@/entities/book/model/mock';
import { CURRENT_READING } from '@/entities/reading/model/mock';
import { color, type } from '@/shared/config';
import { AppText, ScreenHeader } from '@/shared/ui';
import { BookDetail } from '@/widgets/book-detail/ui/book-detail';

/** 책 한 권의 기록 — 홈이나 서랍의 출처 표시에서 들어온다. */
export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const book = bookById(id);

  return (
    <View style={styles.screen}>
      <ScreenHeader leading="back" onLeadingPress={() => router.back()} title="책" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={styles.scroll}>
        {book ? (
          <BookDetail
            book={book}
            progress={book.id === CURRENT_READING.bookId ? CURRENT_READING : undefined}
            onOpenItem={(itemId) =>
              router.push({ pathname: '/item/[id]', params: { id: itemId } })
            }
            onOpenRetell={() => router.push('/retell')}
          />
        ) : (
          <AppText style={styles.missing}>그 책을 찾지 못했어요.</AppText>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surface.base },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  missing: { ...type.label1, color: color.text.assistive, paddingTop: 40, textAlign: 'center' },
});
