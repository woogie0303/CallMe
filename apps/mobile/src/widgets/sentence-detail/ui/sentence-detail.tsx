import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BookCover } from '@/entities/book/ui/book-cover';
import type { ItemSummary } from '@/entities/lexical-item/api/item.api';
import { markSegments } from '@/entities/sentence/lib/segments';
import type { SentenceCardData } from '@/entities/sentence/model/types';
import type { ApiCandidate } from '@/shared/api/types';
import { color, type } from '@/shared/config';
import { AltPanel, AppText, Icon, Quote, Tap } from '@/shared/ui';

/**
 * 문장 하나 — 서랍에서 줄을 누르면 온다.
 *
 * 위에서 아래로 **문장 → 뜻 → 담은 표현(재회) → 담지 않은 표현** 순이다.
 *
 * - **뜻은 여전히 눌러야 열린다.** 상세 화면에 들어왔다고 한국어를 먼저 내밀면,
 *   눈은 아는 쪽(한국어)을 읽고 문장은 장식이 된다 — 이 앱이 거부하는 단어장이다.
 * - **재회는 여기 한가운데 선다.** 이 표현을 다른 책에서도 만났는지. 몇 번
 *   만났는지는 누르고 들어간 표현 화면이 말한다.
 * - **담지 않은 표현도 보인다.** 물을 때 모델이 짚어준 후보 중 그때 담지 않은 것을
 *   지금 담을 수 있다. 이미 서랍에 있는 표현이면 담는 순간이 재회가 된다.
 */
