import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';

import { color, family } from '@/shared/config';
import { useWordPaint } from '@/shared/lib/use-word-paint';
import { sentenceAround, type Range } from '@/shared/ocr/selection';
import { Quote } from '@/shared/ui';

type Rect = { x: number; y: number; width: number; height: number };

/**
 * 적은 글 위에서 모르는 낱말을 고르는 자리. 사진 위에서 고를 때와 손짓이 같다 —
 * 누르면 낱말 하나가 따로 한 표현, 옆으로 끌면 지나간 만큼이 한 표현(`useWordPaint`).
 * 스크롤 안에 놓여서 위아래 손짓은 스크롤에 양보한다(`horizontal`).
 *
 * 낱말은 책에서 온 글이라 세리프다. 고른 표현은 잉크블루 바탕으로 칠하고, **같은 손짓으로
 * 고른** 낱말끼리만 사이 틈까지 칠해서 하나의 덩어리로 보인다 — 따로 눌러서 이웃해 있는
 * 두 표현은 틈이 남아서 둘로 보인다.
 */
export function WordPicker({
  words,
  ranges,
  selected,
  onChange,
  onToggle,
}: {
  words: { text: string }[];
  /** 고른 표현들 — 한 범위가 한 표현 */
  ranges: Range[];
  selected: ReadonlySet<number>;
  onChange: (next: Range[]) => boolean;
  onToggle: (index: number) => void;
}) {
  /** 낱말마다 놓인 자리 — 손가락 아래가 어느 낱말인지 재는 데 쓴다 */
  const rects = useRef<Rect[]>([]);

  const hit = ({ x, y }: { x: number; y: number }) => {
    const found = rects.current.findIndex(
      (rect) =>
        rect &&
        x >= rect.x &&
        x <= rect.x + rect.width &&
        y >= rect.y &&
        y <= rect.y + rect.height,
    );
    return found < 0 ? null : found;
  };

  const gesture = useWordPaint({
    hit,
    ranges,
    onChange,
    /** 끌어도 그 문장 끝을 넘지 않는다 */
    clamp: (anchor) => sentenceAround(words, anchor),
    horizontal: true,
  });

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.wrap}>
        {words.map((word, i) => {
          const on = selected.has(i);
          /** 같은 표현의 다음 낱말이면 사이 틈까지 칠해 한 덩어리로 보이게 */
          const joined = ranges.some((r) => i >= r.from && i < r.to);
          const continued = ranges.some((r) => i > r.from && i <= r.to);
          return (
            <View
              key={i}
              onLayout={(e) => {
                rects.current[i] = e.nativeEvent.layout;
              }}
              accessible
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={word.text}
              accessibilityHint={on ? '눌러서 빼기' : '모르는 낱말로 고르기'}
              onAccessibilityTap={() => onToggle(i)}
              style={[
                styles.word,
                on ? styles.wordOn : null,
                joined ? styles.joined : null,
                continued ? styles.continued : null,
              ]}
            >
              <Quote style={[styles.text, on ? styles.textOn : null]}>
                {word.text}
              </Quote>
            </View>
          );
        })}
      </View>
    </GestureDetector>
  );
}

/**
 * 낱말 사이는 글자 사이 틈이 아니라 칠하는 칸의 안쪽 여백(`PAD`)과 바깥 틈(`GAP`)이다.
 * 한때 5+4+5로 14pt여서 문장이 성기게 읽혔다 — 글자 틈은 7pt, 따로 고른 두 표현 사이의 칠
 * 틈은 3pt다.
 */
const PAD = 2;
const GAP = 3;

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 6 },
  word: {
    paddingHorizontal: PAD,
    paddingVertical: 3,
    marginRight: GAP,
    borderRadius: 7,
  },
  wordOn: { backgroundColor: color.primaryTint },
  /** 다음 낱말과 붙는다 — 오른쪽 둥근 모서리와 틈을 없앤다 */
  joined: {
    marginRight: 0,
    paddingRight: PAD + GAP,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  /** 앞 낱말에 이어진다 — 왼쪽 둥근 모서리를 없앤다 */
  continued: { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
  text: {
    fontFamily: family.serif,
    fontSize: 18,
    lineHeight: 26,
    color: color.text.primary,
  },
  textOn: { color: color.primary },
});
