import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { useBook, useCurrentBook } from '@/entities/book/api/book.api';
import { color, type } from '@/shared/config';
import { AppText, ScreenHeader } from '@/shared/ui';
import { BookDetail } from '@/widgets/book-detail/ui/book-detail';

/** 책 한 권의 기록 — 홈이나 서랍의 출처 표시에서 들어온다. */
export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: book, isPending } = useBook(id);
  const { data: reading } = useCurrentBook();
  const current = reading?.book.id === id ? reading : undefined;

  return (
    <View style={styles.screen}>
      <ScreenHeader leading="back" onLeadingPress={() => router.back()} title="책" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={styles.scroll}>
        {isPending ? (
          <ActivityIndicator style={styles.spinner} color={color.text.assistive} />
        ) : book ? (
          <BookDetail
            book={book}
            progress={
              current
                ? {
                    bookId: book.id,
                    currentPage: current.progress.currentPage,
                    totalPages: current.progress.pages ?? 0,
                    chapter: '',
                    startedLabel: '',
                    lastReadLabel: '',
                  }
                : undefined
            }
            onOpenItem={(itemId) =>
              router.push({ pathname: '/item/[id]', params: { id: itemId } })
            }
            onOpenRetell={() => router.push('/retell')}
            {...(current
              ? {
                  onAsk: () =>
                    router.push({ pathname: '/ask', params: { bookId: book.id } }),
                  onCapture: () => router.push('/scan'),
                }
              : null)}
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
  spinner: { paddingTop: 40 },
  missing: { ...type.label1, color: color.text.assistive, paddingTop: 40, textAlign: 'center' },
});
