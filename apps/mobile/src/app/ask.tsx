import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAskQuota, useCreateAsk } from '@/entities/ask/api/ask.api';
import { useBook, useCurrentBook } from '@/entities/book/api/book.api';
import { useUpdateProgress } from '@/entities/reading/api/reading.api';
import { useCreateSentence } from '@/entities/sentence/api/sentence.api';
import { color, gutter, type } from '@/shared/config';
import { ActionButton, AppText, ScreenHeader } from '@/shared/ui';
import { useOpenScan } from '@/widgets/capture/lib/use-open-scan';
import { SentenceField } from '@/widgets/ask/ui/sentence-field';

/**
 * 어느 책에 대고 묻는지는 들어온 길이 정한다. 홈의 ✎에서 오면 지금 읽는 책이고,
 * 책 화면에서 오면 그 책이다.
 */
type Params = { bookId?: string; page?: string; text?: string };

/**
 * 03 질문 — 막힌 문장을 통째로 묻는다.
 *
 * 질문이 떨어졌거나 신호가 없으면 답만 미뤄질 뿐, 담는 일은 실패하지 않는다.
 * 읽던 흐름이 끊기는 것이 이 앱이 막으려는 바로 그 일이기 때문이다.
 */
export default function AskScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const openScan = useOpenScan();

  const params = useLocalSearchParams<Params>();
  /** 찍어온 쪽에서 고른 문장이 있으면 그걸로 시작한다 */
  const [sentence, setSentence] = useState(params.text ?? '');

  const { data: quota } = useAskQuota();
  const { data: current } = useCurrentBook();
  const { data: chosen } = useBook(params.bookId);
  const book = chosen ?? current?.book;
  /**
   * 쪽수는 꼭 적는다 — 나중에 이 문장을 다시 찾을 때 붙잡을 곳이 쪽수뿐이다.
   * 미리 채워 두지 않는다. 지난번 쪽이 들어 있으면 확인도 없이 그대로 담긴다.
   * 지난번 쪽은 진도를 뒤로 되돌리지 않는 데만 쓴다(`recordPage`).
   */
  const lastPage =
    (current?.book.id === book?.id
      ? current?.progress.currentPage
      : undefined) ??
    book?.currentPage ??
    0;
  const [pageEdit, setPageText] = useState<string | undefined>(params.page);
  const pageText = pageEdit ?? '';
  const typedPage = Number(pageText);
  /** 책에 없는 쪽은 쪽이 아니다 — 아래 글이 이유를 말하고, 서버도 한 번 더 막는다 */
  const tooFar = Boolean(book?.pages && typedPage > book.pages);
  const page = typedPage > 0 && !tooFar ? typedPage : undefined;
  const ready = Boolean(book && sentence.trim() && page);
  const moveProgress = useUpdateProgress(book?.id ?? '');

  const createAsk = useCreateAsk();
  const keepSentence = useCreateSentence();

  const left = quota?.remaining ?? 0;

  /**
   * 문장을 적은 쪽까지는 읽은 것이다 — 담을 때 진도도 그만큼 옮긴다.
   * 앞으로만 간다: 예전 쪽을 다시 펴서 적었다고 진도가 뒤로 가면 안 된다.
   * 진도를 못 옮겨도 문장 담기는 실패가 아니다.
   */
  const recordPage = () => {
    if (!book || !page || page <= lastPage) return;
    moveProgress.mutate(page);
  };
  /**
   * 물어본다. 질문이 떨어졌거나 답을 못 받아도 실패가 아니다 — 서버가 문장을
   * 먼저 저장하고 pending으로 돌려준다(ADR-0003).
   *
   * 답은 이 모달에서 펴지 않고 그 문장이 사는 곳으로 간다. 답이 왔으면 문장 화면을
   * 뜻을 편 채로, 못 받았으면 기다리는 문장 목록으로. 촬영에서 물었을 때와 같은
   * 길이다 — 어디서 물었든 결과는 한 화면에서 본다.
   */
  const ask = async () => {
    if (!book || !sentence.trim() || !page) return;
    try {
      const view = await createAsk.mutateAsync({
        bookId: book.id,
        text: sentence.trim(),
        page,
      });
      recordPage();
      if (view.ask.status === 'answered' && view.sentence) {
        router.replace({
          pathname: '/sentence/[id]',
          params: { id: view.sentence._id, reveal: '1' },
        });
      } else {
        router.replace('/pending');
      }
    } catch (error) {
      Alert.alert('묻지 못했어요', error instanceof Error ? error.message : '');
    }
  };

  /**
   * 뜻을 묻지 않고 문장만 남긴다. 담고 나면 그 책의 '마음에 들었던 문장'을 편다.
   * 질문 횟수도 쓰지 않는다 — 모델을 부르지 않으니까.
   */
  const keepOnly = async () => {
    if (!book || !sentence.trim() || !page) return;
    try {
      await keepSentence.mutateAsync({
        bookId: book.id,
        text: sentence.trim(),
        page,
      });
      recordPage();
      router.replace({
        pathname: '/book/[id]',
        params: { id: book.id, tab: 'liked' },
      });
    } catch (error) {
      Alert.alert('담지 못했어요', error instanceof Error ? error.message : '');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader
        leading="close"
        onLeadingPress={() => router.back()}
        title="질문"
        trailing={
          <AppText style={[styles.quota, left === 0 ? styles.quotaOut : null]}>
            이번 달 {left}번 남음
          </AppText>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <SentenceField
          value={sentence}
          onChangeText={setSentence}
          onCapture={() => openScan(book?.id, { replace: true })}
          page={pageText}
          onChangePage={setPageText}
        />
        {/* 버튼이 흐려진 이유는 버튼이 아니라 여기가 말한다 */}
        {tooFar ? (
          <AppText style={styles.needPage}>
            이 책은 {book?.pages}쪽까지예요.
          </AppText>
        ) : sentence.trim() && !page ? (
          <AppText style={styles.needPage}>
            몇 쪽인지 적어야 담을 수 있어요.
          </AppText>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <ActionButton
          label={left > 0 ? '이 문장 물어보기' : '문장만 담아두기'}
          variant={left > 0 ? 'primary' : 'ink'}
          disabled={!ready || keepSentence.isPending}
          loading={createAsk.isPending}
          onPress={ask}
        />
        {/* 뜻은 몰라도 되고 그냥 좋았던 문장 — 이건 서랍이 아니라 책에 남는다 */}
        <ActionButton
          label="그냥 마음에 든 문장이에요"
          variant="subtle"
          disabled={!ready || createAsk.isPending}
          loading={keepSentence.isPending}
          onPress={keepOnly}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surface.base },
  quota: { ...type.caption1, fontWeight: '600', color: color.text.meta },
  quotaOut: { color: color.status.cautionary },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: gutter,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 18,
  },

  needPage: { ...type.caption1, color: color.status.cautionary, marginTop: -8 },
  footer: { paddingHorizontal: gutter, paddingTop: 12, gap: 10 },
});
