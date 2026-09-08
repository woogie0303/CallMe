import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { bookById } from '@/entities/book/model/mock';
import { itemById } from '@/entities/lexical-item/model/mock';
import { choiceIdsOf, type QuizQuestion } from '@/entities/quiz/model/mock';
import { color, type } from '@/shared/config';
import { AppText, Icon, Quote, Tap } from '@/shared/ui';

/**
 * 표현 하나를 통째로 도려낸 빈칸. 맞히면 문장에 있던 꼴 그대로 채워져
 * 원래 문장이 돌아온다.
 *
 * 화면에 상자를 겹치지 않는다. 문장 하나와 보기 몇 줄, 그게 전부다 —
 * 고르는 동안 읽을 것이 둘(문장과 보기)뿐이어야 하고, 잉크 판이나 설명
 * 상자가 더 서 있으면 그만큼 눈이 갈 데가 늘어난다. 답을 고른 뒤에야
 * 뜻과 헷갈리던 짝이 글줄로 따라 나온다.
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

  const confused = answer.confusedWith ? itemById(answer.confusedWith.itemId) : undefined;

  return (
    <View style={styles.wrap}>
      <View style={styles.asked}>
        <Icon name="clock" size={13} color={color.text.assistive} />
        <AppText style={styles.askedLabel}>{question.askedLabel}</AppText>
      </View>

      <View style={styles.stem}>
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
      </View>

      <View style={styles.choices}>
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

      {settled ? (
        <View style={styles.after}>
          <AppText style={styles.meaning}>
            <Quote style={styles.meaningTerm}>{answer.term}</Quote>
            {'  '}
            {answer.meaning}
          </AppText>

          {answer.confusedWith && confused ? (
            <AppText style={styles.contrast}>
              <Quote style={styles.contrastTerm}>{confused.term}</Quote>
              {'  '}
              {answer.confusedWith.note}
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
  /** 아직 비어 있는 자리 — 표현 하나가 통째로 빠져 있어서 낱말보다 넓다 */
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
  /** 맞은 보기만 테두리가 진해진다. 채우지는 않는다. */
  choiceCorrect: { borderWidth: 1.5, borderColor: color.status.positive },
  /** 틀리게 고른 보기는 종이 뒤로 물러난다 */
  choiceWrong: { backgroundColor: color.surface.alt, borderColor: 'transparent' },
  choiceText: { fontSize: 17, lineHeight: 23, textAlign: 'center', color: color.text.primary },
  choiceTextCorrect: { fontWeight: '600' },

  after: { gap: 8, paddingTop: 2 },
  meaning: { ...type.label1, lineHeight: 22, color: color.text.secondary },
  meaningTerm: { fontSize: 15, fontWeight: '600', color: color.text.primary },
  contrast: { ...type.label2, lineHeight: 21, color: color.text.meta },
  contrastTerm: { fontSize: 14, fontWeight: '600', color: color.text.secondary },
});
