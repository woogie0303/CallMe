import { useEffect, useState } from 'react';
import {
  Keyboard,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
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

import { color, gutter, type } from '@/shared/config';
import {
  ActionButton,
  AppText,
  HeartIcon,
  PageIcon,
  PageInput,
} from '@/shared/ui';
import { AskSentence, type SheetSentence } from './ask-sentence';

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
 * 고른 표현이 든 문장들이 올라오는 시트. 사진 아래 배지를 누르면 열린다. 여기서는
 * **물을지, 그냥 마음에 든 문장으로 둘지**만 고른다 — 고른 뒤 그 문장들이 사는 곳으로
 * 옮기는 일은 부르는 쪽(`app/scan.tsx`)이 한다.
 *
 * - **문장마다 카드 하나**(`AskSentence`). 누르면 바로 고치는 칸이 되고, 아래에
 *   고른 표현이 칩으로 선다.
 * - **여러 문장을 한 번에 묻고, 이번 달 질문은 한 번만 쓴다.** 그래서 버튼 위에
 *   '질문 1번'을 미리 말한다.
 * - **쪽수는 하나.** 사진 한 장이 한 쪽이다. 꼭, 그 책 안에서 — 나중에 이 문장을
 *   다시 찾을 때 붙잡을 곳이 쪽수뿐이고 진도도 그만큼 옮겨진다.
 * - **손잡이로 높이를 바꾼다.** 끌어올리면 화면 위까지 자라고, 원래 높이의
 *   35% 넘게 끌어내리면 닫혀서 찍은 쪽이 다시 보인다. 닫기 버튼(✕)은 그래서
 *   따로 두지 않는다.
 * - **자판이 올라오면 화면 위까지 자란다.** 이제 보여야 할 것은 사진이 아니라
 *   고치는 글과 쪽수다. 자판이 내려가면 원래 크기로 돌아온다.
 */
export function AskSheet({
  sentences,
  onChangeText,
  onRemovePick,
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
  sentences: SheetSentence[];
  onChangeText: (key: string, next: string) => void;
  onRemovePick: (from: number, to: number) => void;
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

  const typed = Number(page);
  const tooFar = Boolean(maxPage && typed > maxPage);
  const ready =
    typed > 0 &&
    !tooFar &&
    sentences.length > 0 &&
    sentences.every((sentence) => sentence.text.trim());
  /** 물으려면 문장마다 표현이 있고, 고친 문장에서 사라진 표현이 없어야 한다 */
  const askable =
    ready &&
    sentences.every(
      (sentence) =>
        sentence.picks.length > 0 &&
        sentence.picks.every((pick) => !pick.missing),
    );
  const many = sentences.length > 1;

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
        {sentences.map((sentence, i) => (
          <AskSentence
            key={sentence.key}
            sentence={sentence}
            index={i}
            onChangeText={(next) => onChangeText(sentence.key, next)}
            onRemovePick={onRemovePick}
          />
        ))}
      </ScrollView>

      {/*
        쪽수는 글 목록 밖에 고정한다. 문장이 길어 목록이 길어지면 맨 아래의 쪽수 칸이
        화면 밖으로 밀려나고, 누르면 자판에 가려져 무엇을 적는지 보이지 않았다.
      */}
      <View style={styles.pageArea}>
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
        ) : null}
      </View>

      <View style={styles.actions}>
        {/* 남아 있을 때는 말이 없다. 다 썼을 때만 버튼이 왜 '담아두기'인지 말한다 */}
        {quotaLeft === 0 && (
          <AppText style={styles.quota}>
            이번 달 질문을 다 썼어요. 문장은 담기고 다음 달 1일에 저절로 물어볼
            수 있어요.
          </AppText>
        )}
        {/*
          한 줄에 둘 — 넓은 쪽이 물어보기, 좁은 쪽(하트)이 '그냥 마음에 든 문장'. 위아래로
          쌓으면 둘이 같은 무게의 선택처럼 보였고, 시트가 그만큼 높아져 사진을 가렸다.
        */}
        <View style={styles.buttons}>
          {/* 질문을 다 썼으면 묻는 대신 담아두고, 다음 달에 저절로 풀린다(ADR-0003) */}
          <ActionButton
            label={
              quotaLeft > 0
                ? many
                  ? `${sentences.length}문장 물어보기`
                  : '이 문장 물어보기'
                : many
                  ? `${sentences.length}문장 담아두기`
                  : '문장만 담아두기'
            }
            variant={quotaLeft > 0 ? 'primary' : 'ink'}
            loading={asking}
            disabled={keeping || !askable}
            onPress={onAsk}
            style={styles.main}
          />
          <ActionButton
            label={
              many ? '그냥 마음에 든 문장들이에요' : '그냥 마음에 든 문장이에요'
            }
            icon={<HeartIcon size={22} color={color.primary} />}
            iconOnly
            variant="subtle"
            loading={keeping}
            disabled={asking || !ready}
            onPress={onKeepOnly}
            style={styles.side}
          />
        </View>
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

  pageArea: { paddingHorizontal: gutter, gap: 8 },
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
  buttons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  /** 넓은 쪽 — 이 시트가 하는 일은 묻는 것이다 */
  main: { flex: 1 },
  /** 좁은 쪽 — 하트 하나. 높이는 옆 버튼과 맞춘다 */
  side: { width: 56, height: 52 },
  quota: {
    ...type.caption1,
    color: color.text.meta,
    textAlign: 'center',
    marginBottom: 2,
  },
});