export function SentenceDetail({
  row,
  initialReveal,
  saved,
  candidates,
  onSave,
  savingTerm,
  onOpenItem,
  expressions = true,
}: {
  row: SentenceCardData;
  /**
   * 뜻 보기·담은 표현·다른 표현을 보일지. '마음에 들었던 문장'에서 온 길이면 끈다 —
   * 그때 이 화면의 주인은 표현이 아니라 문장과 거기 단 내 생각(스레드)이다.
   */
  expressions?: boolean;
  /** 뜻을 편 채로 시작할지 — 방금 물어서 온 길이면 편다 */
  initialReveal?: boolean;
  /** 이 문장에서 담은 표현들 */
  saved: ItemSummary[];
  /** 물을 때 짚어준 표현 중 아직 담지 않은 것 */
  candidates: ApiCandidate[];
  onSave: (candidate: ApiCandidate) => void;
  /** 지금 담는 중인 표현 — 그 버튼만 도는 중으로 */
  savingTerm?: string;
  onOpenItem: (itemId: string) => void;
}) {
  const [reveal, setReveal] = useState(Boolean(initialReveal));
  const segments = markSegments(row.text, row.marks);

  return (
    <View style={styles.wrap}>
      {/* 출처 — 어느 책 몇 쪽에서 담았는지 */}
      <View style={styles.source}>
        {row.book ? (
          <BookCover
            book={row.book}
            width={44}
            height={64}
            radius={6}
            showTitle={false}
          />
        ) : null}
        <View style={styles.sourceText}>
          <AppText numberOfLines={2} style={styles.bookTitle}>
            {row.book?.title ?? '어느 책'}
          </AppText>
          {row.book?.author ? (
            <AppText numberOfLines={1} style={styles.meta}>
              {row.book.author}
            </AppText>
          ) : null}
          <AppText style={styles.meta}>
            {[
              row.page ? `p.${row.page}` : null,
              row.savedLabel ? `${row.savedLabel} 담음` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </AppText>
        </View>
      </View>

      {/* 문장 — 책에서 온 글이라 세리프. 담은 표현은 밑줄. */}
      <Quote style={styles.sentence}>
        {segments.map((seg, i) =>
          seg.mark ? (
            <Quote key={i} style={styles.marked}>
              {seg.text}
            </Quote>
          ) : (
            <Quote key={i}>{seg.text}</Quote>
          ),
        )}
      </Quote>

      {/*
        뜻 — 물었으면 눌러서 연다. 아직 안 물었으면 여기엔 아무것도 없다 — 묻기는
        머리의 말풍선 아이콘이 한다. 한동안 큰 버튼이 여기 섰는데, 그냥 좋아서 담은
        문장에서는 그 버튼이 문장보다 크게 '물어보라'고 재촉했다.
        '마음에 들었던 문장'에서 온 길(`expressions` 꺼짐)이면 뜻 보기도 두지 않는다 —
        그 화면은 뜻을 알려는 자리가 아니라 문장과 내 생각의 자리다. 답을 기다린다는
        말은 남긴다: 머리의 말풍선으로 방금 물었다면 그 결과는 알려줘야 한다.
      */}
      {!row.asked ? null : row.pending ? (
        <AltPanel style={styles.pending}>
          <Icon name="clock" size={14} color={color.text.meta} />
          <AppText style={styles.pendingText}>답을 기다리는 중이에요</AppText>
        </AltPanel>
      ) : expressions && row.translation ? (
        <View style={styles.translation}>
          <Tap
            onPress={() => setReveal((v) => !v)}
            accessibilityRole="button"
            accessibilityState={{ expanded: reveal }}
            style={styles.revealRow}
          >
            <AppText style={styles.revealLabel}>
              {reveal ? '뜻 닫기' : '뜻 보기'}
            </AppText>
          </Tap>
          {reveal ? (
            <AppText style={styles.translationText}>{row.translation}</AppText>
          ) : null}
        </View>
      ) : null}

      {/* 담은 표현 — 재회가 보이는 자리 */}
      {expressions && saved.length ? (
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>담은 표현</AppText>
          {saved.map((item) => {
            const others = item.books.filter((b) => b.id !== row.book?.id);
            return (
              <Tap
                key={item.id}
                style={styles.itemRow}
                onPress={() => onOpenItem(item.id)}
                accessibilityRole="button"
                accessibilityLabel={`${item.term}, 만난 문장 모두 보기`}
              >
                <View style={styles.itemText}>
                  <Quote style={styles.term}>{item.term}</Quote>
                  <AppText style={styles.meaning}>{item.meaning}</AppText>
                  {others.length ? (
                    <AppText numberOfLines={1} style={styles.others}>
                      {others.length === 1
                        ? `「${others[0].title}」에서도 만났어요`
                        : `「${others[0].title}」 외 ${others.length - 1}권에서도 만났어요`}
                    </AppText>
                  ) : null}
                </View>
                <Icon name="chevronRight" size={14} color={color.text.meta} />
              </Tap>
            );
          })}
        </View>
      ) : null}

      {/* 물을 때 짚어줬지만 아직 담지 않은 표현 */}
      {expressions && candidates.length ? (
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>이 문장의 다른 표현</AppText>
          {candidates.map((candidate) => (
            <View key={candidate.term} style={styles.itemRow}>
              <View style={styles.itemText}>
                <Quote style={styles.term}>{candidate.term}</Quote>
                <AppText style={styles.meaning}>{candidate.meaning}</AppText>
                {candidate.existing ? (
                  <AppText style={styles.others}>
                    서랍에 있어요 · {candidate.existing.met}번 만남 — 담으면 또
                    만난 거예요
                  </AppText>
                ) : null}
              </View>
              <Tap
                style={styles.saveChip}
                onPress={() => onSave(candidate)}
                disabled={savingTerm !== undefined}
                accessibilityRole="button"
                accessibilityLabel={`${candidate.term} 담기`}
              >
                <AppText style={styles.saveLabel}>
                  {savingTerm === candidate.term ? '담는 중' : '담기'}
                </AppText>
              </Tap>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 22, paddingTop: 8 },

  source: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sourceText: { flex: 1, minWidth: 0, gap: 3 },
  bookTitle: { ...type.label1, fontWeight: '700', color: color.text.primary },
  meta: { ...type.caption1, color: color.text.meta },

  sentence: { fontSize: 21, lineHeight: 33, color: color.text.primary },
  marked: {
    color: color.primary,
    textDecorationLine: 'underline',
    textDecorationColor: color.primaryLine,
  },

  pending: { flexDirection: 'row', alignItems: 'center', gap: 7, padding: 14 },
  pendingText: { ...type.label2, color: color.text.secondary },

  translation: {
    gap: 10,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.border.subtle,
  },
  /** 눌러야 여는 것이라 버튼으로 보여야 한다 — 회색 글자만 두면 설명문처럼 읽힌다 */
  revealRow: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: color.fill.default,
  },
  revealLabel: { ...type.label2, fontWeight: '600', color: color.text.body },
  translationText: { ...type.body2Reading, color: color.text.body },

  section: { gap: 4 },
  sectionTitle: {
    ...type.caption1,
    fontWeight: '700',
    color: color.text.secondary,
    marginBottom: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border.subtle,
  },
  itemText: { flex: 1, minWidth: 0, gap: 4 },
  term: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: color.text.primary,
  },
  meaning: { ...type.label2, lineHeight: 20, color: color.text.body },
  others: { ...type.caption2, color: color.primary },

  saveChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: color.primaryTint,
  },
  saveLabel: { ...type.caption1, fontWeight: '700', color: color.primary },
});
