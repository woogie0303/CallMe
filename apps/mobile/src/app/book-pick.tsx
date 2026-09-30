import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ink } from '@/shared/config';
import { DisclosureRow, SheetBackdrop, SheetPanel } from '@/shared/ui';

/**
 * 책을 서가에 들이는 첫걸음 — 찾아서 넣을지, 손으로 적어 넣을지.
 *
 * 곧장 손 입력 화면으로 보내지 않는 이유는, 검색이 되는 책은 표지와 쪽수까지
 * 한 번에 들어와서 손으로 옮겨 적을 일이 없기 때문이다. 검색에 없는 책만
 * 손으로 적으면 된다 — 둘 중 하나를 고르는 이 화면이 그 갈림길이다.
 *
 * 모양은 `shared/ui/sheet`가 정한다 — 책 화면의 ⋮도 같은 시트를 쓴다.
 */
export default function BookPickScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <SheetBackdrop onClose={() => router.back()} hint="책 추가 창을 닫아요" />

      {/*
        둘 다 push가 아니라 replace다 — push로 다음 화면을 쌓으면 이 시트는
        그 밑에 그대로 남아, 다음 화면에서 뒤로 가면 다시 떠오른다. 고른 순간
        이 시트는 할 일을 다 한 것이라 스택에서 지운다.
      */}
      <SheetPanel>
        <DisclosureRow
          icon="search"
          title="책 검색하기"
          body="제목이나 지은이로 찾아요. 표지와 쪽수가 함께 들어와요."
          onPress={() => router.replace('/book-search')}
        />
        <DisclosureRow
          icon="write"
          title="직접 입력하기"
          body="검색에 없는 책이거나, 손으로 적는 게 더 빠를 때예요."
          onPress={() => router.replace('/book-add')}
        />
      </SheetPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  /** 시트를 바닥에 붙이고, 남는 곳은 전부 '바깥'이 된다 */
  root: { flex: 1, justifyContent: 'flex-end', backgroundColor: ink(0.4) },
});
