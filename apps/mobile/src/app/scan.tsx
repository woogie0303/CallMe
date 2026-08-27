import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SCANNED_PAGE } from '@/entities/ask/model/mock';
import { bookById } from '@/entities/book/model/mock';
import { BookSpine } from '@/entities/book/ui/book-spine';
import { color, type } from '@/shared/config';
import { ActionButton, AppText, HeaderAction, ScreenHeader } from '@/shared/ui';
import { ScannedPage } from '@/widgets/scan/ui/scanned-page';

/**
 * 04-a 페이지 촬영 — 찍은 쪽에서 물어볼 문장 하나를 고른다.
 *
 * 책은 아직 없어도 된다. 카메라를 열고 답을 받기까지 사이에
 * 아무것도 끼워 넣지 않는 것이 이 화면의 목적이다.
 */
export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selected, setSelected] = useState<string | undefined>();
  const book = bookById(SCANNED_PAGE.bookId);

  return (
    <View style={styles.screen}>
      <ScreenHeader
        leading="back"
        onLeadingPress={() => router.back()}
        trailing={<HeaderAction label="다시 찍기" tone={color.text.meta} />}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={styles.scroll}>
        <View>
          <AppText style={styles.headline}>어느 문장에서{'\n'}막히셨어요?</AppText>
          {book ? (
            <View style={styles.source}>
              <BookSpine book={book} width={18} height={24} radius={3} />
              <AppText style={styles.sourceText}>
                {book.title} · p.{SCANNED_PAGE.page} · {SCANNED_PAGE.capturedLabel}
              </AppText>
            </View>
          ) : null}
        </View>

        <ScannedPage
          sentences={SCANNED_PAGE.sentences}
          selected={selected}
          onSelect={setSelected}
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <ActionButton
          label={selected ? '이 문장 물어보기' : '문장을 골라주세요'}
          variant={selected ? 'primary' : 'subtle'}
          onPress={
            selected
              ? () => router.push({ pathname: '/capture', params: { sentence: selected } })
              : undefined
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surface.base },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 24, gap: 18 },
  headline: {
    ...type.title3,
    color: color.text.primary,
    lineHeight: 33,
  },
  source: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  sourceText: { ...type.caption1, color: color.text.meta },
  footer: { paddingHorizontal: 20, paddingTop: 12 },
});
