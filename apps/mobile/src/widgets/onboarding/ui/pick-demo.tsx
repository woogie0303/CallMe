import { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { accent, color, ink, type } from '@/shared/config';
import { AppText, Quote } from '@/shared/ui';

/**
 * 안내 첫 쪽의 그림 — 찍은 쪽 위에서 모르는 낱말을 고르는 두 가지 손짓을 손가락이
 * 직접 해 보인다. **누르면** 낱말 하나가 표현 하나, **끌면** 지나간 만큼이 표현 하나.
 * 고른 표현이 든 문장은 옅게 칠해진다 — 묻는 것은 그 문장째다.
 *
 * 띠의 색은 촬영 화면(`widgets/capture/ui/photo-picker`)과 같다. 안내에서 본 띠를
 * 사진 위에서 그대로 다시 만나야 같은 일이라는 것이 읽힌다.
 *
 * 예문은 퍼블릭 도메인 원문(샬럿 브론테의 『제인 에어』)이다.
 */

const BEFORE = 'The room was small, but comfortable enough.';
const SENTENCE =
  'I was puzzling to make out the subject of a picture on the wall.';
const AFTER = 'Then the door opened.';

const WORDS = [BEFORE, SENTENCE, AFTER].flatMap((part) => part.split(' '));
const SENTENCE_FROM = BEFORE.split(' ').length;
const SENTENCE_TO = SENTENCE_FROM + SENTENCE.split(' ').length - 1;
/** 누르는 낱말 — puzzling */
const TAP = SENTENCE_FROM + 2;
/** 끄는 범위 — make out */
const DRAG_FROM = SENTENCE_FROM + 4;
const DRAG_TO = SENTENCE_FROM + 5;

/** 한 바퀴의 길이와, 그 안의 장면들(ms) */
const CYCLE = 7600;
const T = {
  fingerIn: 400,
  atTap: 1100,
  tapUp: 1400,
  leaveTap: 1900,
  atDrag: 2700,
  dragDown: 2850,
  dragEnd: 4100,
  dragUp: 4250,
  fingerOut: 4700,
  fadeStart: 6600,
  fadeEnd: 7200,
};

/** 띠는 글자보다 살짝 넓게 — 촬영 화면과 같다 */
const PAD = 2;
const FINGER = 30;

type Box = { x: number; y: number; width: number; height: number };

/** 그림이 쓰는 자리들 — 낱말 칸을 다 잰 뒤 한 번 만든다 */
type Geometry = {
  tap: Box;
  /** 끄는 범위 — 줄마다 하나의 띠(`fill`은 그 줄에서 칠할 길이) */
  drag: (Box & { fill: number })[];
  /** 문장은 줄마다 하나의 띠 */
  sentence: Box[];
  start: { x: number; y: number };
};

export function PickDemo() {
  const reduce = useReducedMotion();
  const [boxes, setBoxes] = useState<(Box | undefined)[]>(() =>
    WORDS.map(() => undefined),
  );
  const geo = useMemo(() => geometryOf(boxes), [boxes]);
  const t = useSharedValue(0);

  useEffect(() => {
    if (!geo) return;
    /** 움직임을 줄인 독자에게는 다 고른 뒤의 한 장면만 보인다 */
    if (reduce) {
      t.value = T.fingerOut + 400;
      return;
    }
    t.value = 0;
    t.value = withRepeat(
      withTiming(CYCLE, { duration: CYCLE, easing: Easing.linear }),
      -1,
    );
  }, [geo, reduce, t]);

  const measure = (i: number) => (e: LayoutChangeEvent) => {
    const { x, y, width, height } = e.nativeEvent.layout;
    setBoxes((prev) => {
      const next = [...prev];
      next[i] = { x, y, width, height };
      return next;
    });
  };

  return (
    <View style={styles.stack}>
      <View style={styles.page}>
        <View style={styles.words}>
          {geo ? <Bands t={t} geo={geo} /> : null}
          {WORDS.map((word, i) => (
            <View key={i} onLayout={measure(i)}>
              <Quote
                style={[
                  styles.word,
                  i >= SENTENCE_FROM && i <= SENTENCE_TO
                    ? styles.inSentence
                    : null,
                ]}
              >
                {word}
              </Quote>
            </View>
          ))}
          {geo && !reduce ? <Finger t={t} geo={geo} /> : null}
        </View>
      </View>

      <View style={styles.legend}>
        <LegendRow
          t={t}
          from={T.atTap}
          swatch={styles.pickSwatch}
          label="누르면 낱말 하나가 표현 하나"
        />
        <LegendRow
          t={t}
          from={T.dragDown}
          swatch={[styles.pickSwatch, styles.wideSwatch]}
          label="끌면 지나간 만큼이 표현 하나"
        />
      </View>
    </View>
  );
}

/** 고른 표현의 진한 띠와, 그 표현이 든 문장의 옅은 띠 */
function Bands({ t, geo }: { t: SharedValue<number>; geo: Geometry }) {
  /** 한 바퀴 끝에서 모두 함께 사라진다 */
  const fade = (ms: number) => {
    'worklet';
    return interpolate(ms, [T.fadeStart, T.fadeEnd], [1, 0], 'clamp');
  };

  const sentence = useAnimatedStyle(() => ({
    opacity:
      interpolate(t.value, [T.atTap + 100, T.tapUp + 100], [0, 1], 'clamp') *
      fade(t.value),
  }));
  const tap = useAnimatedStyle(() => ({
    opacity:
      interpolate(t.value, [T.atTap + 50, T.atTap + 200], [0, 1], 'clamp') *
      fade(t.value),
  }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, sentence]}>
        {geo.sentence.map((line, k) => (
          <View key={k} style={[styles.sentenceBand, padded(line)]} />
        ))}
      </Animated.View>
      <Animated.View style={[styles.pickBand, padded(geo.tap), tap]} />
      {geo.drag.map((_, k) => (
        <DragBand key={k} t={t} geo={geo} index={k} />
      ))}
    </View>
  );
}

