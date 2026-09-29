import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBook } from '@/entities/book/api/book.api';
import { useCreateRetell } from '@/entities/retell/api/retell.api';
import { color, family, gutter, type } from '@/shared/config';
import { ActionButton, AppText, ScreenHeader } from '@/shared/ui';

type Params = { bookId?: string };

/**
 * 05 리텔링 — 방금 읽은 챕터를 제 말로 옮겨 적어 남긴다.
 *
 * 고쳐주지 않는다. 채점하거나 다듬어 주는 것 없이, 쓴 그대로 책 화면에 쌓인다 —
 * 나중에 다시 열어 그때 내가 이 챕터를 어떻게 옮겼는지 보는 것이 이 기능이 하는
 * 일 전부다.
 *
 * 음성은 MVP에 없다: 녹음·STT는 읽기를 돕는 일과 관계가 없다.
 */
export default function RetellScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { bookId } = useLocalSearchParams<Params>();
  const { data: book } = useBook(bookId);

  const [chapter, setChapter] = useState('방금 읽은 부분');
  const [draft, setDraft] = useState('');

  const create = useCreateRetell();

  const save = async () => {
    if (!bookId || !draft.trim() || create.isPending) return;
    await create.mutateAsync({ bookId, chapter: chapter.trim(), draft });
    close();
  };

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader leading="close" onLeadingPress={close} title={book?.title ?? '리텔링'} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={styles.scroll}
        keyboardShouldPersistTaps="handled">
        <View style={styles.prompt}>
          <AppText style={styles.promptTitle}>방금 읽은 챕터를 옮겨 적어보세요</AppText>
          <AppText style={styles.promptHint}>틀려도 괜찮아요. 쓴 그대로 남아요.</AppText>
        </View>

        <TextInput
          value={chapter}
          onChangeText={setChapter}
          placeholder="어디를 읽으셨어요? (예: Chapter 12)"
          placeholderTextColor={color.text.assistive}
          style={styles.chapterInput}
        />

        <View style={styles.field}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            multiline
            placeholder="Klara watched the sun going down…"
            placeholderTextColor={color.text.assistive}
            style={styles.input}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <ActionButton
          label="저장하기"
          disabled={!draft.trim()}
          loading={create.isPending}
          onPress={save}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surface.base },
  scroll: { flex: 1 },
  content: { paddingHorizontal: gutter, paddingTop: 4, paddingBottom: 24, gap: 18 },
  prompt: { gap: 4 },
  promptTitle: { ...type.heading2, fontWeight: '700', color: color.text.primary },
  promptHint: { ...type.label2, color: color.text.meta },
  chapterInput: {
    ...type.caption1,
    fontWeight: '600',
    color: color.text.meta,
    paddingVertical: 4,
  },
  field: {
    minHeight: 180,
    borderRadius: 20,
    backgroundColor: color.surface.base,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border.default,
    padding: 18,
  },
  /** 내가 쓰는 영어도 책의 영어와 같은 결이라 세리프다 */
  input: {
    flex: 1,
    fontFamily: family.serif,
    fontSize: 16,
    lineHeight: 26,
    color: color.text.primary,
    textAlignVertical: 'top',
  },
  footer: { paddingHorizontal: gutter, paddingTop: 12 },
});
