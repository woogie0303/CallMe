import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { QUIZ, QUIZ_INDEX, QUIZ_TOTAL } from '@/entities/quiz/model/mock';
import { color } from '@/shared/config';
import { ActionButton } from '@/shared/ui';
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
  const [step, setStep] = useState(0);
  const [answered, setAnswered] = useState(false);
  const question = QUIZ[step % QUIZ.length];

  const next = () => {
    setStep((s) => s + 1);
    setAnswered(false);
  };

  return (
    <View style={styles.screen}>
      <QuizProgress index={QUIZ_INDEX + step} total={QUIZ_TOTAL} onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={styles.scroll}>
        {/* key를 바꿔 다음 문장에서 고른 답을 지운다 */}
        <QuizRunner key={question.id} question={question} onAnswered={() => setAnswered(true)} />
      </ScrollView>

      {/* 고르기 전에는 아래를 비워둔다 — 넘길 것이 아직 없다 */}
      {answered ? (
        <View style={styles.footer}>
          <ActionButton label="다음 문장" variant="ink" onPress={next} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surface.base },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
  /** 아래 안전 영역은 탭 바가 맡는다 — 여기서 또 주면 버튼이 붕 뜬다 */
  footer: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 12 },
});
