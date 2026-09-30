import { StyleSheet, View } from 'react-native';

import type { Book } from '@/entities/book/model/types';
import { CoverThumb } from '@/entities/book/ui/cover-thumb';
import { color, type } from '@/shared/config';
import { AppText, Quote, Tap } from '@/shared/ui';

/** 한 줄에 필요한 것 전부. 책은 찾아 나서지 않고 받아 쓴다. */
export type PendingRow = {
  id: string;
  text: string;
  page?: number;
  capturedLabel: string;
  /** 왜 기다리는지 — 서버가 준 말을 그대로 보여준다 */
  reason: string;
  book?: Book;
};

/** 답을 기다리는 문장들. 실패가 아니라 대기라서 오류처럼 보이지 않게 둔다. */
export function PendingList({
  asks,
  onPressAsk,
}: {
  asks: PendingRow[];
  onPressAsk?: (id: string) => void;
}) {
  return (
    <View style={styles.list}>
      {asks.map((ask) => {
        const book = ask.book;
        return (
          <Tap
            key={ask.id}
            style={styles.card}
            onPress={() => onPressAsk?.(ask.id)}
          >
            {book ? <CoverThumb book={book} style={styles.thumb} /> : null}
            <View style={styles.body}>
              <Quote style={styles.text}>{ask.text}</Quote>
              <View style={styles.foot}>
                <AppText style={styles.source}>
                  {book ? `${book.title} · p.${ask.page}` : '책 미정'}
                </AppText>
                <AppText style={styles.reason}>
                  {ask.capturedLabel} · {ask.reason}
                </AppText>
              </View>
            </View>
          </Tap>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    backgroundColor: color.surface.base,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border.subtle,
    overflow: 'hidden',
  },
  thumb: { marginTop: 14, marginLeft: 14 },
  body: {
    flex: 1,
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 14,
    minWidth: 0,
  },
  text: { fontSize: 15, lineHeight: 23, color: color.text.body },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  source: { ...type.caption2, color: color.text.meta },
  reason: { ...type.caption2, color: color.text.assistive },
});
