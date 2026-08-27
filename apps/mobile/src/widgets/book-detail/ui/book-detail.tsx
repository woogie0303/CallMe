import { StyleSheet, View } from 'react-native';

import type { Book } from '@/entities/book/model/types';
import { BookCover } from '@/entities/book/ui/book-cover';
import { itemsFromBook, likedSentencesOf } from '@/entities/lexical-item/lib/select';
import type { ReadingProgress } from '@/entities/reading/model/mock';
import { color, shadow, type } from '@/shared/config';
import { AppText, ProgressBar } from '@/shared/ui';
import { ItemShelf } from '@/widgets/item-shelf/ui/item-shelf';
import { SentenceShelf } from '@/widgets/sentence-shelf/ui/sentence-shelf';

/**
 * 책 한 권. 읽은 데까지의 기록에 더해, **그냥 마음에 들어서 담아둔 문장**이
 * 여기에 산다 — 어휘 항목이 없는 문장은 서랍에 걸릴 데가 없기 때문이다. (Q25)
 */
export function BookDetail({
  book,
  progress,
  onOpenItem,
}: {
  book: Book;
  progress?: ReadingProgress;
  onOpenItem?: (id: string) => void;
}) {
  const items = itemsFromBook(book.id);
  const liked = likedSentencesOf(book.id);
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
        <ItemShelf
          items={items}
          total={items.length}
          title="이 책에서 담은 표현"
          onPressItem={onOpenItem}
        />
      ) : null}

      {liked.length ? (
        <SentenceShelf
          sentences={liked}
          title="마음에 들었던 문장"
          aside={`${liked.length}개`}
        />
      ) : null}

      {!items.length && !liked.length ? (
        <AppText style={styles.empty}>아직 이 책에서 담아둔 게 없어요.</AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 22 },
  head: { flexDirection: 'row', gap: 16 },
  meta: { flex: 1, gap: 6, paddingTop: 4, minWidth: 0 },
  title: { ...type.heading2, fontWeight: '700', color: color.text.primary, letterSpacing: -0.4 },
  author: { ...type.label2, color: color.text.secondary },
  progress: { gap: 6, marginTop: 'auto' },
  progressLabel: { ...type.caption2, color: color.text.meta },
  empty: { ...type.label2, color: color.text.assistive },
});
