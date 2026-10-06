import { useEffect, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { color, type } from '../config';
import { Mark } from './marks';
import { AppText } from './text';

/** 기다리는 동안 돌아가며 보이는 말 — 지금 무슨 일이 일어나는지 */
const LINES = [
  '문장을 읽고 있어요',
  '고른 표현의 뜻을 찾고 있어요',
  '이 문장에 맞는 뜻으로 고르고 있어요',
  '서랍에 담을 준비를 하고 있어요',
];

/**
 * 묻는 동안 화면 전체를 덮는 기다림. 모델의 답은 몇 초가 걸린다 — 버튼 안에서
 * 스피너만 돌면 눌렸는지, 멈췄는지 알 수 없고, 그 사이 다른 것을 또 누르게 된다.
 *
 * 모래시계를 든 캐릭터가 천천히 떠오르고 좌우로 기우뚱한다. 종이 같은 앱이라 튀지
 * 않게 느리고 작게. '동작 줄이기'를 켰으면 움직이지 않고 말만 바뀐다.
 *
 * 닫는 길은 없다 — 묻는 중에 나가도 서버는 답을 받아 담는다. 끝나면 부르는 쪽이
 * 그 문장이 사는 곳으로 옮긴다.
 */
export function AskingOverlay({
  visible,
  sentences = 1,
}: {
  visible: boolean;
  /** 몇 문장을 묻는지 — 여럿이면 그렇다고 말한다 */
  sentences?: number;
}) {
  return (
    <Modal visible={visible} transparent animationType="none">
      {visible ? <Waiting sentences={sentences} /> : null}
    </Modal>
  );
}

function Waiting({ sentences }: { sentences: number }) {
  const reduce = useReducedMotion();
  const float = useSharedValue(0);
  const sway = useSharedValue(0);
  const [line, setLine] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const ease = Easing.inOut(Easing.sin);
    float.value = withRepeat(
      withTiming(1, { duration: 1400, easing: ease }),
      -1,
      true,
    );
    sway.value = withRepeat(
      withSequence(
        withTiming(-1, { duration: 900, easing: ease }),
        withTiming(1, { duration: 1800, easing: ease }),
        withTiming(0, { duration: 900, easing: ease }),
      ),
      -1,
    );
    return () => {
      cancelAnimation(float);
      cancelAnimation(sway);
    };
  }, [reduce, float, sway]);

  useEffect(() => {
    const timer = setInterval(
      () => setLine((n) => (n + 1) % LINES.length),
      1900,
    );
    return () => clearInterval(timer);
  }, []);

  const body = useAnimatedStyle(() => ({
    transform: [
      { translateY: -10 * float.value },
      { rotate: `${5 * sway.value}deg` },
    ],
  }));
  /** 떠오르면 그림자가 작고 옅어진다 — 바닥에서 떨어졌다는 것을 그림자가 말한다 */
  const shadow = useAnimatedStyle(() => ({
    transform: [{ scaleX: 1 - 0.22 * float.value }],
    opacity: 0.16 - 0.07 * float.value,
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(160)}
      style={styles.screen}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="묻는 중이에요. 잠시만 기다려 주세요."
      accessibilityLiveRegion="polite"
    >
      <View style={styles.stage}>
        <Animated.View style={body}>
          <Mark name="waiting" size={132} />
        </Animated.View>
        <Animated.View style={[styles.shadow, shadow]} />
      </View>

      <AppText style={styles.title}>
        {sentences > 1 ? `${sentences}문장을 묻고 있어요` : '묻고 있어요'}
      </AppText>
      <View style={styles.lineBox}>
        <Animated.View
          key={line}
          entering={FadeIn.duration(260)}
          exiting={FadeOut.duration(200)}
          style={styles.lineInner}
        >
          <AppText style={styles.line}>{LINES[line]}…</AppText>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
    backgroundColor: color.surface.base,
  },
  stage: { alignItems: 'center', marginBottom: 18 },
  shadow: {
    width: 84,
    height: 10,
    marginTop: 6,
    borderRadius: 999,
    backgroundColor: color.text.primary,
  },
  title: { ...type.heading2, fontWeight: '700', color: color.text.primary },
  /** 말이 바뀔 때 높이가 흔들리지 않게 한 줄 자리를 잡아 둔다 */
  lineBox: { height: 22, alignSelf: 'stretch', alignItems: 'center' },
  lineInner: { position: 'absolute' },
  line: { ...type.label2, color: color.text.secondary },
});
