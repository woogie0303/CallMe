import { useEffect, useState } from 'react';
import {
  Keyboard,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
  type KeyboardEvent,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  SlideInDown,
  SlideOutDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, family, gutter, type } from '@/shared/config';
import { ActionButton, AppText, PageIcon, PageInput } from '@/shared/ui';

/** 이만큼 넘게 끌어내리면 닫는다 — 원래 높이에 대한 비율 */
const DISMISS_RATIO = 0.35;
/** 이보다 빠르게 튕겨 내리면 거리가 짧아도 닫는다(pt/s) */
const FLING = 900;

/**
 * 자판 높이. iOS는 자판이 움직이기 전에 알려줘서 시트가 같이 움직일 수 있다.
 */
function useKeyboardHeight() {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const move = (next: number, event?: KeyboardEvent) => {
      if (ios) {
        LayoutAnimation.configureNext({
          duration: event?.duration || 250,
          update: { type: LayoutAnimation.Types.keyboard },
        });
      }
      setHeight(next);
    };
    const show = Keyboard.addListener(
      ios ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => move(e.endCoordinates.height, e),
    );
    const hide = Keyboard.addListener(
      ios ? 'keyboardWillHide' : 'keyboardDidHide',
      (e) => move(0, e),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return height;
}

/**
 * 짚은 문장 하나가 올라오는 시트. 여기서는 **고르기만** 한다 — 물을지, 그냥
 * 마음에 든 문장으로 둘지. 고르는 순간 그 문장이 사는 곳으로 옮기는 일은 부르는
 * 쪽(`app/scan.tsx`)이 한다.
 *
 * - **문장은 처음부터 입력칸이다.** 글자 인식은 틀린다 — 낱말 하나가 빠지거나 줄
 *   끝 하이픈이 남는다. 한동안 '고치기' 버튼을 눌러야 칸으로 바뀌었는데, 틀린
 *   글자를 보면 손은 버튼이 아니라 그 글자로 간다.
 * - **쪽수는 꼭, 그 책 안에서.** 나중에 이 문장을 다시 찾을 때 붙잡을 곳이
 *   쪽수뿐이고 진도도 그만큼 옮겨진다. 책에 없는 쪽이면 버튼이 눌리지 않고 이유를
 *   말한다(서버도 한 번 더 막는다).
 * - **손잡이로 높이를 바꾼다.** 끌어올리면 화면 위까지 자라고, 원래 높이의
 *   35% 넘게 끌어내리면 닫혀서 찍은 쪽이 다시 보인다. 닫기 버튼(✕)은 그래서
 *   따로 두지 않는다.
 * - **자판이 올라오면 화면 위까지 자란다.** 이제 보여야 할 것은 사진이 아니라
 *   고치는 글과 쪽수다. 자판이 내려가면 원래 크기로 돌아온다.
 */
export function AskSheet({
  sentence,
  onChangeSentence,
  page,
  onChangePage,
  maxPage,
  quotaLeft,
  asking,
  keeping,
  onAsk,
  onKeepOnly,
  onClose,
}: {
  sentence: string;
  onChangeSentence: (next: string) => void;
  /** 숫자만 */
  page: string;
  onChangePage: (next: string) => void;
  /** 책의 마지막 쪽. 모르면 없다. */
  maxPage?: number;
  quotaLeft: number;
  asking?: boolean;
  keeping?: boolean;
  onAsk: () => void;
  onKeepOnly: () => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { height: screen } = useWindowDimensions();
  const keyboard = useKeyboardHeight();
  const raised = keyboard > 0;
  const [focused, setFocused] = useState(false);

  const typed = Number(page);
  const tooFar = Boolean(maxPage && typed > maxPage);
  const ready = typed > 0 && !tooFar && sentence.trim().length > 0;

  /**
   * 높이. 끌기 전에는 내용이 정한 높이(`natural`)를 쓰고, 손잡이를 잡는 순간부터
   * 손가락이 정한다. 제자리로 돌아오면 다시 내용에 맡긴다. 끄는 동안의 계산은
   * 전부 UI 스레드(worklet)에서 한다 — 손가락을 따라가는 데 JS를 거치면 끊긴다.
   */
  const [sized, setSized] = useState(false);
  const height = useSharedValue(0);
  const start = useSharedValue(0);
  const natural = useSharedValue(0);
  const full = useSharedValue(screen - insets.top - 8);
  const expanded = useSharedValue(false);
  const keyboardUp = useSharedValue(false);

  useEffect(() => {
    full.value = screen - insets.top - 8;
  }, [full, screen, insets.top]);
  useEffect(() => {
    keyboardUp.value = raised;
  }, [keyboardUp, raised]);

  /**
   * worklet 안에서 부를 JS 함수는 이렇게 한 겹 감싸서 넘긴다. `Keyboard.dismiss`를
   * 그대로 넘기면 worklet이 `Keyboard` 객체째 UI 스레드로 복사하려다 죽는다
   * ('Cannot copy value of type KeyboardImpl').
   */
  const dismissKeyboard = () => Keyboard.dismiss();

  const pan = Gesture.Pan()
    .onStart(() => {
      /** 자판이 떠 있으면 손잡이는 자판을 내리는 일만 한다 */
      if (keyboardUp.value) return;
      start.value = expanded.value ? full.value : natural.value;
      height.value = start.value;
      runOnJS(setSized)(true);
    })
    .onUpdate((e) => {
      if (keyboardUp.value) return;
      height.value = Math.max(
        0,
        Math.min(full.value, start.value - e.translationY),
      );
    })
    .onEnd((e) => {
      if (keyboardUp.value) {
        if (e.translationY > 10) runOnJS(dismissKeyboard)();
        return;
      }
      const now = start.value - e.translationY;
      const base = natural.value || 1;
      if (now < base * (1 - DISMISS_RATIO) || e.velocityY > FLING) {
        height.value = withTiming(0, { duration: 180 }, (done) => {
          if (done) runOnJS(onClose)();
        });
      } else if (now > (base + full.value) / 2 || e.velocityY < -FLING) {
        expanded.value = true;
        height.value = withTiming(full.value, { duration: 220 });
      } else {
        expanded.value = false;
        height.value = withTiming(base, { duration: 200 }, (done) => {
          if (done) runOnJS(setSized)(false);
        });
      }
    });

  const sizedStyle = useAnimatedStyle(() => ({ height: height.value }));
  const grow = raised || sized;

  return (
    <Animated.View
      entering={SlideInDown.duration(260)}
      exiting={SlideOutDown.duration(180)}
      onLayout={(e) => {
        if (!sized && !raised) natural.value = e.nativeEvent.layout.height;
      }}
      style={[
        styles.sheet,
        raised
          ? {
              top: insets.top + 8,
              bottom: keyboard,
              maxHeight: '100%',
              paddingBottom: 12,
            }
          : { paddingBottom: insets.bottom + 12 },
        !raised && sized ? sizedStyle : null,
        !raised && sized ? styles.unbounded : null,
      ]}
    >
      {/* 손잡이 — 막대보다 넓게 잡히도록 줄 전체가 잡는 자리다 */}
      <GestureDetector gesture={pan}>
        <View
          style={styles.handle}
          accessible
          accessibilityLabel="시트 높이 조절, 끝까지 내리면 닫기"
          accessibilityActions={[{ name: 'escape' }]}
          onAccessibilityEscape={onClose}
        >
          <View style={styles.grip} />
        </View>
      </GestureDetector>

      <ScrollView
        style={grow ? styles.scrollGrow : styles.scroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <TextInput
          value={sentence}
          onChangeText={onChangeSentence}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline
          scrollEnabled={false}
          accessibilityLabel="고른 문장, 눌러서 고치기"
          style={[styles.sentence, focused ? styles.sentenceFocused : null]}
        />

        <View style={styles.pageRow}>
          <PageIcon size={17} color={color.text.meta} />
          <AppText style={styles.pageLabel}>몇 쪽이에요?</AppText>
          <View style={[styles.pageBox, tooFar ? styles.pageBoxWarn : null]}>
            <PageInput
              value={page}
              onChangeValue={onChangePage}
              warn={tooFar}
            />
          </View>
        </View>
        {/* 버튼이 흐려진 이유는 버튼이 아니라 여기가 말한다 */}
        {tooFar ? (
          <AppText style={styles.hint}>이 책은 {maxPage}쪽까지예요.</AppText>
        ) : !page ? (
          <AppText style={styles.hint}>
            몇 쪽인지 적어야 담을 수 있어요.
          </AppText>
        ) : null}
      </ScrollView>

      <View style={styles.actions}>
        {/* 질문을 다 썼으면 묻는 대신 담아두고, 다음 달에 저절로 풀린다(ADR-0003) */}
        <ActionButton
          label={quotaLeft > 0 ? '이 문장 물어보기' : '문장만 담아두기'}
          variant={quotaLeft > 0 ? 'primary' : 'ink'}
          loading={asking}
          disabled={keeping || !ready}
          onPress={onAsk}
        />
        <ActionButton
          label="그냥 마음에 든 문장이에요"
          variant="subtle"
          loading={keeping}
          disabled={asking || !ready}
          onPress={onKeepOnly}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  /** 사진 위에 얹힌다 — 쪽은 그대로 있고 시트만 올라온다 */
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '72%',
    backgroundColor: color.surface.base,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 10,
    overflow: 'hidden',
  },
  /** 손으로 높이를 정하는 동안은 72% 상한을 푼다 — 끌어올리면 화면 위까지 */
  unbounded: { maxHeight: '100%' },
  handle: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  grip: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: color.fill.bold,
  },

  scroll: { flexGrow: 0 },
  /** 자란 시트에서는 남는 높이를 글이 다 쓴다 — 버튼은 맨 아래에 붙는다 */
  scrollGrow: { flex: 1 },
  body: { paddingHorizontal: gutter, paddingBottom: 6, gap: 12 },

  /**
   * 책의 글이라 고치는 중에도 세리프다. 가만히 있을 땐 글처럼 보이고, 누르면
   * 테두리가 서서 지금 고치고 있다는 것만 알린다.
   */
  sentence: {
    fontFamily: family.serif,
    fontSize: 18,
    lineHeight: 29,
    color: color.text.primary,
    padding: 10,
    marginHorizontal: -10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    textAlignVertical: 'top',
  },
  sentenceFocused: { borderColor: color.border.strong },

  pageRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pageLabel: { flex: 1, ...type.label2, color: color.text.secondary },
  pageBox: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 11,
    backgroundColor: color.primaryTint,
  },
  pageBoxWarn: { backgroundColor: color.fill.default },
  hint: { ...type.caption1, color: color.status.cautionary, marginTop: -4 },

  actions: { paddingHorizontal: gutter, paddingTop: 4, gap: 8 },
});
