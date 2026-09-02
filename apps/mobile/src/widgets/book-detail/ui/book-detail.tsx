import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Book } from '@/entities/book/model/types';
import { BookCover } from '@/entities/book/ui/book-cover';
import { itemsFromBook, likedSentencesOf } from '@/entities/lexical-item/lib/select';
import type { ReadingProgress } from '@/entities/reading/model/mock';
import { RETELL_SESSION } from '@/entities/retell/model/mock';
import { color, shadow, type } from '@/shared/config';
import { AppText, ProgressBar } from '@/shared/ui';
import { ItemShelf } from '@/widgets/item-shelf/ui/item-shelf';
import { SentenceShelf } from '@/widgets/sentence-shelf/ui/sentence-shelf';
import { BookRetell } from './book-retell';
import { BookTabs, type BookTab } from './book-tabs';

/**
 * 책 한 권. 읽은 데까지의 기록에 더해, **그냥 마음에 들어서 담아둔 문장**이
 * 여기에 산다 — 어휘 항목이 없는 문장은 서랍에 걸릴 데가 없기 때문이다. (Q25)
 *
 * 그 문장들과 리텔링은 탭으로 갈라 놓는다. 둘 다 이 책에 대고 한 일이지만
 * 성격이 반대다 — 하나는 책이 나에게 남긴 것이고 하나는 내가 책에 대고 쓴
 * 것이라, 위아래로 이어 붙이면 어느 쪽도 제대로 읽히지 않는다.
 * 리텔링이 탭 바에서 내려온 것도 이 때문이다 — 옮겨 적는 일에는 언제나
 * 책과 챕터가 딸려 있고, 그 자리는 여기다.
 */
export function BookDetail({
  book,
  progress,
  onOpenItem,
  onOpenRetell,
}: {
  book: Book;
  progress?: ReadingProgress;
  onOpenItem?: (id: string) => void;
  onOpenRetell?: () => void;
}) {
  const [tab, setTab] = useState<BookTab>('liked');
  const items = itemsFromBook(book.id);
  const liked = likedSentencesOf(book.id);
  const session = RETELL_SESSION.bookId === book.id ? RETELL_SESSION : undefined;
  const ratio = progress ? progress.currentPage / progress.totalPages : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <BookCover
          book={book}
          width={96}
          height={136}
          radius={12}
          titleSize={13}
          style={shadow.cover}
        />
        <View style={styles.meta}>
          <AppText style={styles.title}>{book.title}</AppText>
          <AppText style={styles.author}>{book.author}</AppText>
          {progress ? (
            <View style={styles.progress}>
              <ProgressBar value={ratio} track={color.fill.bold} />
              <AppText style={styles.progressLabel}>
                p.{progress.currentPage} / {progress.totalPages} · {Math.round(ratio * 100)}%
              </AppText>
            </View>
          ) : (
            <AppText style={styles.progressLabel}>{book.pages}p</AppText>
          )}
        </View>
      </View>

      {items.length ? (
        <ItemShelf items={items} onPressItem={onOpenItem} />
      ) : (
        <AppText style={styles.empty}>아직 이 책에서 담은 표현이 없어요.</AppText>
      )}

      <View style={styles.tabs}>
        <BookTabs value={tab} onChange={setTab} likedCount={liked.length} />
        {tab === 'liked' ? (
          liked.length ? (
            <SentenceShelf sentences={liked} title={null} />
          ) : (
            <AppText style={styles.empty}>
              뜻을 몰라서가 아니라 그냥 좋아서 담아둔 문장이 여기 모여요.
            </AppText>
          )
        ) : (
          <BookRetell session={session} onOpen={onOpenRetell} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 22 },
  tabs: { gap: 16 },
  head: { flexDirection: 'row', gap: 16 },
  meta: { flex: 1, gap: 6, paddingTop: 4, minWidth: 0 },
  title: { ...type.heading2, fontWeight: '700', color: color.text.primary, letterSpacing: -0.4 },
  author: { ...type.label2, color: color.text.secondary },
  progress: { gap: 6, marginTop: 'auto' },
  progressLabel: { ...type.caption2, color: color.text.meta },
  empty: { ...type.label2, color: color.text.assistive },
});
