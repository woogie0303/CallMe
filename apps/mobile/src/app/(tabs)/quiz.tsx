import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { useAnswerQuiz, useQuizSession } from '@/entities/quiz/api/quiz.api';
import { color, type } from '@/shared/config';
import { ActionButton, AppText } from '@/shared/ui';
import { QuizProgress } from '@/widgets/quiz-runner/ui/quiz-progress';
import { QuizRunner } from '@/widgets/quiz-runner/ui/quiz-runner';

/**
 * 06 퀴즈 — 예전에 헷갈렸던 표현을, 그때 그 문장에서 다시 만난다.
 *
 * 고르기 전에는 문장과 보기뿐이다. 뜻도, 넘기는 버튼도 답을 고른 뒤에 나온다 —
 * 답을 떠올리는 동안 화면에 다른 읽을거리가 있으면 그쪽을 먼저 읽는다.
 */
export default function QuizScreen() {
  const router = useRouter();
  const { data: questions, isPending, error } = useQuizSession();
  const answer = useAnswerQuiz();
  const [step, setStep] = useState(0);
  const [answered, setAnswered] = useState(false);

  const question = questions?.[step];
  const done = Boolean(questions && step >= questions.length);

  const next = () => {
    setStep((s) => s + 1);
    setAnswered(false);
  };

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View style={styles.screen}>
      <QuizProgress
        index={Math.min(step + 1, questions?.length ?? 1)}
        total={questions?.length ?? 1}
        onBack={leave}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={styles.scroll}>
        {isPending ? (
          <ActivityIndicator style={styles.spinner} color={color.text.assistive} />
        ) : error ? (
          <AppText style={styles.empty}>{error.message}</AppText>
        ) : question ? (
          /* key를 바꿔 다음 문장에서 고른 답을 지운다 */
          <QuizRunner
            key={`${question.itemId}:${question.sentenceId}`}
            question={question}
            onAnswer={async (choiceItemId) => {
              const result = await answer.mutateAsync({
                itemId: question.itemId,
                sentenceId: question.sentenceId,
                choiceItemId,
              });
              setAnswered(true);
              return result;
            }}
          />
        ) : (
          <AppText style={styles.empty}>
            {done
              ? '오늘 낼 문제를 다 풀었어요.'
              : '아직 낼 문제가 없어요.\n표현을 조금 더 담아두면 여기서 다시 만나요.'}
          </AppText>
        )}
      </ScrollView>

      {/* 고르기 전에는 아래를 비워둔다 — 넘길 것이 아직 없다 */}
      {answered ? (
        <View style={styles.footer}>
          <ActionButton
            label={step + 1 < (questions?.length ?? 0) ? '다음 문장' : '끝내기'}
            variant="ink"
            onPress={step + 1 < (questions?.length ?? 0) ? next : leave}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surface.base },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
  spinner: { paddingTop: 40 },
  empty: {
    ...type.label2,
    color: color.text.assistive,
    textAlign: 'center',
    lineHeight: 21,
    paddingTop: 60,
  },
  /** 아래 안전 영역은 탭 바가 맡는다 — 여기서 또 주면 버튼이 붕 뜬다 */
  footer: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 12 },
});
