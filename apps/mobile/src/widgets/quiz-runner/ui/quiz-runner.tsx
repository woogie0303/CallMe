import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { bookById } from '@/entities/book/model/mock';
import { itemById } from '@/entities/lexical-item/model/mock';
import { choiceIdsOf, type QuizQuestion } from '@/entities/quiz/model/mock';
import { color, type } from '@/shared/config';
import { AltPanel, AppText, Icon, InkPanel, Quote, Tap } from '@/shared/ui';

/**
 * 표현 하나를 통째로 도려낸 빈칸. 맞히면 문장에 있던 꼴 그대로 채워져
 * 원래 문장이 돌아오고, 아래에 예전에 헷갈렸던 짝과의 차이가 따라 나온다.
 */
export function QuizRunner({
  question,
  onAnswered,
}: {
  question: QuizQuestion;
  onAnswered?: (correct: boolean) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const book = bookById(question.bookId);
  const answer = itemById(question.itemId);
  const choiceIds = useMemo(() => choiceIdsOf(question), [question]);
  const settled = picked !== null;

  if (!answer) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.stem}>
        <View style={styles.asked}>
          <Icon name="clock" size={13} color={color.text.assistive} />
          <AppText style={styles.askedLabel}>{question.askedLabel}</AppText>
        </View>

        <InkPanel style={styles.quotePanel}>
          <Quote style={styles.quote}>
            {question.before}
            {settled ? (
              <Quote style={styles.filled}>{question.surface}</Quote>
            ) : (
              <View style={styles.blank} />
            )}
            {question.after}
          </Quote>
          {book ? (
            <AppText style={styles.source}>
              {book.title} · p.{question.page}
            </AppText>
          ) : null}
        </InkPanel>
      </View>

      <View style={styles.choices}>
        <AppText style={styles.choicesLabel}>담아뒀던 표현 중에서 골라보세요</AppText>
        {choiceIds.map((id) => {
          const choice = itemById(id);
          if (!choice) return null;
          const isAnswer = id === question.itemId;
          const chosen = picked === id;
          const correct = settled && isAnswer;
          const wrong = settled && chosen && !isAnswer;

          return (
            <Tap
              key={id}
              disabled={settled}
              onPress={() => {
                setPicked(id);
                onAnswered?.(isAnswer);
              }}
              style={[
                styles.choice,
                correct ? styles.choiceCorrect : null,
                wrong ? styles.choiceWrong : null,
              ]}>
              <View style={[styles.mark, correct ? styles.markCorrect : null]}>
                {correct ? <Icon name="check" size={13} color={color.text.onInk} /> : null}
              </View>
              <Quote style={[styles.choiceText, correct ? styles.choiceTextCorrect : null]}>
                {choice.term}
              </Quote>
            </Tap>
          );
        })}
      </View>

      {settled ? (
        <View style={styles.after}>
          <AltPanel style={styles.meaningPanel}>
            <Quote style={styles.meaningTerm}>{answer.term}</Quote>
            <AppText style={styles.meaningText}>{answer.meaning}</AppText>
          </AltPanel>

          {answer.confusedWith ? (
            <AltPanel style={styles.contrast}>
              <AppText style={styles.contrastTitle}>
                {itemById(answer.confusedWith.itemId)?.term} 와는 이렇게 달라요
              </AppText>
              <AppText style={styles.contrastNote}>{answer.confusedWith.note}</AppText>
            </AltPanel>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 22 },
  stem: { gap: 10 },
  asked: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  askedLabel: { ...type.caption1, color: color.text.meta },
  quotePanel: { paddingHorizontal: 24, paddingVertical: 26, gap: 16 },
  quote: { fontSize: 21, lineHeight: 33, color: color.text.onInk },
  /** 아직 비어 있는 자리 — 표현 하나가 통째로 빠져 있어서 낱말보다 넓다 */
  blank: {
    width: 132,
    height: 22,
    transform: [{ translateY: 4 }],
    borderBottomWidth: 2,
    borderBottomColor: color.primary,
  },
  filled: { color: color.primary, fontWeight: '600' },
  source: { ...type.caption1, color: color.text.onInkFaint },

  choices: { gap: 10 },
  choicesLabel: { ...type.label2, fontWeight: '600', color: color.text.secondary },
  choice: {
    minHeight: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: color.surface.base,
    borderWidth: 1,
    borderColor: color.border.strong,
  },
  choiceCorrect: {
    backgroundColor: color.primaryBgSoft,
    borderWidth: 1.5,
    borderColor: color.primary,
  },
  choiceWrong: { borderColor: color.status.negative, backgroundColor: 'rgba(255,66,66,0.04)' },
  mark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: color.border.strong,
  },
  markCorrect: { backgroundColor: color.primary, borderColor: color.primary },
  choiceText: { flex: 1, fontSize: 16, lineHeight: 22, color: color.text.primary },
  choiceTextCorrect: { fontWeight: '600', color: color.primary },

  after: { gap: 10 },
  meaningPanel: { padding: 16, gap: 4 },
  meaningTerm: { fontSize: 15, lineHeight: 20, fontWeight: '600', color: color.text.primary },
  meaningText: { ...type.label2, color: color.text.secondary },
  contrast: { padding: 16, gap: 8 },
  contrastTitle: { ...type.label2, fontWeight: '700', color: color.text.primary },
  contrastNote: { ...type.label2, lineHeight: 21, color: color.text.secondary },
});
