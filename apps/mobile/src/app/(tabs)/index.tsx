import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PENDING_ASKS } from '@/entities/ask/model/mock';
import { bookById, NEXT_BOOKS } from '@/entities/book/model/mock';
import { ITEMS } from '@/entities/lexical-item/model/mock';
import { CURRENT_READING, READING_QUARTER } from '@/entities/reading/model/mock';
import { color, type } from '@/shared/config';
import { AppText, Icon, Tap } from '@/shared/ui';
import { ItemShelf } from '@/widgets/item-shelf/ui/item-shelf';
import { NextBooks } from '@/widgets/next-books/ui/next-books';
import { PendingBanner } from '@/widgets/pending-asks/ui/pending-banner';
import { ReadingHero } from '@/widgets/reading-hero/ui/reading-hero';
import { ReadingQuarterGrid } from '@/widgets/reading-quarter/ui/reading-quarter';

/** 01 홈 — 읽고 있는 책 하나와, 그 책에서 건져둔 것들. */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const book = bookById(CURRENT_READING.bookId);
  if (!book) return null;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <AppText style={styles.wordmark}>Reread</AppText>
        <Tap hitSlop={12} onPress={() => router.push('/book-confirm')}>
          <Icon name="search" size={21} color={color.text.primary} />
        </Tap>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={styles.scroll}>
        <ReadingHero
          book={book}
          progress={CURRENT_READING}
          onPressBook={() => router.push({ pathname: '/book/[id]', params: { id: book.id } })}
          onWriteMemo={() => router.push('/ask')}
          onCapture={() => router.push('/scan')}
        />
        {PENDING_ASKS.length ? (
          <PendingBanner count={PENDING_ASKS.length} onPress={() => router.push('/pending')} />
        ) : null}
        <ReadingQuarterGrid quarter={READING_QUARTER} />
        <ItemShelf
          items={ITEMS.slice(0, 2)}
          total={ITEMS.length}
          onPressItem={(id) => router.push({ pathname: '/item/[id]', params: { id } })}
        />
        <NextBooks
          books={NEXT_BOOKS}
          onPressBook={(id) => router.push({ pathname: '/book/[id]', params: { id } })}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surface.base },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  wordmark: { ...type.title2, fontSize: 26, letterSpacing: -0.78, color: color.text.primary },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 24, gap: 14 },
});
