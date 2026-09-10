import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ASKS, askForSentence, SCANNED_PAGE } from '@/entities/ask/model/mock';
import { bookById } from '@/entities/book/model/mock';
import { color, type } from '@/shared/config';
import { ActionButton, AltPanel, AppText, HeaderAction, Quote, ScreenHeader } from '@/shared/ui';
import { AskResult } from '@/widgets/ask/ui/ask-result';
import { CaptureSummary } from '@/widgets/capture-result/ui/capture-summary';

/**
 * 04-b 촬영한 문장의 답.
 *
 * 타이핑으로 물은 것(`app/ask.tsx`)과 같은 답이라 같은 위젯을 쓴다 —
 * 들어온 길만 다를 뿐, 질문의 단위는 언제나 문장 하나다. (docs/adr/0001)
 */
export default function CaptureScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sentence } = useLocalSearchParams<{ sentence?: string }>();

  const ask = useMemo(
    () => (sentence ? askForSentence(sentence) : undefined) ?? ASKS[1],
    [sentence],
  );
  /**
   * 촬영 흐름은 아직 목업이다 — OCR이 없어서 서버에 보낼 사진도, 끊어낸 문장도
   * 없다. 답을 그리는 조각(AskResult)만 서버 모양을 쓰므로 여기서 맞춰 넘긴다.
   */
  const candidates = useMemo(
    () =>
      ask.candidates.map((candidate) => ({
        term: candidate.term,
        meaning: candidate.meaning,
        register: candidate.register,
      })),
    [ask],
  );
  const [picked, setPicked] = useState<Set<string>>(
    () => new Set(ask.candidates.map((c) => c.term)),
  );

  const book = bookById(ask.bookId ?? SCANNED_PAGE.bookId);
  const nothingToSave = ask.candidates.length === 0;

  const togglePick = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <View style={styles.screen}>
      <ScreenHeader
        leading="back"
        onLeadingPress={() => router.back()}
        trailing={<HeaderAction label="저장" onPress={() => router.replace('/drawer')} />}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={styles.scroll}>
        {book ? (
          <CaptureSummary book={book} page={ask.page ?? SCANNED_PAGE.page} count={ask.candidates.length} />
        ) : null}

        <View style={styles.asked}>
          <AppText style={styles.askedLabel}>물어본 문장</AppText>
          <Quote style={styles.askedText}>{ask.text}</Quote>
        </View>

        {nothingToSave ? (
          <>
            <AltPanel style={styles.translation}>
              <AppText style={styles.translationLabel}>이런 뜻이에요</AppText>
              <AppText style={styles.translationText}>{ask.translation}</AppText>
            </AltPanel>
            <AltPanel style={styles.empty}>
              <AppText style={styles.emptyText}>
                이 문장엔 따로 담아둘 만한 표현이 없어요. 뜻만 확인하고 계속 읽으셔도 돼요.
              </AppText>
            </AltPanel>
          </>
        ) : (
          <AskResult
            translation={ask.translation}
            candidates={candidates}
            picked={picked}
            onTogglePick={togglePick}
          />
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        {nothingToSave ? (
          <ActionButton label="다른 문장 고르기" variant="ink" onPress={() => router.back()} />
        ) : (
          <ActionButton
            label="내 문장 서랍에 담기"
            aside={`${picked.size}개`}
            variant="ink"
            onPress={() => router.replace('/drawer')}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surface.base },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 24, gap: 16 },
  asked: { gap: 6 },
  askedLabel: { ...type.caption2, fontWeight: '700', color: color.text.meta },
  askedText: { fontSize: 16, lineHeight: 26, color: color.text.primary },
  translation: { padding: 16, gap: 6 },
  translationLabel: { ...type.caption2, fontWeight: '700', color: color.text.meta },
  translationText: { ...type.body2Reading, color: color.text.primary },
  empty: { padding: 16, backgroundColor: color.fill.subtle },
  emptyText: { ...type.label2, lineHeight: 21, color: color.text.secondary },
  footer: { paddingHorizontal: 20, paddingTop: 12 },
});
