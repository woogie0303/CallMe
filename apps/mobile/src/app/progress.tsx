import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBook } from '@/entities/book/api/book.api';
import { useUpdateProgress } from '@/entities/reading/api/reading.api';
import { color, type } from '@/shared/config';
import { ActionButton, AppText, ProgressBar, Quote, ScreenHeader } from '@/shared/ui';

/**
 * 읽은 데까지 표시 옮기기.
 *
 * 이 화면이 이번 주 막대를 채운다. 읽은 양을 따로 적게 하지 않고 진도만
 * 옮기게 하는 이유는, 읽고 나서 한 번 더 적게 만들면 아무도 적지 않기 때문이다.
 */
export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { bookId } = useLocalSearchParams<{ bookId?: string }>();
  const { data: book } = useBook(bookId);
  const update = useUpdateProgress(bookId ?? '');
  const [page, setPage] = useState('');

  const typed = Number(page);
  const total = book?.pages ?? 0;
  const valid = Number.isFinite(typed) && typed > 0 && (total === 0 || typed <= total);

  const save = async () => {
    if (!valid || !bookId) return;
    await update.mutateAsync(typed);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader leading="close" onLeadingPress={() => router.back()} title="읽은 데까지" />

      <View style={styles.body}>
        {book ? (
          <View style={styles.head}>
            <Quote numberOfLines={1} style={styles.title}>
              {book.title}
            </Quote>
            <ProgressBar value={total ? Math.min(1, (typed || 0) / total) : 0} />
          </View>
        ) : null}

        <View style={styles.field}>
          <TextInput
            value={page}
            onChangeText={setPage}
            keyboardType="number-pad"
            autoFocus
            placeholder="0"
            placeholderTextColor={color.text.assistive}
            style={styles.input}
          />
          <AppText style={styles.unit}>{total ? `/ ${total} 쪽` : '쪽'}</AppText>
        </View>

        <AppText style={styles.hint}>
          지난번보다 앞으로 간 만큼이 오늘 읽은 양이 돼요.
        </AppText>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <ActionButton
          label={update.isPending ? '저장하는 중…' : '여기까지 읽었어요'}
          variant={valid ? 'primary' : 'subtle'}
          onPress={save}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surface.base },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 12, gap: 24 },
  head: { gap: 10 },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '600', color: color.text.primary },
  field: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  input: {
    ...type.title2,
    fontSize: 44,
    lineHeight: 52,
    color: color.text.primary,
    minWidth: 100,
  },
  unit: { ...type.body1, color: color.text.meta },
  hint: { ...type.label2, color: color.text.assistive, lineHeight: 21 },
  footer: { paddingHorizontal: 24, paddingTop: 12 },
});
