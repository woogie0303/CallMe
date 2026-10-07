import type { ReactNode } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, gutter, ink } from '../config';
import { Tap } from './pressable-row';

/**
 * 바닥에서 올라오는 고르기 시트 — 고를 것이 두셋뿐일 때.
 *
 * 화면을 다 차지하지 않는다. 고를 것이 둘뿐인데 꽉 찬 창으로 띄우면 아래가
 * 통째로 비고, 그 빈자리가 '여기 뭔가 더 있어야 하는데 안 왔다'처럼 읽힌다.
 * 제 높이만 쓰는 시트로 올라오고, 나가는 길은 바깥을 누르는 것이다 — 닫기
 * 단추를 따로 세우지 않는 이유가 그것이다.
 *
 * 책 추가(`app/book-pick`)와 책 화면의 ⋮이 같은 모양을 쓴다. 한동안 ⋮은 iOS
 * 기본 액션 시트였는데, 같은 앱 안에서 '고르기'가 두 모양으로 보였다.
 */
export function SheetPanel({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Animated.View
      entering={SlideInDown.duration(240)}
      exiting={SlideOutDown.duration(160)}
      style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
    >
      <View style={styles.options}>{children}</View>
    </Animated.View>
  );
}

/**
 * 바깥이 곧 닫기다. 눈에는 그림자일 뿐이지만 스크린 리더에는 단추여야
 * 한다 — 닫기 표시가 없으니 여기 말고는 나갈 길을 읽어줄 데가 없다.
 */
export function SheetBackdrop({
  onClose,
  hint,
}: {
  onClose: () => void;
  hint?: string;
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      style={StyleSheet.absoluteFill}
    >
      <Tap
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="닫기"
        accessibilityHint={hint}
      />
    </Animated.View>
  );
}

/** 화면 안에서 띄우는 시트 — 라우트로 두지 않아도 될 때(책 화면의 ⋮) */
export function OptionSheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {visible ? (
          <>
            <SheetBackdrop onClose={onClose} />
            <SheetPanel>{children}</SheetPanel>
          </>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  /** 시트를 바닥에 붙이고, 남는 곳은 전부 '바깥'이 된다 */
  root: { flex: 1, justifyContent: 'flex-end', backgroundColor: ink(0.4) },
  /** 높이를 주지 않는다 — 안에 든 것만큼만 쓴다 */
  sheet: {
    backgroundColor: color.surface.base,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 14,
    gap: 12,
  },
  options: { paddingHorizontal: gutter, gap: 10 },
});
