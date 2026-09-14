import { useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useReadingBooks } from "@/entities/book/api/book.api";
import { useTodayItem } from "@/entities/lexical-item/api/item.api";
import { useReadingWeek } from "@/entities/reading/api/reading.api";
import { color } from "@/shared/config";
import { ReadingShelf } from "@/widgets/reading-shelf/ui/reading-shelf";
import { BookHero } from "@/widgets/book-hero/ui/book-hero";
import { ReadingWeekChart } from "@/widgets/reading-week/ui/reading-week";
import { TodayItem } from "@/widgets/today-item/ui/today-item";

/**
 * 01 홈 — 읽고 있는 책 · 이번 주 · 오늘의 표현.
 *
 * 스크롤이 없다. 위의 둘은 제 내용 높이만 쓰고 사이 여백도 좁게 고정한다 —
 * 여백에 남는 높이를 나눠 주면 판들이 서로 상관없는 것처럼 흩어진다.
 *
 * 읽고 있는 책이 여럿이면 맨 위에 한 권이 크게 서고 나머지는 그 아래 줄에 선다.
 * 책을 새로 들여도 맨 위가 바뀌지 않는다 — 그 자리는 가장 최근에 읽은 책의
 * 것이고, 등록이 아니라 진도를 옮길 때 바뀐다.
 *
 * 오늘의 표현은 작은 카드 그대로 둔다. 문장까지 넣어 키워 봤지만 홈에서는
 * 그만큼이 도로 빈자리가 됐다 — 문장을 읽는 자리는 눌러서 들어가는 항목
 * 상세이고, 홈이 할 일은 오늘 이걸 다시 볼 이유 한 줄을 대는 것까지다.
 */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: shelf, isPending } = useReadingBooks();
  /** 맨 위에 크게 서는 한 권과, 그 아래 줄에 서는 나머지 */
  const reading = shelf?.[0];
  const others = (shelf?.slice(1) ?? []).map((row) => row.book);
  const { data: week } = useReadingWeek();
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
            onPressProgress={() =>
              router.push({ pathname: "/progress", params: { bookId: book.id } })
            }
            onAsk={() => router.push("/ask")}
            onCapture={() => router.push("/scan")}
          />
        ) : null}
        <ReadingShelf
          books={others}
          onPressBook={(id) => router.push({ pathname: "/book/[id]", params: { id } })}
          onAdd={() => router.push("/book-add")}
        />
        {week ? <ReadingWeekChart week={week} /> : null}
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
  /** 위에서부터 좁게 붙여 쌓는다. 남는 높이는 화면 아래에 그대로 둔다. */
  stack: { flex: 1, gap: 14, paddingBottom: 12 },
  add2: { flex: 0.5 },
});
