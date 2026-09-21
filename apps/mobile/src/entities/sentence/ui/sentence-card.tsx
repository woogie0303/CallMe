import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SpineEdge } from '@/entities/book/ui/spine-edge';
import { color, type } from '@/shared/config';
import { AppText, Icon, Quote, Tap } from '@/shared/ui';
import { markSegments } from '../lib/segments';
import type { SentenceCardData, SentenceMark } from '../model/types';

/**
 * 서랍의 한 줄 — 문장 하나(ADR-0004).
 *
 * **처음에 보이는 것은 영어뿐이다.** 한국어를 영어 옆에 놓지 않는 것이 이
 * 카드의 전부라고 해도 된다. 옆에 놓는 순간 눈은 아는 쪽(한국어)을 읽고,
 * 영어는 장식이 된다 — 그게 ADR-0001이 "되지 않았던 그것"이라 부른 단어장이다.
 * 그래서 뜻은 **아래로** 열린다. 옆이 아니라 아래인 것에 뜻이 있다: 문장을
 * 먼저 지나야 닿는다.
 *
 * 표현은 문장 안의 밑줄이다. 밑줄 하나를 누르면 그 뜻만 열리고, 한 번 더
 * 누르면 그 표현이 만난 모든 문장(재회)으로 간다.
 */
export function SentenceCard({
  data,
  onOpenItem,
  onAsk,
  onDelete,
}: {
  data: SentenceCardData;
  /** 밑줄에서 항목 상세로 — 재회가 보이는 자리 */
  onOpenItem?: (itemId: string) => void;
  /** 아직 묻지 않은 문장을 지금 묻는다 */
  onAsk?: (sentenceId: string) => void;
  /** 지우기. 무엇이 함께 사라지는지 묻는 일은 부르는 쪽이 한다. */
  onDelete?: (sentenceId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mark, setMark] = useState<SentenceMark | null>(null);
  const segments = markSegments(data.text, data.marks);
  const glossed = mark ?? null;

  /** 뜻이 있는 문장만 열린다 — 아직 안 물어본 문장엔 열 것이 없다 */
  const openable = Boolean(data.translation);

  return (
    <View style={styles.card}>
      {data.book ? <SpineEdge book={data.book} /> : null}

      <View style={styles.body}>
        <Tap
          onPress={openable ? () => setOpen((v) => !v) : undefined}
          accessibilityRole={openable ? 'button' : undefined}
          accessibilityState={openable ? { expanded: open } : undefined}
          accessibilityLabel={data.text}
          accessibilityHint={openable && !open ? '눌러서 뜻 보기' : undefined}>
          <Quote style={styles.sentence}>
            {segments.map((seg, i) =>
              seg.mark ? (
                <Quote
                  key={i}
                  style={styles.marked}
                  onPress={() => setMark((m) => (m?.term === seg.mark!.term ? null : seg.mark!))}
                  accessibilityLabel={`${seg.text}, 표현`}>
                  {seg.text}
                </Quote>
              ) : (
                <Quote key={i}>{seg.text}</Quote>
              ),
            )}
          </Quote>
        </Tap>

        {/* 누른 표현의 뜻 하나. 문장 아래, 한 번에 하나만. */}
        {glossed ? (
          <View style={styles.gloss}>
            <View style={styles.glossHead}>
              <Quote style={styles.glossTerm}>{glossed.term}</Quote>
              {glossed.met && glossed.met > 1 ? (
                <AppText style={styles.again}>{glossed.met}번 만남</AppText>
              ) : null}
            </View>
            <AppText style={styles.glossMeaning}>{glossed.meaning}</AppText>
            {glossed.itemId ? (
              <Tap
                style={styles.more}
                onPress={() => onOpenItem?.(glossed.itemId!)}
                accessibilityRole="button"
                accessibilityLabel={`${glossed.term}을 만난 문장 모두 보기`}>
                <AppText style={styles.moreLabel}>만난 문장 모두 보기</AppText>
                <Icon name="chevronRight" size={13} color={color.primary} />
              </Tap>
            ) : null}
          </View>
        ) : null}

        {/* 문장 전체의 뜻 — 청했을 때만 */}
        {open && data.translation ? (
          <View style={styles.translation}>
            <AppText style={styles.translationText}>{data.translation}</AppText>
          </View>
        ) : null}

        <View style={styles.foot}>
          <AppText numberOfLines={1} style={styles.source}>
            {data.book ? data.book.title : '어느 책'}
            {data.page ? ` · p.${data.page}` : ''}
            {data.savedLabel ? ` · ${data.savedLabel}` : ''}
          </AppText>

          {/* 아직 묻지 않은 문장은 막다른 길이 아니다 — 여기서 물을 수 있다 */}
          {!data.asked ? (
            <Tap
              style={styles.ask}
              onPress={() => onAsk?.(data.id)}
              accessibilityRole="button"
              accessibilityLabel="이 문장 물어보기">
              <AppText style={styles.askLabel}>물어보기</AppText>
            </Tap>
          ) : data.pending ? (
            <View style={styles.waiting}>
              <Icon name="clock" size={12} color={color.text.meta} />
              <AppText style={styles.waitingLabel}>기다리는 중</AppText>
            </View>
          ) : openable ? (
            <AppText style={styles.reveal}>{open ? '뜻 닫기' : '뜻 보기'}</AppText>
          ) : null}

          {/*
            지우기는 조용히 둔다 — 자주 할 일이 아닌데 목록마다 붉게 서 있으면
            누르라는 말처럼 보인다. 위험하다는 말은 누른 뒤 확인 창이 한다.
          */}
          {onDelete ? (
            <Tap
              hitSlop={10}
              onPress={() => onDelete(data.id)}
              accessibilityRole="button"
              accessibilityLabel="이 문장 지우기">
              <AppText style={styles.remove}>지우기</AppText>
            </Tap>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    backgroundColor: color.surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border.subtle,
    overflow: 'hidden',
  },
  body: { flex: 1, minWidth: 0, gap: 10, paddingVertical: 15, paddingHorizontal: 15 },

  /** 책에서 온 영어라 세리프. 이 화면에서 눈이 멈춰야 하는 곳이다. */
  sentence: { fontSize: 17, lineHeight: 27, color: color.text.primary },
  /** 밑줄 하나가 '여기 담아둔 것이 있다'는 말을 대신한다 */
  marked: {
    color: color.primary,
    textDecorationLine: 'underline',
    textDecorationColor: color.primaryLine,
  },

  gloss: {
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: color.primaryBg,
  },
  glossHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  glossTerm: { flex: 1, fontSize: 15, lineHeight: 20, fontWeight: '600', color: color.primary },
  again: { ...type.caption2, fontWeight: '700', color: color.primary },
  glossMeaning: { ...type.label2, lineHeight: 20, color: color.text.body },
  more: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingTop: 2 },
  moreLabel: { ...type.caption1, fontWeight: '600', color: color.primary },

  /** 위에 선 하나를 두어 '문장 다음에 오는 것'임을 보인다 */
  translation: {
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.border.subtle,
  },
  translationText: { ...type.body2Reading, color: color.text.body },

  foot: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  source: { flex: 1, ...type.caption2, color: color.text.meta },
  reveal: { ...type.caption2, fontWeight: '600', color: color.text.meta },
  remove: { ...type.caption2, color: color.text.meta },
  ask: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: color.primaryTint,
  },
  askLabel: { ...type.caption2, fontWeight: '700', color: color.primary },
  waiting: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  waitingLabel: { ...type.caption2, color: color.text.meta },
});
