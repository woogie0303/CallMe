import { useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCurrentBook } from "@/entities/book/api/book.api";
import { useTodayItem } from "@/entities/lexical-item/api/item.api";
import { READING_WEEK } from "@/entities/reading/model/mock";
import { color } from "@/shared/config";
import { AddButton } from "@/shared/ui";
import { BookHero } from "@/widgets/book-hero/ui/book-hero";
import { ReadingWeekChart } from "@/widgets/reading-week/ui/reading-week";
import { TodayItem } from "@/widgets/today-item/ui/today-item";

/**
 * 01 홈 — 읽고 있는 책 · 이번 주 · 오늘의 표현.
 *
 * 스크롤이 없다. 위의 둘은 제 내용 높이만 쓰고 사이 여백도 좁게 고정한다 —
 * 여백에 남는 높이를 나눠 주면 판들이 서로 상관없는 것처럼 흩어진다.
 *
 * 책을 한 권 더 놓는 자리는 읽고 있는 책 바로 아래다 — 책에 대고 하는 일이라
 * 책 옆에 선다.
 *
 * 오늘의 표현은 작은 카드 그대로 둔다. 문장까지 넣어 키워 봤지만 홈에서는
 * 그만큼이 도로 빈자리가 됐다 — 문장을 읽는 자리는 눌러서 들어가는 항목
 * 상세이고, 홈이 할 일은 오늘 이걸 다시 볼 이유 한 줄을 대는 것까지다.
 */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: reading, isPending } = useCurrentBook();
  const { today } = useTodayItem();
  const book = reading?.book;

  const openBook = () => {
    if (book) router.push({ pathname: "/book/[id]", params: { id: book.id } });
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 6 }]}>
      <View style={styles.stack}>
        {isPending ? (
          <ActivityIndicator style={styles.spinner} color={color.text.assistive} />
        ) : book && reading ? (
          <BookHero
            book={book}
            progress={{
              bookId: book.id,
              currentPage: reading.progress.currentPage,
              totalPages: reading.progress.pages ?? 0,
              chapter: "",
              startedLabel: "",
              lastReadLabel: reading.progress.lastReadAt
                ? "최근에 읽었어요"
                : "아직 펴지 않았어요",
            }}
            onPressBook={openBook}
            onAsk={() => router.push("/ask")}
            onCapture={() => router.push("/scan")}
          />
        ) : null}
        <AddButton
          label="읽고 있는 책 추가"
          style={styles.add}
          onPress={() => router.push("/book-add")}
        />
        <ReadingWeekChart week={READING_WEEK} />
        {today ? (
          <TodayItem
            style={styles.add2}
            item={today}
            onPress={() =>
              router.push({ pathname: "/item/[id]", params: { id: today.id } })
            }
          />
        ) : null}
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
  spinner: { paddingVertical: 60 },
  /** 위에서부터 좁게 붙여 쌓는다. 남는 높이는 '책 추가'가 받는다. */
  stack: { flex: 1, gap: 14, paddingBottom: 12 },
  /**
   * 남는 높이의 대부분(5/6)을 이 자리가 가져간다. 전부 가져가면 점선이 화면을
   * 눌러 다른 판들이 딸려 보였다. 높이를 못 박지 않고 비율로 둔 이유는, 화면이
   * 작은 기기에서는 이 자리도 같이 줄어야 하기 때문이다.
   */
  add: { flex: 1 },
  add2: { flex: 0.5 },
});
