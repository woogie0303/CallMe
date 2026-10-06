import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  FadeOutDown,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { color, type } from '@/shared/config';
import { MAX_PICKS, MAX_SENTENCES, type Limit } from '@/shared/ocr/selection';
import { AppText, Icon, Tap } from '@/shared/ui';

/**
 * 고른 것이 쌓이는 배지 — 사진 아래에 떠서 "표현 N개 · 문장 M개"를 말하고, 누르면
 * 물어볼 문장들이 시트로 올라온다.
 *
 * 낱말을 누를 때마다 눈에 보이는 반응이 있어야 눌렸다고 믿는다. 그래서 숫자는
 * 바뀔 때 굴러간다 — 늘면 아래에서 올라오고, 줄면 위에서 내려온다. 이 앱은 종이처럼
 * 차분한 쪽이라 튀지 않게 짧고 작게. 시스템의 '동작 줄이기'를 켜면 굴리지 않는다
 * (레이아웃 애니메이션의 기본값이 그 설정을 따른다).
 *
 * 한 번에 물을 수 있는 만큼에 닿은 채 또 고르면 배지가 옆으로 짧게 흔들리고
 * 한 줄이 그 이유를 말한다(`limit`이 바뀔 때마다).
 */
export function PickBadge({
  picks,
  sentences,
  limit,
  onPress,
}: {
  picks: number;
  sentences: number;
  /** 상한에 막힌 이유와 시각 — 바뀔 때마다 흔든다 */
  limit: { reason: Limit; at: number } | null;
  onPress: () => void;
}) {
  const shake = useSharedValue(0);
  const pop = useSharedValue(1);
  const first = useRef(true);
  /** 막힌 이유를 보여준 뒤 거둔 시각 — 이것과 `limitAt`이 같으면 한 줄을 내린다 */
  const [shownFor, setShownFor] = useState(0);

  const limitAt = limit?.at ?? 0;
  const noting = limitAt > 0 && shownFor !== limitAt;
  useEffect(() => {
    if (!limitAt) return;
    const done = setTimeout(() => setShownFor(limitAt), 2400);
    shake.value = withSequence(
      withTiming(-6, { duration: 50 }),
      withTiming(6, { duration: 70 }),
      withTiming(-3, { duration: 60 }),
      withTiming(0, { duration: 50 }),
    );
    return () => clearTimeout(done);
  }, [limitAt, shake]);

  /** 고른 것이 바뀔 때마다 한 번 톡 — 처음 떠오를 때는 떠오르는 것으로 충분하다 */
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    pop.value = withSequence(
      withTiming(1.05, { duration: 90 }),
      withTiming(1, { duration: 140 }),
    );
  }, [picks, sentences, pop]);

  const moving = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }, { scale: pop.value }],
  }));

  const full = sentences >= MAX_SENTENCES;

  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      exiting={FadeOutDown.duration(160)}
      style={styles.wrap}
      pointerEvents="box-none"
    >
      {noting ? (
        <Animated.View
          key={limitAt}
          entering={FadeIn.duration(140)}
          exiting={FadeOut.duration(200)}
          style={styles.note}
        >
          <AppText style={styles.noteText}>
            {limit?.reason === 'picks'
              ? `한 문장에서 표현은 ${MAX_PICKS}개까지 고를 수 있어요`
              : `한 번에 ${MAX_SENTENCES}문장까지 물을 수 있어요`}
          </AppText>
        </Animated.View>
      ) : null}

      <Animated.View style={moving}>
        <Tap
          onPress={onPress}
          style={styles.badge}
          accessibilityRole="button"
          accessibilityLabel={`표현 ${picks}개, 문장 ${sentences}개 골랐어요`}
          accessibilityHint="눌러서 물어볼 문장 보기"
        >
          <Icon name="tag" size={15} color={color.text.onInk} />
          <View style={styles.counts}>
            <AppText style={styles.label}>표현 </AppText>
            <Rolling value={picks} />
            <AppText style={styles.label}>개 · 문장 </AppText>
            <Rolling value={sentences} />
            <AppText style={[styles.label, full ? styles.full : null]}>
              {full ? `개 (최대)` : '개'}
            </AppText>
          </View>
          <Icon name="chevronRight" size={14} color={color.text.onInk} />
        </Tap>
      </Animated.View>
    </Animated.View>
  );
}

/**
 * 굴러가는 숫자. 값이 바뀌면 `key`가 바뀌어 옛 숫자는 나가고 새 숫자가 들어온다 —
 * 늘었으면 아래에서 위로, 줄었으면 위에서 아래로.
 */
function Rolling({ value }: { value: number }) {
  /** 지난번 값과 방향 — 값이 바뀐 렌더에서 바로 맞춘다(effect를 기다리면 한 박자 늦다) */
  const [last, setLast] = useState({ value, up: true });
  if (last.value !== value) setLast({ value, up: value > last.value });
  const up = last.value !== value ? value > last.value : last.up;

  return (
    <View style={styles.digitBox}>
      <Animated.View
        key={value}
        entering={(up ? FadeInUp : FadeInDown).duration(180)}
        exiting={(up ? FadeOutUp : FadeOutDown).duration(140)}
        style={styles.digit}
      >
        <AppText style={styles.number}>{value}</AppText>
      </Animated.View>
    </View>
  );
}

const LINE = 20;

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 16,
    paddingRight: 14,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: color.surface.ink,
  },
  counts: { flexDirection: 'row', alignItems: 'center' },
  label: { ...type.label2, fontWeight: '600', color: color.text.onInk },
  full: { color: color.text.onInkMuted },
  /** 숫자 하나가 드나드는 창 — 넘치는 것은 잘라서 굴러가는 것처럼 보인다 */
  digitBox: { height: LINE, overflow: 'hidden', justifyContent: 'center' },
  digit: { height: LINE, justifyContent: 'center' },
  number: {
    ...type.label2,
    lineHeight: LINE,
    fontWeight: '700',
    color: color.text.onInk,
    fontVariant: ['tabular-nums'],
  },
  note: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: color.surface.card,
  },
  noteText: {
    ...type.caption1,
    fontWeight: '600',
    color: color.text.secondary,
  },
});
