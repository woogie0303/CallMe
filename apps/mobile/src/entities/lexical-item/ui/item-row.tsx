import { StyleSheet, View } from 'react-native';

import { SpineDot, SpineEdge } from '@/entities/book/ui/spine-edge';
import { color, type } from '@/shared/config';
import { AppText, CountBadge, Quote, Tap } from '@/shared/ui';
import { booksOf, latestEncounter } from '../lib/select';
import type { LexicalItem } from '../model/types';

/**
 * 서랍의 한 줄. 항목이 주인이고 문장은 그 아래 딸린다 —
 * 왼쪽 4px 엣지는 가장 최근에 만난 책의 색이다.
 */
export function ItemRow({ item, onPress }: { item: LexicalItem; onPress?: () => void }) {
  const latest = latestEncounter(item);
  const books = booksOf(item);
  const met = item.encounters.length;

  return (
    <Tap style={styles.row} onPress={onPress}>
      {latest ? <SpineEdge book={latest.book} /> : null}
      <View style={styles.body}>
        <View style={styles.head}>
          <Quote style={styles.term}>{item.term}</Quote>
          {met > 1 ? <CountBadge label={`${met}번 만남`} /> : null}
        </View>
        <AppText style={styles.meaning}>{item.meaning}</AppText>

        <View style={styles.foot}>
          <View style={styles.dots}>
            {books.map((book) => (
              <SpineDot key={book.id} book={book} />
            ))}
          </View>
          <AppText numberOfLines={1} style={styles.source}>
            {books.map((b) => b.title).join(' · ')}
          </AppText>
          {latest ? <AppText style={styles.when}>{latest.savedLabel}</AppText> : null}
        </View>
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderRadius: 16,
    backgroundColor: color.surface.base,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border.subtle,
    overflow: 'hidden',
  },
  body: { flex: 1, gap: 6, paddingVertical: 14, paddingHorizontal: 14, minWidth: 0 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  term: { fontSize: 17, lineHeight: 22, fontWeight: '600', color: color.text.primary, flex: 1 },
  meaning: { ...type.label2, color: color.text.secondary },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 2 },
  dots: { flexDirection: 'row', gap: 3 },
  source: { flex: 1, ...type.caption2, color: color.text.meta },
  when: { ...type.caption2, color: color.text.assistive },
});
