import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useReadingBooks } from '@/entities/book/api/book.api';
import { useTodayItem } from '@/entities/lexical-item/api/item.api';
import { useReadingWeek } from '@/entities/reading/api/reading.api';
import { color, gutter } from '@/shared/config';
import { savedLabel } from '@/shared/lib/date';
import { ActionButton, EmptyState } from '@/shared/ui';
import { BookHero } from '@/widgets/book-hero/ui/book-hero';
import { ReadingShelf } from '@/widgets/reading-shelf/ui/reading-shelf';
import { ReadingWeekChart } from '@/widgets/reading-week/ui/reading-week';
import { TodayItem } from '@/widgets/today-item/ui/today-item';

/**
 * 01 홈 — 읽고 있는 책 · 이번 주 · 오늘의 표현.
 *
 * 스크롤이 있다. 한때 없었는데, 판 넷의 높이를 다 더하면 작은 기기(iPhone SE)
 * 화면보다 길어서 오늘의 표현이 잘린 채로 닿을 수 없었다 — 화면에 맞춰 판을
 * 줄이는 대신 넘치면 흐르게 둔다.
 *
 * 왼쪽 선은 하나뿐이다. 판마다 제 여백을 갖고 있던 탓에 글이 32·20·32·26에서
 * 제각각 시작했는데, 그게 홈이 어수선해 보이던 진짜 이유였다. 이제 여백은
 * 화면이 한 번만 주고(20), 판들은 그 선 위에 그대로 선다. 책 화면(`book/[id]`)이
 * 같은 `BookHero`를 같은 방식으로 세우는 것과도 이걸로 맞는다.
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

  const openBook = (id: string) => router.push({ pathname: '/book/[id]', params: { id } });

  return (
    <ScrollView
      style={[styles.screen, { paddingTop: insets.top + 6 }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {isPending ? (
        <ActivityIndicator style={styles.spinner} color={color.text.assistive} />
      ) : book && reading ? (
        <>
          <BookHero
            book={book}
            inset={0}
            progress={{
              bookId: book.id,
              currentPage: reading.progress.currentPage,
              totalPages: reading.progress.pages ?? 0,
              lastReadLabel: reading.progress.lastReadAt
                ? `${savedLabel(reading.progress.lastReadAt)}에 읽었어요`
                : undefined,
            }}
            onPressBook={() => openBook(book.id)}
            onPressProgress={() =>
              router.push({ pathname: '/progress', params: { bookId: book.id } })
            }
            onAsk={() => router.push('/ask')}
            onCapture={() => router.push('/scan')}
          />
          <ReadingShelf
            books={others}
            onPressBook={openBook}
            onAdd={() => router.push('/book-pick')}
          />
          {week ? <ReadingWeekChart week={week} /> : null}
          {today ? (
            <TodayItem
              item={today}
              onPress={() => router.push({ pathname: '/item/[id]', params: { id: today.id } })}
            />
          ) : null}
        </>
      ) : (
        /* 책이 한 권도 없으면 선반만 덩그러니 두지 않는다 — 여기서 할 일은 하나다 */
        <View style={styles.blank}>
          <EmptyState
            mark="quiet"
            title="아직 읽고 있는 책이 없어요"
            body="읽던 원서를 한 권 들이면, 막힌 문장을 여기서 바로 물어볼 수 있어요."
          />
          <ActionButton label="책 추가하기" onPress={() => router.push('/book-pick')} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.surface.base,
  },
  /** 여백은 여기서 한 번만 준다. 판들은 이 선 위에 그대로 선다. */
  content: {
    paddingHorizontal: gutter,
    paddingBottom: 24,
    gap: 22,
  },
  spinner: { paddingVertical: 60 },
  blank: { paddingTop: 24, gap: 8 },
});
