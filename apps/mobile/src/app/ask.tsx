import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAskQuota, useCreateAsk } from '@/entities/ask/api/ask.api';
import { useBook, useCurrentBook } from '@/entities/book/api/book.api';
import { useSaveItem } from '@/entities/lexical-item/api/item.api';
import { useCreateSentence } from '@/entities/sentence/api/sentence.api';
import type { ApiAskView } from '@/shared/api/types';
import { color, gutter, type } from '@/shared/config';
import { ActionButton, AltPanel, AppText, Icon, Quote, ScreenHeader } from '@/shared/ui';
import { AskResult } from '@/widgets/ask/ui/ask-result';
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

  const params = useLocalSearchParams<Params>();
  /** 찍어온 쪽에서 고른 문장이 있으면 그걸로 시작한다 */
  const [sentence, setSentence] = useState(params.text ?? '');
  const [answer, setAnswer] = useState<ApiAskView | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const { data: quota } = useAskQuota();
  const { data: current } = useCurrentBook();
  const { data: chosen } = useBook(params.bookId);
  const book = chosen ?? current?.book;
  const page = params.page ? Number(params.page) : undefined;

  const createAsk = useCreateAsk();
  const saveItem = useSaveItem();
  const keepSentence = useCreateSentence();

  const left = quota?.remaining ?? 0;
  const phase = !answer ? 'writing' : answer.ask.status === 'answered' ? 'answered' : 'pending';

  const togglePick = (term: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(term)) next.delete(term);
      else next.add(term);
      return next;
    });

  /**
   * 물어본다. 질문이 떨어졌거나 답을 못 받아도 실패가 아니다 — 서버가 문장을
   * 먼저 저장하고 pending으로 돌려주므로, 화면은 오류가 아니라 상태를 보여준다.
   */
  const ask = async () => {
    if (!book || !sentence.trim()) return;
    const view = await createAsk.mutateAsync({
      bookId: book.id,
      text: sentence.trim(),
      page,
    });
    setAnswer(view);
    /** 답이 왔으면 후보를 전부 골라둔 채로 시작한다 — 빼는 편이 고르는 것보다 빠르다 */
    setPicked(new Set(view.ask.candidates.map((candidate) => candidate.term)));
  };

  /** 고른 후보를 서랍에 담는다. 이미 있던 표현이면 그 자리에서 재회가 된다. */
  const keep = async () => {
    if (!answer?.sentence) return;
    const chosenOnes = answer.ask.candidates.filter((c) => picked.has(c.term));
    for (const candidate of chosenOnes) {
      await saveItem.mutateAsync({
        term: candidate.term,
        meaning: candidate.meaning,
        register: candidate.register,
        surface: candidate.surface,
        sentenceId: answer.sentence._id,
      });
    }
    router.replace('/drawer');
  };

  const reset = () => {
    setAnswer(null);
    setPicked(new Set());
    setSentence('');
  };

  /**
   * 뜻을 묻지 않고 문장만 남긴다. 어휘 항목이 없으니 서랍이 아니라 책으로 간다.
   * 질문 횟수도 쓰지 않는다 — 모델을 부르지 않으니까.
   */
  const keepOnly = async () => {
    if (!book || !sentence.trim()) return;
    try {
      await keepSentence.mutateAsync({ bookId: book.id, text: sentence.trim(), page });
      router.replace({ pathname: '/book/[id]', params: { id: book.id } });
    } catch (error) {
      Alert.alert('담지 못했어요', error instanceof Error ? error.message : '');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
        keyboardShouldPersistTaps="handled">
        {/*
          답이 오면 입력칸은 물러난다. 같은 문장을 입력칸과 답에 두 번 세우면
          어느 쪽이 지금 보고 있는 것인지 흐려진다 — 답에 선 문장은 밑줄이
          그어져 있어서, 이미 그 문장이자 고를 거리다.
        */}
        {phase === 'writing' ? (
          <SentenceField
            value={sentence}
            onChangeText={setSentence}
            onCapture={() => router.replace('/scan')}
          />
        ) : null}

        {phase === 'answered' && answer ? (
          <AskResult
            sentence={answer.sentence?.text ?? sentence}
            translation={answer.ask.translation}
            candidates={answer.ask.candidates}
            picked={picked}
            onTogglePick={togglePick}
          />
        ) : null}

        {phase === 'pending' ? (
          <>
            <Quote style={styles.kept}>{answer?.sentence?.text ?? sentence}</Quote>
            <AltPanel style={styles.pending}>
              <View style={styles.pendingHead}>
                <Icon name="clock" size={15} color={color.text.meta} />
                <AppText style={styles.pendingTitle}>문장은 담아뒀어요</AppText>
              </View>
              <AppText style={styles.pendingBody}>
                {answer?.ask.pendingReason === '질문 소진'
                  ? '이번 달 질문을 다 쓰셨어요. 담아둔 문장은 다음 달에 자동으로 풀려요 — 읽던 데까지 계속 읽으셔도 돼요.'
                  : '지금은 답을 받지 못했어요. 문장은 담아뒀으니 나중에 다시 풀어드릴게요.'}
              </AppText>
            </AltPanel>
          </>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        {phase === 'writing' ? (
          <>
            <ActionButton
              label={left > 0 ? '이 문장 물어보기' : '문장만 담아두기'}
              variant={left > 0 ? 'primary' : 'ink'}
              disabled={!book || !sentence.trim()}
              loading={createAsk.isPending}
              onPress={ask}
            />
            {/* 뜻은 몰라도 되고 그냥 좋았던 문장 — 이건 서랍이 아니라 책에 남는다 */}
            <ActionButton
              label="그냥 마음에 든 문장이에요"
              variant="subtle"
              disabled={!book || !sentence.trim()}
              loading={keepSentence.isPending}
              onPress={keepOnly}
            />
          </>
        ) : null}

        {phase === 'answered' ? (
          <>
            <ActionButton
              label="서랍에 담기"
              aside={`${picked.size}개`}
              disabled={picked.size === 0}
              loading={saveItem.isPending}
              onPress={keep}
            />
            <ActionButton label="다른 문장 물어보기" variant="subtle" onPress={reset} />
          </>
        ) : null}

        {phase === 'pending' ? (
          <ActionButton label="다른 문장 담아두기" variant="ink" onPress={reset} />
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surface.base },
  quota: { ...type.caption1, fontWeight: '600', color: color.text.meta },
  quotaOut: { color: color.status.cautionary },
  scroll: { flex: 1 },
  content: { paddingHorizontal: gutter, paddingTop: 4, paddingBottom: 24, gap: 18 },

  pending: { padding: 16, gap: 10 },
  pendingHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  pendingTitle: {
    ...type.label2,
    fontWeight: '700',
    color: color.text.primary,
  },
  pendingBody: { ...type.label2, lineHeight: 21, color: color.text.secondary },
  kept: { fontSize: 17, lineHeight: 27, color: color.text.primary },

  footer: { paddingHorizontal: gutter, paddingTop: 12, gap: 10 },
});
