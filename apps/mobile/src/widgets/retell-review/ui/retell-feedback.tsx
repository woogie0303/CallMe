import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';

import { itemById } from '@/entities/lexical-item/model/mock';
import type { RetellRevision } from '@/entities/retell/model/mock';
import { color, type } from '@/shared/config';
import { AltPanel, AppText, Card, Icon, Quote, TermChip, emphasis } from '@/shared/ui';

/**
 * 내가 쓴 문장과 고친 문장을 위아래로 놓는다.
 * (폭이 있는 웹에서는 이 둘을 나란히 놓지만, 모바일에서는 위가 지나간 말이다.)
 */
export function RetellFeedback({
  revisions,
  missedItemIds,
}: {
  revisions: RetellRevision[];
  missedItemIds: string[];
}) {
  const missed = missedItemIds.map(itemById).filter(Boolean);

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Icon name="sparkle" size={15} color={color.primary} />
        <AppText style={styles.headTitle}>이렇게 쓰면 더 자연스러워요</AppText>
      </View>

      {revisions.map((revision) => (
        <Card key={revision.id} style={styles.card}>
          <Quote style={styles.mine}>{revision.mine}</Quote>
          <Quote style={styles.better}>{revision.better}</Quote>
          <AppText style={styles.note}>{highlight(revision.note, revision.highlights)}</AppText>
        </Card>
      ))}

      {missed.length ? (
        <AltPanel style={styles.missed}>
          <AppText style={styles.missedTitle}>이 챕터에서 쓸 수 있었던 표현</AppText>
          <View style={styles.missedRow}>
            {missed.map((e) => (
              <TermChip key={e!.id} term={e!.term} />
            ))}
          </View>
        </AltPanel>
      ) : null}
    </View>
  );
}

/**
 * 설명 안에서 짚어줄 조각만 굵게. 조각은 영어라도 설명 문장의 일부라
 * 세리프로 바꾸지 않는다 — 책에서 인용한 게 아니기 때문이다.
 */
function highlight(note: string, marks: string[]) {
  if (!marks.length) return note;
  const pattern = new RegExp(`(${marks.map(escape).join('|')})`, 'g');
  return note.split(pattern).map((chunk, i) =>
    marks.includes(chunk) ? (
      <AppText key={i} style={emphasis()}>
        {chunk}
      </AppText>
    ) : (
      <Fragment key={i}>{chunk}</Fragment>
    ),
  );
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  headTitle: { ...type.body2, fontWeight: '700', color: color.text.primary },
  card: { padding: 16, gap: 10, borderRadius: 18 },
  /** 지나간 말 — 지워진 채로 남는다 */
  mine: {
    fontSize: 14,
    lineHeight: 21,
    color: color.text.meta,
    textDecorationLine: 'line-through',
  },
  better: { fontSize: 15, lineHeight: 23, fontWeight: '600', color: color.text.primary },
  note: { ...type.label2, lineHeight: 21, color: color.text.secondary, paddingTop: 2 },
  missed: { padding: 16, gap: 8 },
  missedTitle: { ...type.caption1, fontWeight: '700', color: color.text.secondary },
  missedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
