import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';

import { accent, color, ink } from '@/shared/config';
import { useWordPaint } from '@/shared/lib/use-word-paint';
import type { SentenceGroup } from '@/shared/ocr/selection';
import type { OcrFrame, OcrWord } from '@/shared/ocr/text-extractor';

export type Shot = { uri: string; width: number; height: number };

/** 낱말 칸보다 조금 넓게 잡는다 — 손가락은 글자보다 굵다(사진 픽셀이 아니라 화면 pt) */
const SLOP = 4;

/**
 * 찍은 쪽에서 **모르는 낱말을 고르는** 자리.
 *
 * **사진을 버리지 않는다.** 예전에는 글자만 읽어내고 사진을 지운 뒤 다시 조판해
 * 보여줬는데, 그러면 방금 내가 본 쪽과 화면에 뜬 글이 서로 다른 것이 되어
 * '이 줄'을 짚는 감각이 사라진다.
 *
 * 누르면 낱말 하나, 끌면 지나간 만큼(`useWordPaint`). 붙은 낱말은 한 표현(구)이
 * 된다. 고른 낱말이 든 문장은 옅게 칠해져서 무엇을 묻게 되는지 시트를 열기 전에
 * 보인다 — 문장 경계는 `shared/ocr/selection`이 정한다.
 *
 * 한동안은 문장의 처음과 끝 낱말을 짚어 문장을 골랐다. 그러면 무엇을 모르는지는
 * 모델이 짐작해야 했고, 짐작이 빗나간 문장은 아무것도 담기지 않은 채 남았다.
 */
export function PhotoPicker({
  shot,
  words,
  selected,
  groups,
  onChange,
  onToggle,
}: {
  shot: Shot;
  words: OcrWord[];
  selected: ReadonlySet<number>;
  /** 고른 낱말이 든 문장들 — 옅게 칠한다 */
  groups: SentenceGroup[];
  /** 끄는 동안 통째로 바꾼다. 받았으면 true */
  onChange: (next: ReadonlySet<number>) => boolean;
  /** 스크린리더가 낱말 하나를 눌렀을 때 */
  onToggle: (index: number) => void;
}) {
  const [box, setBox] = useState<{ width: number; height: number } | null>(
    null,
  );

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox({ width, height });
  };

  /** 사진은 contain으로 들어가므로, 남는 여백만큼 밀어서 좌표를 맞춘다 */
  const fit = box
    ? (() => {
        const scale = Math.min(
          box.width / shot.width,
          box.height / shot.height,
        );
        return {
          scale,
          dx: (box.width - shot.width * scale) / 2,
          dy: (box.height - shot.height * scale) / 2,
        };
      })()
    : null;

  /** 화면의 한 점이 어느 낱말 위인지 — 기울어진 칸은 거꾸로 돌려서 잰다 */
  const hit = ({ x, y }: { x: number; y: number }) => {
    if (!fit) return null;
    for (let i = 0; i < words.length; i += 1) {
      if (inside(words[i].frame, x, y, fit)) return i;
    }
    return null;
  };

  const gesture = useWordPaint({ hit, selected, onChange });

  const inSentence = (i: number) =>
    groups.some((group) => i >= group.from && i <= group.to);

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.stage} onLayout={onLayout}>
        <Image
          source={{ uri: shot.uri }}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
        />

        {fit
          ? words.map((word, i) => {
              const on = selected.has(i);
              return (
                <View
                  key={i}
                  accessible
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={word.text}
                  accessibilityHint={
                    on ? '눌러서 빼기' : '모르는 낱말로 고르기'
                  }
                  onAccessibilityTap={() => onToggle(i)}
                  style={[
                    styles.word,
                    inSentence(i) ? styles.wordSentence : null,
                    on ? styles.wordOn : null,
                    {
                      left: fit.dx + word.frame.x * fit.scale,
                      top: fit.dy + word.frame.y * fit.scale,
                      width: word.frame.width * fit.scale,
                      height: word.frame.height * fit.scale,
                      /** RN은 중심을 축으로 돌린다 — 인식기가 준 네모도 중심 기준이다 */
                      transform: [{ rotate: `${word.frame.angle ?? 0}rad` }],
                    },
                  ]}
                />
              );
            })
          : null}
      </View>
    </GestureDetector>
  );
}

/** 점이 낱말 칸 안에 있는지. 칸은 중심을 축으로 `angle`만큼 돌아 있다. */
function inside(
  frame: OcrFrame,
  x: number,
  y: number,
  fit: { scale: number; dx: number; dy: number },
): boolean {
  const left = fit.dx + frame.x * fit.scale;
  const top = fit.dy + frame.y * fit.scale;
  const width = frame.width * fit.scale;
  const height = frame.height * fit.scale;
  const cx = left + width / 2;
  const cy = top + height / 2;

  /** 칸이 돈 만큼 점을 거꾸로 돌리면 곧은 칸에 대고 잴 수 있다 */
  const angle = -(frame.angle ?? 0);
  const px = cx + (x - cx) * Math.cos(angle) - (y - cy) * Math.sin(angle);
  const py = cy + (x - cx) * Math.sin(angle) + (y - cy) * Math.cos(angle);

  return (
    px >= left - SLOP &&
    px <= left + width + SLOP &&
    py >= top - SLOP &&
    py <= top + height + SLOP
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, backgroundColor: ink(1), overflow: 'hidden' },

  /**
   * 낱말 한 칸. 안 고른 것은 눌리는 자리라는 것만 옅게 알린다 — 다만 종이색
   * 위에서 보일 만큼은. 한때 8%였는데 사진 위에서 거의 안 보여서, 인식기가
   * 못 읽은 줄과 읽었는데 안 보이는 줄을 구분할 수 없었다.
   */
  word: {
    position: 'absolute',
    borderRadius: 3,
    backgroundColor: accent(0.16),
  },
  /** 고른 낱말이 든 문장 — 무엇을 묻게 되는지 */
  wordSentence: { backgroundColor: accent(0.26) },
  /** 고른 낱말 — 지금 모르는 것 */
  wordOn: {
    backgroundColor: accent(0.55),
    borderWidth: 1.5,
    borderColor: color.primary,
  },
});
