import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, gutter } from '@/shared/config';
import { DisclosureRow, ScreenHeader } from '@/shared/ui';

/**
 * 책을 서가에 들이는 첫걸음 — 찾아서 넣을지, 손으로 적어 넣을지.
 *
 * 곧장 손 입력 화면으로 보내지 않는 이유는, 검색이 되는 책은 표지와 쪽수까지
 * 한 번에 들어와서 손으로 옮겨 적을 일이 없기 때문이다. 검색에 없는 책만
 * 손으로 적으면 된다 — 둘 중 하나를 고르는 이 화면이 그 갈림길이다.
 */
export default function BookPickScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom + 12 }]}>
      <ScreenHeader leading="close" onLeadingPress={() => router.back()} title="책 추가" />

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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surface.base },
  options: { paddingHorizontal: gutter, paddingTop: 8, gap: 10 },
});