/** 끄는 동안 손가락이 지나간 만큼만 칠해진다 */
function DragBand({
  t,
  geo,
  index,
}: {
  t: SharedValue<number>;
  geo: Geometry;
  index: number;
}) {
  const box = geo.drag[index];
  const { before, total } = dragSpan(geo, index);

  const style = useAnimatedStyle(() => {
    const p = interpolate(
      t.value,
      [T.dragDown, T.dragEnd],
      [0, total],
      'clamp',
    );
    const shown = Math.min(Math.max(p - before, 0), box.fill);
    return {
      width: shown > 0 ? shown + PAD * 2 : 0,
      opacity:
        t.value < T.dragDown
          ? 0
          : interpolate(t.value, [T.fadeStart, T.fadeEnd], [1, 0], 'clamp'),
    };
  });

  return (
    <Animated.View
      style={[
        styles.pickBand,
        {
          left: box.x - PAD,
          top: box.y - PAD,
          height: box.height + PAD * 2,
        },
        style,
      ]}
    />
  );
}

/** 누르고, 옮겨 가서, 끄는 손가락 */
function Finger({ t, geo }: { t: SharedValue<number>; geo: Geometry }) {
  const tapPoint = center(geo.tap);
  const first = geo.drag[0];
  const dragStart = { x: first.x + 4, y: first.y + first.height / 2 };
  const spans = geo.drag.map((_, k) => dragSpan(geo, k));
  const total = spans[spans.length - 1].before + geo.drag[geo.drag.length - 1].fill;
  const lastBox = geo.drag[geo.drag.length - 1];
  const dragEnd = {
    x: lastBox.x + lastBox.fill - 2,
    y: lastBox.y + lastBox.height / 2,
  };
  const { start } = geo;
  const drag = geo.drag;

  const style = useAnimatedStyle(() => {
    const ms = t.value;
    /** 천천히 떠나 천천히 닿는다(smoothstep) */
    const ease = (a: number, b: number) => {
      const k = interpolate(ms, [a, b], [0, 1], 'clamp');
      return k * k * (3 - 2 * k);
    };

    let x: number;
    let y: number;
    if (ms < T.atTap) {
      const k = ease(T.fingerIn, T.atTap);
      x = start.x + (tapPoint.x - start.x) * k;
      y = start.y + (tapPoint.y - start.y) * k;
    } else if (ms < T.leaveTap) {
      x = tapPoint.x;
      y = tapPoint.y;
    } else if (ms < T.atDrag) {
      const k = ease(T.leaveTap, T.atDrag);
      x = tapPoint.x + (dragStart.x - tapPoint.x) * k;
      y = tapPoint.y + (dragStart.y - tapPoint.y) * k;
    } else if (ms < T.dragDown) {
      x = dragStart.x;
      y = dragStart.y;
    } else if (ms < T.dragEnd) {
      /** 끄는 길은 낱말을 따라간다 — 줄이 바뀌면 다음 줄 첫 낱말로 */
      const p = interpolate(ms, [T.dragDown, T.dragEnd], [0, total], 'clamp');
      let k = 0;
      while (k < drag.length - 1 && p > spans[k].before + drag[k].fill) k += 1;
      const box = drag[k];
      x = box.x + Math.min(p - spans[k].before, box.fill);
      y = box.y + box.height / 2;
    } else {
      x = dragEnd.x;
      y = dragEnd.y;
    }

    /** 누르는 동안 살짝 작아진다 — 누를 때와 뗄 때 0.12초씩 */
    const press = (down: number, up: number) =>
      interpolate(
        ms,
        [down, down + 120, up - 120, up],
        [0, 1, 1, 0],
        'clamp',
      );
    const scale =
      1 - 0.2 * Math.max(press(T.atTap, T.tapUp), press(T.atDrag, T.dragUp));
    const opacity =
      interpolate(ms, [0, T.fingerIn], [0, 1], 'clamp') *
      interpolate(ms, [T.dragUp, T.fingerOut], [1, 0], 'clamp');

    return {
      opacity,
      transform: [
        { translateX: x - FINGER / 2 },
        { translateY: y - FINGER / 2 },
        { scale },
      ],
    };
  });

  return <Animated.View pointerEvents="none" style={[styles.finger, style]} />;
}

