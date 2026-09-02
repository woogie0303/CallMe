import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { bookById } from '@/entities/book/model/mock';
import { latestEncounter, todayItem } from '@/entities/lexical-item/lib/select';
import { CURRENT_READING, READING_WEEK } from '@/entities/reading/model/mock';
import { color } from '@/shared/config';
import { SearchTile } from '@/shared/ui';
import { BookHero } from '@/widgets/book-hero/ui/book-hero';
import { ReadingWeekChart } from '@/widgets/reading-week/ui/reading-week';
import { TodayItem } from '@/widgets/today-item/ui/today-item';

/**
 * 01 홈 — 읽고 있는 책 · 이번 주 · 오늘의 표현과 검색.
 *
 * 스크롤이 없다. 판은 저마다 제 내용 높이만 쓰고, 사이 여백도 좁게 고정한다 —
 * 남는 높이를 판에 먹이면 그 안이 텅 빈 채로 벌어지고, 여백에 나눠 주면 셋이
 * 서로 상관없는 것처럼 흩어진다. 남는 높이는 화면 아래에 그대로 둔다.
 *
 * 오늘의 표현과 검색은 한 줄에 나란히 선다. 위아래로 쌓으면 판이 넷이 되어
 * 홈이 목록처럼 보이고, 검색은 한 줄을 통째로 차지할 만큼 자주 쓰는 자리도
 * 아니다. 좁아진 자리에서는 아이콘 타일이 입력창보다 정직하다.
 */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const book = bookById(CURRENT_READING.bookId);
  const today = todayItem();
  /** 그 표현을 마지막으로 만난 책 — 카드 왼쪽 엣지가 이 색을 물려받는다 */
  const todayBook = today ? latestEncounter(today)?.book : undefined;
  if (!book) return null;

  const openBook = () =>
    router.push({ pathname: '/book/[id]', params: { id: book.id } });

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 6 }]}>
      <View style={styles.stack}>
        <BookHero
          book={book}
          progress={CURRENT_READING}
          onPressBook={openBook}
          onAsk={() => router.push('/ask')}
          onCapture={() => router.push('/scan')}
        />
        <ReadingWeekChart week={READING_WEEK} />
        <View style={[styles.row, today ? null : styles.rowSolo]}>
          {today ? (
            <TodayItem
              item={today}
              book={todayBook}
              onPress={() =>
                router.push({ pathname: '/item/[id]', params: { id: today.id } })
              }
            />
          ) : null}
          <SearchTile
            style={today ? undefined : styles.soleTile}
            onPress={() => router.push('/book-confirm')}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.surface.base,
    paddingHorizontal: 12,
  },
  /** 위에서부터 좁게 붙여 쌓는다. 남는 높이는 화면 아래에 그대로 둔다. */
  stack: { flex: 1, gap: 14, paddingBottom: 12 },
  /** 높이는 여기서 못 박는다 — 두 타일이 같은 키로 서야 한 줄로 읽힌다 */
  row: { flexDirection: 'row', alignItems: 'stretch', gap: 10, height: 96 },
  /** 오늘의 표현이 없는 날엔 검색이 줄을 다 쓰고, 줄도 그만큼 낮아진다 */
  rowSolo: { height: 54 },
  soleTile: { width: undefined, flex: 1, flexDirection: 'row', gap: 8 },
});
