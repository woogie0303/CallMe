import { StyleSheet, View } from 'react-native';

import type { PendingAsk } from '@/entities/ask/model/types';
import { bookById } from '@/entities/book/model/mock';
import { SpineEdge } from '@/entities/book/ui/spine-edge';
import { color, type } from '@/shared/config';
import { AppText, Quote, Tap } from '@/shared/ui';

/** 답을 기다리는 문장들. 실패가 아니라 대기라서 오류처럼 보이지 않게 둔다. */
export function PendingList({
  asks,
  onPressAsk,
}: {
  asks: PendingAsk[];
  onPressAsk?: (id: string) => void;
}) {
  return (
    <View style={styles.list}>
      {asks.map((ask) => {
        const book = ask.bookId ? bookById(ask.bookId) : undefined;
        return (
          <Tap key={ask.id} style={styles.card} onPress={() => onPressAsk?.(ask.id)}>
            {book ? <SpineEdge book={book} /> : null}
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
  body: { flex: 1, gap: 8, paddingVertical: 14, paddingHorizontal: 14, minWidth: 0 },
  text: { fontSize: 15, lineHeight: 23, color: color.text.body },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  source: { ...type.caption2, color: color.text.meta },
  reason: { ...type.caption2, color: color.text.assistive },
});
