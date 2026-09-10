import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { bookById } from '@/entities/book/model/mock';
import { color, type } from '@/shared/config';
import { ActionButton, AppText, ScreenHeader } from '@/shared/ui';
import { BookConfirm } from '@/widgets/book-confirm/ui/book-confirm';

/** 02 책 등록 — 검색 결과 하나를 확인하고 서가에 들인다. */
export default function BookConfirmScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const book = bookById('klara');
  if (!book) return null;

  return (
    <View style={styles.screen}>
      <ScreenHeader
        leading="back"
        onLeadingPress={() => router.back()}
        gap={10}
        trailing={<AppText style={styles.count}>검색 결과 1 / 3</AppText>}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={styles.scroll}>
        <BookConfirm book={book} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <ActionButton label="네, 이 책 맞아요" onPress={() => router.back()} />
        <ActionButton label="다른 결과 보기" variant="subtle" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surface.base },
  count: { ...type.caption1, fontWeight: '600', color: color.text.meta },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
  footer: { paddingHorizontal: 24, paddingTop: 12, gap: 10 },
});
