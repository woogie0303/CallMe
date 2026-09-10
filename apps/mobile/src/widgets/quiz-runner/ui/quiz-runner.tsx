import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { ApiQuizQuestion, ApiQuizResult } from '@/entities/quiz/api/quiz.api';
import { color, type } from '@/shared/config';
import { savedLabel } from '@/shared/lib/date';
import { AppText, Icon, Quote, Tap } from '@/shared/ui';

/**
 * 표현 하나를 통째로 도려낸 빈칸. 맞히면 문장에 있던 꼴 그대로 채워져
 * 원래 문장이 돌아온다.
 *
 * 화면에 상자를 겹치지 않는다. 문장 하나와 보기 몇 줄, 그게 전부다 —
 * 고르는 동안 읽을 것이 둘(문장과 보기)뿐이어야 한다. 답을 고른 뒤에야
 * 뜻과 헷갈리던 짝이 글줄로 따라 나온다.
 *
 * 정답은 화면이 모른다. 서버가 판정해서 돌려주기 전까지는 어느 보기가
 * 답인지 앱에 오지 않는다 — 답이 손에 있으면 그건 시험이 아니다.
 */
export function QuizRunner({
  question,
  onAnswer,
}: {
  question: ApiQuizQuestion;
  onAnswer: (choiceItemId: string) => Promise<ApiQuizResult>;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [result, setResult] = useState<ApiQuizResult | null>(null);

  const choose = async (choiceItemId: string) => {
    if (picked) return;
    setPicked(choiceItemId);
    try {
      setResult(await onAnswer(choiceItemId));
    } catch {
      /** 판정을 못 받으면 다시 고를 수 있게 되돌린다 */
      setPicked(null);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.asked}>
        <Icon name="clock" size={13} color={color.text.assistive} />
        <AppText style={styles.askedLabel}>
          {savedLabel(question.savedAt)}에 담아둔 문장이에요
        </AppText>
      </View>

      <View style={styles.stem}>
        <Quote style={styles.quote}>
          {question.before}
          {result ? (
            <Quote style={styles.filled}>{result.surface}</Quote>
          ) : (
            <View style={styles.blank} />
          )}
          {question.after}
        </Quote>
        {question.bookTitle ? (
          <AppText style={styles.source}>
            {question.bookTitle}
            {question.page ? ` · p.${question.page}` : ''}
          </AppText>
        ) : null}
      </View>

      <View style={styles.choices}>
        {question.choices.map((choice) => {
          const correct = result?.answer.itemId === choice.itemId;
          const wrong = Boolean(result) && picked === choice.itemId && !correct;

          return (
            <Tap
              key={choice.itemId}
              disabled={Boolean(picked)}
              onPress={() => choose(choice.itemId)}
              style={[
                styles.choice,
                correct ? styles.choiceCorrect : null,
                wrong ? styles.choiceWrong : null,
              ]}>
              <Quote style={[styles.choiceText, correct ? styles.choiceTextCorrect : null]}>
                {choice.term}
              </Quote>
              {/* 맞고 틀림은 글자 뒤에 표시 하나로 말한다 */}
              {correct ? <Icon name="check" size={15} color={color.status.positiveText} /> : null}
              {wrong ? <Icon name="close" size={14} color={color.status.negative} /> : null}
            </Tap>
          );
        })}
      </View>

      {result ? (
        <View style={styles.after}>
          <AppText style={styles.meaning}>
            <Quote style={styles.meaningTerm}>{result.answer.term}</Quote>
            {'  '}
            {result.answer.meaning}
          </AppText>

          {result.confusedWith ? (
            <AppText style={styles.contrast}>
              <Quote style={styles.contrastTerm}>{result.confusedWith.term}</Quote>
              {'  '}
              {result.confusedWith.note}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 18 },

  asked: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  askedLabel: { ...type.caption1, color: color.text.meta },

  /** 문장은 상자에 담지 않는다 — 종이 위에 놓인 한 줄로 둔다 */
  stem: { gap: 10, paddingVertical: 6 },
  quote: { fontSize: 21, lineHeight: 33, color: color.text.primary },
  blank: {
    width: 132,
    height: 22,
    transform: [{ translateY: 4 }],
    borderBottomWidth: 2,
    borderBottomColor: color.primary,
  },
  filled: { color: color.primary, fontWeight: '600' },
  source: { ...type.caption1, color: color.text.meta },

  choices: { gap: 10 },
  choice: {
    minHeight: 58,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: color.surface.base,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border.strong,
  },
  choiceCorrect: { borderWidth: 1.5, borderColor: color.status.positive },
  choiceWrong: { backgroundColor: color.surface.alt, borderColor: 'transparent' },
  choiceText: { fontSize: 17, lineHeight: 23, textAlign: 'center', color: color.text.primary },
  choiceTextCorrect: { fontWeight: '600' },

  after: { gap: 8, paddingTop: 2 },
  meaning: { ...type.label1, lineHeight: 22, color: color.text.secondary },
  meaningTerm: { fontSize: 15, fontWeight: '600', color: color.text.primary },
  contrast: { ...type.label2, lineHeight: 21, color: color.text.meta },
  contrastTerm: { fontSize: 14, fontWeight: '600', color: color.text.secondary },
});
