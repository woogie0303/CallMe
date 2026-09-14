import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Book } from '@/entities/book/model/types';
import { useItems } from '@/entities/lexical-item/api/item.api';
import type { ReadingProgress } from '@/entities/reading/model/types';
import { useRetells } from '@/entities/retell/api/retell.api';
import { useLikedSentences } from '@/entities/sentence/api/sentence.api';
import { EmptyState } from '@/shared/ui';
import { BookHero } from '@/widgets/book-hero/ui/book-hero';
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
 *
 * 머리는 홈의 '읽고 있는 책'과 같은 판(`widgets/book-hero`)을 쓴다. 홈에서
 * 누르고 들어온 그 책이 여기서 다른 모양으로 서 있으면, 같은 책에 도착했다는
 * 느낌이 끊긴다.
 */
export function BookDetail({
  book,
  progress,
  onOpenItem,
  onOpenRetell,
  onAsk,
  onCapture,
}: {
  book: Book;
  progress?: ReadingProgress;
  onOpenItem?: (id: string) => void;
  onOpenRetell?: () => void;
  /** 지금 읽고 있는 책일 때만 넘어온다 — 아닌 책에 대고 물을 일이 없다 */
  onAsk?: () => void;
  onCapture?: () => void;
}) {
  const [tab, setTab] = useState<BookTab>('liked');
  const { data: items = [] } = useItems({ bookId: book.id });
  const { data: sentences = [] } = useLikedSentences(book.id);
  const { data: retells = [] } = useRetells(book.id);
  /** 가장 최근에 옮겨 적은 챕터 하나만 보여준다 — 목록은 리텔링 화면의 일이다 */
  const session = retells[0];
  const liked = sentences.map((sentence) => ({
    id: sentence._id,
    text: sentence.text,
    page: sentence.page,
    book,
  }));

  return (
    <View style={styles.wrap}>
      <BookHero book={book} progress={progress} inset={0} onAsk={onAsk} onCapture={onCapture} />

      {items.length ? (
        <ItemShelf items={items} onPressItem={onOpenItem} />
      ) : (
        <EmptyState
          mark="drawer"
          compact
          title="아직 이 책에서 담은 표현이 없어요"
        />
      )}

      <View style={styles.tabs}>
        <BookTabs value={tab} onChange={setTab} likedCount={liked.length} />
        {tab === 'liked' ? (
          liked.length ? (
            <SentenceShelf sentences={liked} title={null} />
          ) : (
            <EmptyState
              mark="sentence"
              compact
              title="아직 마음에 든 문장이 없어요"
              body="뜻을 몰라서가 아니라 그냥 좋아서 담아둔 문장이 여기 모여요."
            />
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
});
