import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { color, family, type } from '@/shared/config';
import { AppText, Icon, Quote, Tap } from '@/shared/ui';

/** 시트에 서는 문장 하나 — 글과, 그 안에서 고른 표현들 */
export type SheetSentence = {
  key: string;
  text: string;
  picks: {
    surface: string;
    /** 고친 문장에서 사라졌는지 — 묻기 전에 빼거나 문장을 고쳐야 한다 */
    missing: boolean;
    /** 사진 위 낱말 번호 — 칩을 빼면 그 낱말들의 고르기가 풀린다 */
    from: number;
    to: number;
  }[];
};

/**
 * 물어볼 문장 카드. **누르면 바로 고치는 칸이 된다** — 글자 인식은 틀린다(낱말이
 * 빠지거나 줄 끝 하이픈이 남는다). 틀린 글자를 보면 손은 버튼이 아니라 그 글자로
 * 간다. 가만히 있을 때는 고른 표현에 밑줄이 그어진 책의 글로 보인다.
 *
 * 아래 칩은 고른 표현들이다. ✕로 빼면 사진 위의 고르기도 함께 풀린다. 문장을 고치다
 * 표현이 사라졌으면 칩이 주의 색이 되고 묻기가 막힌다 — 문장에 없는 표현을 물으면
 * 모델이 문장 밖의 뜻을 지어낸다.
 */
export function AskSentence({
  sentence,
  index,
  onChangeText,
  onRemovePick,
}: {
  sentence: SheetSentence;
  /** 몇 번째 카드인지 — 하나씩 차례로 올라온다 */
  index: number;
  onChangeText: (next: string) => void;
  onRemovePick: (from: number, to: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const missing = sentence.picks.some((pick) => pick.missing);

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 4) * 50).duration(220)}
      style={styles.card}
    >
      {editing ? (
        <TextInput
          value={sentence.text}
          onChangeText={onChangeText}
          onBlur={() => setEditing(false)}
          autoFocus
          multiline
          scrollEnabled={false}
          accessibilityLabel="물어볼 문장 고치기"
          style={[styles.sentence, styles.editing]}
        />
      ) : (
        <Tap
          onPress={() => setEditing(true)}
          accessibilityRole="button"
          accessibilityLabel={sentence.text}
          accessibilityHint="눌러서 문장 고치기"
        >
          <Quote style={styles.sentence}>
            {segments(
              sentence.text,
              sentence.picks.map((pick) => pick.surface),
            ).map((part, i) => (
              <Quote key={i} style={part.on ? styles.marked : null}>
                {part.text}
              </Quote>
            ))}
          </Quote>
        </Tap>
      )}

      <View style={styles.chips}>
        {sentence.picks.map((pick) => (
          <View
            key={`${pick.from}-${pick.to}`}
            style={[styles.chip, pick.missing ? styles.chipMissing : null]}
          >
            <Quote
              style={[
                styles.chipText,
                pick.missing ? styles.chipTextMissing : null,
              ]}
            >
              {pick.surface}
            </Quote>
            <Tap
              hitSlop={10}
              onPress={() => onRemovePick(pick.from, pick.to)}
              accessibilityRole="button"
              accessibilityLabel={`${pick.surface} 빼기`}
            >
              <Icon
                name="close"
                size={12}
                color={pick.missing ? color.status.cautionary : color.primary}
              />
            </Tap>
          </View>
        ))}
      </View>

      {missing ? (
        <AppText style={styles.hint}>
          문장에 없는 표현이 있어요. 빼거나 문장을 고쳐 주세요.
        </AppText>
      ) : null}
    </Animated.View>
  );
}

/** 글을 고른 표현이 있는 곳과 없는 곳으로 나눈다 — 처음 나온 자리 하나씩 */
function segments(text: string, surfaces: string[]) {
  const lower = text.toLowerCase();
  const spans = surfaces
    .flatMap((surface) => {
      const at = surface ? lower.indexOf(surface.toLowerCase()) : -1;
      return at < 0 ? [] : [{ from: at, to: at + surface.length }];
    })
    .sort((a, b) => a.from - b.from);

  const parts: { text: string; on: boolean }[] = [];
  let cursor = 0;
  for (const span of spans) {
    if (span.to <= cursor) continue;
    const from = Math.max(span.from, cursor);
    if (from > cursor)
      parts.push({ text: text.slice(cursor, from), on: false });
    parts.push({ text: text.slice(from, span.to), on: true });
    cursor = span.to;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), on: false });
  return parts;
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: color.surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border.subtle,
  },
  /** 책의 글이라 고치는 중에도 세리프다 */
  sentence: {
    fontFamily: family.serif,
    fontSize: 17,
    lineHeight: 27,
    color: color.text.primary,
  },
  editing: {
    padding: 8,
    margin: -8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border.strong,
    textAlignVertical: 'top',
  },
  marked: {
    color: color.primary,
    textDecorationLine: 'underline',
    textDecorationColor: color.primaryLine,
  },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    /** 긴 구는 칩 안에서 줄을 바꾼다 — 칸을 넘으면 ✕가 밀려 나간다 */
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingLeft: 10,
    paddingRight: 9,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: color.primaryTint,
  },
  chipMissing: { backgroundColor: color.fill.default },
  chipText: {
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 18,
    color: color.primary,
  },
  chipTextMissing: {
    color: color.status.cautionary,
    textDecorationLine: 'line-through',
  },
  hint: { ...type.caption1, color: color.status.cautionary },
});
