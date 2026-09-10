import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCreateBook } from '@/entities/book/api/book.api';
import { color } from '@/shared/config';
import { ActionButton, ScreenHeader } from '@/shared/ui';
import { BookAdd, type BookDraft } from '@/widgets/book-add/ui/book-add';

const EMPTY: BookDraft = { title: '', author: '', pages: '', currentPage: '' };

/** 02 책 등록 — 읽고 있는 책을 서가에 들인다. */
export default function BookAddScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [draft, setDraft] = useState<BookDraft>(EMPTY);
  const create = useCreateBook();

  /** 제목과 지은이만 있으면 시작할 수 있다 */
  const ready = draft.title.trim().length > 0 && draft.author.trim().length > 0;

  const save = async () => {
    if (!ready) return;
    try {
      const book = await create.mutateAsync({
        title: draft.title.trim(),
        author: draft.author.trim(),
        pages: Number(draft.pages) || undefined,
        currentPage: Number(draft.currentPage) || undefined,
      });
      /** 등록하고 나면 그 책으로 들어간다 — 담기 시작하는 자리가 거기다 */
      router.replace({ pathname: '/book/[id]', params: { id: book._id } });
    } catch (error) {
      Alert.alert('책을 들이지 못했어요', error instanceof Error ? error.message : '');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader leading="back" onLeadingPress={() => router.back()} title="책 추가" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={styles.scroll}
        keyboardShouldPersistTaps="handled">
        <BookAdd draft={draft} onChange={setDraft} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <ActionButton
          label={create.isPending ? '들이는 중…' : '이 책 읽고 있어요'}
          variant={ready ? 'primary' : 'subtle'}
          onPress={save}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surface.base },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
  footer: { paddingHorizontal: 24, paddingTop: 12 },
});
