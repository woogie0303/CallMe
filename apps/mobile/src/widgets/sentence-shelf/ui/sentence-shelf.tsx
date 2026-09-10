import { StyleSheet, View } from 'react-native';

import type { Book } from '@/entities/book/model/types';
import { BookSpine } from '@/entities/book/ui/book-spine';
import { color, type } from '@/shared/config';
import { AppText, Quote, SectionHeader, Tap } from '@/shared/ui';

/**
 * 문장 목록. 왼쪽 책등 색이 라벨을 대신하고,
 * 원문은 세리프로, 출처는 산세리프로 적힌다.
 * 책 화면에서 '그냥 마음에 든 문장'을 보여줄 때도 이걸 쓴다.
 */
/** 한 줄에 필요한 것 전부. 어느 책인지는 부르는 쪽이 이미 안다. */
export type SentenceRow = {
  id: string;
  text: string;
  page?: number;
  book?: Book;
};

export function SentenceShelf({
  sentences,
  title = '다시 볼 문장',
  aside,
  onPressSentence,
}: {
  sentences: SentenceRow[];
  /** null이면 제목을 그리지 않는다 — 탭 라벨이 이미 이름을 대고 있을 때 */
  title?: string | null;
  aside?: string;
  onPressSentence?: (id: string) => void;
}) {
  return (
    <View style={styles.wrap}>
      {title !== null ? <SectionHeader title={title} aside={aside} /> : null}
      {sentences.map((s) => {
        const book = s.book;
        return (
          <Tap key={s.id} style={styles.row} onPress={() => onPressSentence?.(s.id)}>
            {book ? <BookSpine book={book} /> : null}
            <View style={styles.body}>
              <Quote numberOfLines={2} style={styles.text}>
                {s.text}
              </Quote>
              <AppText style={styles.source}>
                {book ? `${book.title} · ` : ''}p.{s.page}
              </AppText>
            </View>
          </Tap>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: color.surface.alt,
  },
  body: { flex: 1, gap: 4, minWidth: 0 },
  text: { fontSize: 14, lineHeight: 19, color: color.text.primary },
  source: { ...type.caption2, color: color.text.meta },
});