/** 그 장면에 이르면 진해지고, 한 바퀴가 끝나면 다시 옅어진다 */
function LegendRow({
  t,
  from,
  swatch,
  label,
}: {
  t: SharedValue<number>;
  from: number;
  swatch: StyleProp<ViewStyle>;
  label: string;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(
      t.value,
      [from, from + 200, T.fadeStart, T.fadeEnd],
      [0.4, 1, 1, 0.4],
      'clamp',
    ),
  }));

  return (
    <Animated.View style={[styles.legendRow, style]}>
      <View style={swatch} />
      <AppText style={styles.legendLabel}>{label}</AppText>
    </Animated.View>
  );
}

/** 낱말 칸을 다 쟀으면 그림의 자리들을 만든다. 하나라도 덜 쟀으면 아직이다. */
function geometryOf(boxes: (Box | undefined)[]): Geometry | null {
  if (boxes.some((box) => !box)) return null;
  const all = boxes as Box[];
  const sameLine = (a: Box, b: Box) => Math.abs(a.y - b.y) < a.height / 2;

  /** 낱말들을 줄마다 하나의 띠로 — 낱말마다 따로 칠하면 붙은 띠의 테두리가 겹친다 */
  const linesOf = (from: number, to: number) => {
    const lines: Box[] = [];
    for (const box of all.slice(from, to + 1)) {
      const line = lines[lines.length - 1];
      if (line && sameLine(line, box)) {
        line.width = box.x + box.width - line.x;
      } else {
        lines.push({ ...box });
      }
    }
    return lines;
  };

  const drag = linesOf(DRAG_FROM, DRAG_TO).map((line) => ({
    ...line,
    fill: line.width,
  }));
  const sentence = linesOf(SENTENCE_FROM, SENTENCE_TO);

  const tap = all[TAP];
  return {
    tap,
    drag,
    sentence,
    /** 누를 낱말의 오른쪽 아래에서 들어온다 */
    start: { x: tap.x + tap.width + 40, y: tap.y + tap.height + 46 },
  };
}

/** 끄는 길에서 이 낱말 앞까지 지나온 길이와, 끄는 길 전체 */
function dragSpan(geo: Geometry, index: number) {
  const before = geo.drag
    .slice(0, index)
    .reduce((sum, box) => sum + box.fill, 0);
  const total = geo.drag.reduce((sum, box) => sum + box.fill, 0);
  return { before, total };
}

function center(box: Box) {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

function padded(box: Box) {
  return {
    left: box.x - PAD,
    top: box.y - PAD,
    width: box.width + PAD * 2,
    height: box.height + PAD * 2,
  };
}

const styles = StyleSheet.create({
  stack: { gap: 18 },

  /** 찍힌 쪽 — 바탕보다 어두워야 '사진 속 종이'로 읽힌다(`surface.page`) */
  page: {
    paddingHorizontal: 18,
    paddingVertical: 20,
    borderRadius: 16,
    backgroundColor: color.surface.page,
  },
  words: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 5,
    rowGap: 8,
  },
  word: { fontSize: 16, lineHeight: 24, color: color.text.neutral },
  inSentence: { color: color.text.primary },

  /** 촬영 화면의 띠와 같은 색 */
  sentenceBand: {
    position: 'absolute',
    borderRadius: 5,
    backgroundColor: accent(0.24),
  },
  pickBand: {
    position: 'absolute',
    borderRadius: 5,
    backgroundColor: accent(0.5),
    borderWidth: 1.5,
    borderColor: color.primary,
  },

  finger: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: FINGER,
    height: FINGER,
    borderRadius: FINGER / 2,
    backgroundColor: ink(0.22),
    borderWidth: 2,
    borderColor: color.surface.base,
  },

  legend: { gap: 10 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendLabel: { ...type.label2, color: color.text.secondary },
  pickSwatch: {
    width: 18,
    height: 12,
    borderRadius: 3,
    backgroundColor: accent(0.5),
    borderWidth: 1.5,
    borderColor: color.primary,
  },
  wideSwatch: { width: 30 },
});
