import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, gutter, ink, type } from '@/shared/config';
import { AppText, DisclosureRow, Tap } from '@/shared/ui';

/**
 * 책을 서가에 들이는 첫걸음 — 찾아서 넣을지, 손으로 적어 넣을지.
 *
 * 곧장 손 입력 화면으로 보내지 않는 이유는, 검색이 되는 책은 표지와 쪽수까지
 * 한 번에 들어와서 손으로 옮겨 적을 일이 없기 때문이다. 검색에 없는 책만
 * 손으로 적으면 된다 — 둘 중 하나를 고르는 이 화면이 그 갈림길이다.
 *
 * 화면을 다 차지하지 않는다. 고를 것이 둘뿐인데 꽉 찬 모달로 띄우면 아래가
 * 통째로 비고, 그 빈자리가 '여기 뭔가 더 있어야 하는데 안 왔다'처럼 읽힌다.
 * 제 높이만 쓰는 시트로 올라오고, 나가는 길은 바깥을 누르는 것이다 — 닫기
 * 단추를 따로 세우지 않아도 되는 이유가 그것이고, 그래서 아래로 쓸어내려도
 * 같은 일이 일어난다.
 */
export default function BookPickScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const close = () => router.back();

  return (
    <View style={styles.root}>
      {/*
        바깥이 곧 닫기다. 눈에는 그림자일 뿐이지만 스크린 리더에는 단추여야
        한다 — 닫기 표시를 지웠으니 여기 말고는 나갈 길을 읽어줄 데가 없다.
      */}
      <Animated.View entering={FadeIn.duration(180)} style={StyleSheet.absoluteFill}>
        <Tap
          style={StyleSheet.absoluteFill}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="닫기"
          accessibilityHint="책 추가 창을 닫아요"
        />
      </Animated.View>

      <Animated.View
        entering={SlideInDown.duration(240)}
        exiting={SlideOutDown.duration(160)}
        style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.grip} />
        <AppText style={styles.title}>책 추가</AppText>

        <View style={styles.options}>
          <DisclosureRow
            icon="search"
            title="책 찾아서 넣기"
            body="제목이나 지은이로 찾아요. 표지와 쪽수가 함께 들어와요."
            onPress={() => router.push('/book-search')}
          />
          <DisclosureRow
            icon="write"
            title="직접 입력하기"
            body="검색에 없는 책이거나, 손으로 적는 게 더 빠를 때예요."
            onPress={() => router.replace('/book-add')}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  /** 시트를 바닥에 붙이고, 남는 곳은 전부 '바깥'이 된다 */
  root: { flex: 1, justifyContent: 'flex-end', backgroundColor: ink(0.32) },
  /** 높이를 주지 않는다 — 안에 든 것만큼만 쓴다 */
  sheet: {
    backgroundColor: color.surface.base,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    gap: 12,
  },
  /** 닫기 표시 대신 여기가 '내릴 수 있다'고 말한다 */
  grip: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: color.fill.bold,
  },
  title: { ...type.label2, fontWeight: '600', color: color.text.meta, textAlign: 'center' },
  options: { paddingHorizontal: gutter, gap: 10 },
});
