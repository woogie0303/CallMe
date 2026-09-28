import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { accent, color, ink, type } from '@/shared/config';
import type { SentencePlacement } from '@/shared/ocr/align';
import { previewWords, type Selection } from '@/shared/ocr/selection';
import type { OcrWord } from '@/shared/ocr/text-extractor';
import { AppText, Quote, Tap } from '@/shared/ui';

export type Shot = { uri: string; width: number; height: number };

/**
 * 찍은 쪽에서 물어볼 글을 고르는 자리.
 *
 * **사진을 버리지 않는다.** 예전에는 글자만 읽어내고 사진을 지운 뒤 다시 조판해
 * 보여줬는데, 그러면 방금 내가 본 쪽과 화면에 뜬 글이 서로 다른 것이 되어
 * '이 줄'을 짚는 감각이 사라진다.
 *
 * 고르는 법은 **처음 낱말과 끝 낱말을 한 번씩 누르는 것**이다. 끌지 않는 이유가
 * 둘 있다 — 끄는 동작은 사진을 넘기거나 확대하는 손짓과 부딪히고, 스크린리더
 * 에서는 아예 할 수 없다. 두 번 누르기는 둘 다 피한다.
 *
 * 짚은 범위는 문장 경계까지 저절로 넓어진다(`shared/ocr/selection`). 조각만
 * 물으면 맥락 없는 뜻풀이가 되기 때문이다 — 넓어진 만큼이 화면에 그대로 칠해져서
 * 무엇을 묻게 되는지 누르기 전에 보인다.
 *
 * 좌표가 없는 인식기에서는 예전처럼 조판해 보여준다.
 */
export function PhotoPicker({
  shot,
  words,
  placements,
  selection,
  anchor,
  onTapWord,
  selected,
  onSelectSentence,
}: {
  shot: Shot;
  words: OcrWord[];
  /** 좌표가 없을 때의 물러날 자리 */
  placements: SentencePlacement[];
  /** 지금 정해진 범위 — 넓어진 뒤의 값 */
  selection: Selection | null;
  /** 첫 낱말만 짚어둔 상태 */
  anchor: number | null;
  onTapWord: (index: number) => void;
  selected?: string;
  onSelectSentence: (sentence: string) => void;
}) {
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);

  if (!words.length) {
    return (
      <TypesetPage placements={placements} selected={selected} onSelect={onSelectSentence} />
    );
  }

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox({ width, height });
  };

  /** 사진은 contain으로 들어가므로, 남는 여백만큼 밀어서 좌표를 맞춘다 */
  const fit = box
    ? (() => {
        const scale = Math.min(box.width / shot.width, box.height / shot.height);
        return {
          scale,
          dx: (box.width - shot.width * scale) / 2,
          dy: (box.height - shot.height * scale) / 2,
        };
      })()
    : null;

  /** 지금 칠할 범위 — 아직 끝을 안 짚었으면 첫 낱말 하나만 */
  const shown = selection ?? (anchor !== null ? previewWords(words, anchor) : null);

  return (
    <View style={styles.stage} onLayout={onLayout}>
      <Image source={{ uri: shot.uri }} style={StyleSheet.absoluteFill} contentFit="contain" />

      {fit
        ? words.map((word, i) => {
            const on = shown ? i >= shown.from && i <= shown.to : false;
            const isAnchor = anchor === i && !selection;
            return (
              <Tap
                key={i}
                onPress={() => onTapWord(i)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={word.text}
                accessibilityHint={
                  anchor === null ? '여기서부터 고르기' : '여기까지 고르기'
                }
                style={[
                  styles.word,
                  on ? styles.wordOn : null,
                  isAnchor ? styles.wordAnchor : null,
                  {
                    left: fit.dx + word.frame.x * fit.scale,
                    top: fit.dy + word.frame.y * fit.scale,
                    width: word.frame.width * fit.scale,
                    height: word.frame.height * fit.scale,
                  },
                ]}
              />
            );
          })
        : null}

      {/* 무엇을 하면 되는지 한 줄. 짚기 전에는 시작을, 짚은 뒤에는 끝을 말한다. */}
      <View style={styles.hint} pointerEvents="none">
        <AppText style={styles.hintText}>
          {anchor === null && !selection
            ? '막힌 곳의 첫 낱말을 눌러주세요'
            : !selection
              ? '이제 끝 낱말을 눌러주세요'
              : shown?.widened
                ? '문장 전체로 넓혔어요 · 다시 고르려면 아무 낱말이나'
                : '다시 고르려면 아무 낱말이나 눌러주세요'}
        </AppText>
      </View>
    </View>
  );
}

/**
 * 좌표가 없을 때의 물러날 자리 — 읽어낸 글을 한 문단으로 흘려 조판한다.
 * 목록처럼 쌓지 않는 이유는, 목록으로 보이는 순간 '책의 한 쪽'이라는 감각이
 * 사라지기 때문이다.
 */
function TypesetPage({
  placements,
  selected,
  onSelect,
}: {
  placements: SentencePlacement[];
  selected?: string;
  onSelect: (sentence: string) => void;
}) {
  return (
    <View style={styles.paper}>
      <Quote style={styles.flow}>
        {placements.map((place, i) => {
          const on = place.sentence === selected;
          return (
            <Quote
              key={i}
              onPress={() => onSelect(place.sentence)}
              style={on ? styles.pickedText : styles.plainText}
              accessibilityLabel={place.sentence}>
              {place.sentence}
              {i < placements.length - 1 ? '  ' : ''}
            </Quote>
          );
        })}
      </Quote>
      <AppText style={styles.hintText2}>
        사진에서 읽어낸 글이에요 · 물어볼 문장을 눌러보세요
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, backgroundColor: ink(1), overflow: 'hidden' },

  /** 낱말 한 칸. 안 고른 것은 눌리는 자리라는 것만 아주 옅게 알린다. */
  word: { position: 'absolute', borderRadius: 3, backgroundColor: accent(0.08) },
  wordOn: { backgroundColor: accent(0.42) },
  /** 첫 낱말만 짚어둔 상태 — 여기서 시작한다는 표시 */
  wordAnchor: { backgroundColor: accent(0.5), borderWidth: 1.5, borderColor: color.primary },

  hint: { position: 'absolute', left: 0, right: 0, bottom: 12, alignItems: 'center' },
  hintText: {
    ...type.caption1,
    color: color.text.onInk,
    backgroundColor: ink(0.72),
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    overflow: 'hidden',
  },

  paper: {
    borderRadius: 16,
    backgroundColor: color.surface.page,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border.default,
    paddingHorizontal: 20,
    paddingVertical: 22,
    gap: 16,
  },
  flow: { fontSize: 16, lineHeight: 28 },
  plainText: { color: color.text.body },
  pickedText: { color: color.primary, backgroundColor: accent(0.12), fontWeight: '600' },
  hintText2: { ...type.caption2, color: color.text.meta },
});
