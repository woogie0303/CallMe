import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QUIZ, QUIZ_INDEX, QUIZ_TOTAL } from '@/entities/quiz/model/mock';
import { color } from '@/shared/config';
import { ActionButton } from '@/shared/ui';
import { QuizProgress } from '@/widgets/quiz-runner/ui/quiz-progress';
import { QuizRunner } from '@/widgets/quiz-runner/ui/quiz-runner';

/** 06 퀴즈 — 예전에 헷갈렸던 표현을, 그때 그 문장에서 다시 만난다. */
export default function QuizScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const question = QUIZ[step % QUIZ.length];

  return (
    <View style={styles.screen}>
      <QuizProgress
        index={QUIZ_INDEX + step}
        total={QUIZ_TOTAL}
        onClose={() => router.replace('/')}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={styles.scroll}>
        {/* key를 바꿔 다음 문장에서 고른 답을 지운다 */}
        <QuizRunner key={question.id} question={question} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <ActionButton label="다음 문장" variant="ink" onPress={() => setStep((s) => s + 1)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surface.base },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
  footer: { paddingHorizontal: 24, paddingTop: 12 },
});
