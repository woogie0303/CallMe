import { StyleSheet, View } from 'react-native';

import { toBook } from '@/entities/book/api/book.api';
import { SpineEdge } from '@/entities/book/ui/spine-edge';
import type { ApiItemDetail } from '@/shared/api/types';
import { color, type } from '@/shared/config';
import { daysBetween, gapLabel, savedLabel } from '@/shared/lib/date';
import { AltPanel, AppText, Chip, Icon, InkPanel, Quote, Tap, emphasis } from '@/shared/ui';

/**
 * 항목 하나의 전부. 위에는 뜻, 아래에는 이걸 만난 문장들이 시간순으로 선다 —
 * 두 번 이상 만난 항목에서는 그 사이의 간격이 화면의 주인공이다.
 */
export function ItemDetail({
  detail,
  twinTerm,
  onOpenItem,
}: {
  detail: ApiItemDetail;
  /** 헷갈리는 짝의 표제형. 짝이 있을 때만 따로 받아온다. */
  twinTerm?: string;
  onOpenItem?: (id: string) => void;
}) {
  const { item } = detail;
  /** 문장을 못 찾은 만남은 그릴 것이 없다 */
  const encounters = detail.encounters.flatMap((met) =>
    met.sentence && met.book ? [{ ...met, sentence: met.sentence, book: met.book }] : [],
  );
  const books = uniqueBooks(encounters.map((met) => met.book));
  const gap =
    encounters.length > 1
      ? gapLabel(daysBetween(encounters[0].savedAt, encounters[encounters.length - 1].savedAt))
      : undefined;

  return (
    <View style={styles.wrap}>
      <InkPanel style={styles.hero}>
        <View style={styles.heroHead}>
          <Quote style={styles.term}>{item.term}</Quote>
          <View style={styles.register}>
            <AppText style={styles.registerLabel}>{item.register}</AppText>
          </View>
        </View>
        <AppText style={styles.meaning}>{item.meaning}</AppText>
        {gap ? (
          <View style={styles.gapRow}>
            <Icon name="clock" size={14} color={color.primary} />
            <AppText style={styles.gapText}>
              {books.length > 1 ? `${books.length}권에서 ` : ''}
              {encounters.length}번 만났어요 —{' '}
              <AppText style={emphasis(color.text.onInk)}>{gap}</AppText> 또 헷갈렸어요
            </AppText>
          </View>
        ) : null}
      </InkPanel>

      <View style={styles.section}>
        <AppText style={styles.sectionTitle}>만난 문장</AppText>
        {encounters.map((encounter, i) => (
          <View key={encounter.sentenceId} style={styles.card}>
            <SpineEdge book={toBook(encounter.book)} />
            <View style={styles.cardBody}>
              <View style={styles.cardHead}>
                <AppText style={styles.ordinal}>{i === 0 ? '처음' : '재회'}</AppText>
                <AppText style={styles.when}>{savedLabel(encounter.savedAt)}</AppText>
              </View>
              <Quote style={styles.sentence}>{encounter.sentence.text}</Quote>
              <AppText style={styles.source}>
                {encounter.book.title} · p.{encounter.sentence.page}
              </AppText>
              {encounter.sentence.note ? (
                <AppText style={styles.note}>{encounter.sentence.note}</AppText>
              ) : null}
            </View>
          </View>
        ))}
      </View>

      {twinTerm && item.confusedWith ? (
        <Tap onPress={() => onOpenItem?.(item.confusedWith!.itemId)}>
          <AltPanel style={styles.twin}>
            <View style={styles.twinHead}>
              <Quote style={styles.twinTerm}>{twinTerm}</Quote>
              <AppText style={styles.twinLabel}>와는 이렇게 달라요</AppText>
              <Icon name="chevronRight" size={14} color={color.text.assistive} />
            </View>
            <AppText style={styles.twinNote}>{item.confusedWith.note}</AppText>
          </AltPanel>
        </Tap>
      ) : null}

      <View style={styles.statusRow}>
        <Chip label={item.status} tone={item.status === '외웠어요' ? 'positive' : 'primary'} />
        <AppText style={styles.statusHint}>
          {item.status === '외웠어요'
            ? '외웠다고 표시해뒀어요'
            : '아직 헷갈려요 — 다시 만나면 알려드릴게요'}
        </AppText>
      </View>
    </View>
  );
}

/** 같은 책을 두 번 그리지 않는다 */
function uniqueBooks<T extends { _id: string }>(books: T[]): T[] {
  const seen = new Map<string, T>();
  for (const book of books) seen.set(book._id, book);
  return [...seen.values()];
}

const styles = StyleSheet.create({
  wrap: { gap: 20 },

  hero: { padding: 22, gap: 12 },
  heroHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  term: { fontSize: 26, lineHeight: 32, fontWeight: '600', color: color.text.onInk, flex: 1 },
  register: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: color.fill.onInkStrong,
  },
  registerLabel: { ...type.caption2, fontWeight: '600', color: color.text.onInkMuted },
  meaning: { ...type.body2, color: color.text.onInkBody },
  gapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: 'rgba(0,102,255,0.16)',
  },
  gapText: { flex: 1, ...type.caption1, lineHeight: 17, color: color.text.onInkBody },

  section: { gap: 10 },
  sectionTitle: { ...type.body2, fontWeight: '700', color: color.text.primary },
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    backgroundColor: color.surface.base,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border.subtle,
    overflow: 'hidden',
  },
  cardBody: { flex: 1, gap: 6, paddingVertical: 14, paddingHorizontal: 14, minWidth: 0 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ordinal: { ...type.caption2, fontWeight: '700', color: color.text.meta },
  when: { ...type.caption2, color: color.text.assistive },
  sentence: { fontSize: 15, lineHeight: 23, color: color.text.primary },
  source: { ...type.caption2, color: color.text.meta },
  note: { ...type.caption1, color: color.text.secondary, marginTop: 2 },

  twin: { padding: 16, gap: 8 },
  twinHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  twinTerm: { fontSize: 14, lineHeight: 19, fontWeight: '600', color: color.text.primary },
  twinLabel: { flex: 1, ...type.label2, fontWeight: '700', color: color.text.primary },
  twinNote: { ...type.label2, lineHeight: 21, color: color.text.secondary },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusHint: { ...type.caption1, color: color.text.assistive },
});
