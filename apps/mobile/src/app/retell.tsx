import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBook } from '@/entities/book/api/book.api';
import { useCreateRetell, useResolveRetell } from '@/entities/retell/api/retell.api';
import { color, family, gutter, type } from '@/shared/config';
import type { ApiRetell } from '@/shared/api/types';
import { ActionButton, AltPanel, AppText, Icon, ScreenHeader } from '@/shared/ui';
import { RetellFeedback } from '@/widgets/retell-review/ui/retell-feedback';

type Params = { bookId?: string };

/**
 * 05 리텔링 — 방금 읽은 챕터를 제 말로 옮겨 적고, 고쳐진 문장을 돌려받는다.
 * 음성은 MVP에 없다: 녹음·STT는 읽기를 돕는 일과 관계가 없다. (Q20)
 *
 * 옮겨 적은 글은 답을 못 받아도 남는다. 질문과 같은 규칙이다 — 쓴 것을 잃는
 * 앱에 두 번째 글을 쓰는 사람은 없다.
 */
export default function RetellScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { bookId } = useLocalSearchParams<Params>();
  const { data: book } = useBook(bookId);

  const [chapter, setChapter] = useState('방금 읽은 부분');
  const [draft, setDraft] = useState('');
  const [result, setResult] = useState<ApiRetell | null>(null);

  const create = useCreateRetell();
  const resolve = useResolveRetell();
  const busy = create.isPending || resolve.isPending;

  const review = async () => {
    if (!bookId || !draft.trim() || busy) return;
    const retell = await create.mutateAsync({ bookId, chapter: chapter.trim(), draft });
    setResult(retell);
  };

  const retry = async () => {
    if (!result) return;
    setResult(await resolve.mutateAsync(result._id));
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
          <AppText style={styles.promptHint}>
            틀려도 괜찮아요. 고칠 곳을 찾는 게 이 화면이 하는 일이에요.
          </AppText>
        </View>

        <TextInput
          value={chapter}
          onChangeText={setChapter}
          editable={!result}
          placeholder="어디를 읽으셨어요? (예: Chapter 12)"
          placeholderTextColor={color.text.assistive}
          style={styles.chapterInput}
        />

        <View style={styles.field}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            editable={!result}
            multiline
            placeholder="Klara watched the sun going down…"
            placeholderTextColor={color.text.assistive}
            style={styles.input}
          />
        </View>

        {result?.status === 'answered' ? (
          <RetellFeedback revisions={result.revisions} missedTerms={result.missedTerms} />
        ) : null}

        {result?.status === 'pending' ? (
          <AltPanel style={styles.pending}>
            <View style={styles.pendingHead}>
              <Icon name="clock" size={15} color={color.text.meta} />
              <AppText style={styles.pendingTitle}>글은 담아뒀어요</AppText>
            </View>
            <AppText style={styles.pendingBody}>
              {result.pendingReason === '횟수 소진'
                ? '이번 달 리텔링을 다 쓰셨어요. 담아둔 글은 다음 달에 자동으로 풀려요.'
                : '지금은 고칠 곳을 받지 못했어요. 나중에 다시 시도할 수 있어요.'}
            </AppText>
          </AltPanel>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        {!result ? (
          <ActionButton
            label="고칠 곳 찾아보기"
            disabled={!draft.trim()}
            loading={busy}
            onPress={review}
          />
        ) : result.status === 'pending' ? (
          <ActionButton
            label={result.pendingReason === '연결 실패' ? '다시 시도하기' : '기록 남기고 닫기'}
            variant="ink"
            loading={busy}
            onPress={result.pendingReason === '연결 실패' ? retry : close}
          />
        ) : (
          <ActionButton label="기록 남기고 닫기" variant="ink" onPress={close} />
        )}
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
  pending: { padding: 16, gap: 10 },
  pendingHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  pendingTitle: { ...type.label2, fontWeight: '700', color: color.text.primary },
  pendingBody: { ...type.label2, lineHeight: 21, color: color.text.secondary },
  footer: { paddingHorizontal: gutter, paddingTop: 12 },
});
