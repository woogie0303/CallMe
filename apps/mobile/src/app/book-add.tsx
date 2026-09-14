import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCreateBook } from '@/entities/book/api/book.api';
import { color } from '@/shared/config';
import { ActionButton, ScreenHeader } from '@/shared/ui';
import { BookAdd, type BookDraft } from '@/widgets/book-add/ui/book-add';

type Params = { title?: string; author?: string; pages?: string; cover?: string };

/**
 * 02 책 등록 — 읽고 있는 책을 서가에 들인다.
 *
 * 검색에서 골라 넘어왔으면 값이 이미 채워져 있다. 그래도 손을 대지 못하게
 * 막지 않는다 — 검색 결과의 저자 표기나 쪽수가 책과 다를 때가 있고, 그건
 * 여기서 눈으로 보고 고칠 수 있어야 한다.
 */
export default function BookAddScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const [draft, setDraft] = useState<BookDraft>({
    title: params.title ?? '',
    author: params.author ?? '',
    pages: params.pages ?? '',
    currentPage: '',
    cover: params.cover,
  });
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
        cover: draft.cover,
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
