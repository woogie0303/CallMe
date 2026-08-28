import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { bookById } from "@/entities/book/model/mock";
import { CURRENT_READING, READING_WEEK } from "@/entities/reading/model/mock";
import { color, type } from "@/shared/config";
import { SearchField } from "@/shared/ui";
import { ReadingHero } from "@/widgets/reading-hero/ui/reading-hero";
import { ReadingWeekChart } from "@/widgets/reading-week/ui/reading-week";

/**
 * 01 홈 — 판 셋을 위아래로 쌓아 화면을 꽉 채운다.
 *
 * 스크롤이 없다. 판은 저마다 제 내용 높이만 쓰고, 화면 높이에 맞추려고 늘리지
 * 않는다 — 채울 것이 없는 판을 늘리면 그만큼이 빈자리가 된다. 남는 높이는
 * 판들 사이에 나누지 않고 화면 아래에 그대로 둔다.
 */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const book = bookById(CURRENT_READING.bookId);
  if (!book) return null;

  const openBook = () =>
    router.push({ pathname: "/book/[id]", params: { id: book.id } });

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 6 }]}>
      <View style={styles.stack}>
        <ReadingHero
          book={book}
          progress={CURRENT_READING}
          onPressBook={openBook}
          onAsk={() => router.push("/ask")}
          onCapture={() => router.push("/scan")}
        />
        <ReadingWeekChart week={READING_WEEK} />
        <SearchField onPress={() => router.push("/book-confirm")} />
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
  wordmark: {
    ...type.title2,
    fontSize: 26,
    letterSpacing: -0.78,
    color: color.text.primary,
    paddingHorizontal: 8,
    paddingBottom: 14,
  },
  /** 판은 위에서부터 제 높이만큼 쌓인다. 남는 높이는 화면 아래에 그대로 둔다. */
  stack: { flex: 1, gap: 10, paddingBottom: 12 },
});
