import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { blue, color, ink, type } from '@/shared/config';
import type { SentencePlacement } from '@/shared/ocr/align';
import type { OcrLine } from '@/shared/ocr/text-extractor';
import { AppText, Quote, Tap } from '@/shared/ui';

export type Shot = { uri: string; width: number; height: number };

/**
 * 찍은 쪽에서 문장을 고르는 자리.
 *
 * **사진을 버리지 않는다.** 예전에는 글자만 읽어내고 사진을 지운 뒤 다시 조판해
 * 보여줬는데, 그러면 방금 내가 본 쪽과 화면에 뜬 글이 서로 다른 것이 되어
 * '이 줄'을 짚는 감각이 사라진다. 좌표가 있으면 **사진 위에서** 짚는다.
 *
 * 좌표가 없는 인식기(지금의 `expo-text-extractor`)에서는 예전처럼 조판해
 * 보여준다 — 고를 수는 있어야 하니까. 둘 중 어느 쪽인지는 `placements`가 정한다.
 */
export function PhotoPicker({
  shot,
  lines,
  placements,
  selected,
  onSelect,
}: {
  shot: Shot;
  lines: OcrLine[];
  /** 문장별로 어느 줄에 놓였는지. 줄 번호가 있으면 사진 위에 얹는다. */
  placements: SentencePlacement[];
  selected?: string;
  onSelect: (sentence: string) => void;
}) {
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);
  const located = placements.some((p) => p.lines.length > 0) && lines.some((l) => l.frame);

  if (!located) {
    return <TypesetPage placements={placements} selected={selected} onSelect={onSelect} />;
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

  return (
    <View style={styles.stage} onLayout={onLayout}>
      <Image source={{ uri: shot.uri }} style={StyleSheet.absoluteFill} contentFit="contain" />

      {fit
        ? placements.map((place) => {
            const frames = place.lines
              .map((i) => lines[i]?.frame)
              .filter((f): f is NonNullable<typeof f> => Boolean(f));
            if (!frames.length) return null;
            const on = place.sentence === selected;

            return (
              <Tap
                key={place.sentence}
                onPress={() => onSelect(place.sentence)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={place.sentence}
                style={StyleSheet.absoluteFill}>
                {frames.map((f, i) => (
                  <View
                    key={i}
                    style={[
                      styles.band,
                      on ? styles.bandOn : null,
                      {
                        left: fit.dx + f.x * fit.scale,
                        top: fit.dy + f.y * fit.scale,
                        width: f.width * fit.scale,
                        height: f.height * fit.scale,
                      },
                    ]}
                  />
                ))}
              </Tap>
            );
          })
        : null}
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
      <AppText style={styles.hint}>사진에서 읽어낸 글이에요 · 물어볼 문장을 눌러보세요</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, backgroundColor: ink(1), overflow: 'hidden' },
  /** 글자 위에 얹는 띠. 사진을 가리지 않을 만큼만 옅다. */
  band: {
    position: 'absolute',
    borderRadius: 3,
    backgroundColor: blue(0.18),
  },
  bandOn: {
    backgroundColor: blue(0.42),
    borderWidth: 1.5,
    borderColor: color.primary,
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
  pickedText: { color: color.primary, backgroundColor: blue(0.12), fontWeight: '600' },
  hint: { ...type.caption2, color: color.text.meta },
});
