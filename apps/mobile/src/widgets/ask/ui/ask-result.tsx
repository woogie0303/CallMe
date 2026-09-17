import { markSegments } from '@/entities/sentence/lib/segments';
import type { SentenceMark } from '@/entities/sentence/model/types';
import { StyleSheet, View } from 'react-native';

import type { ApiCandidate } from '@/shared/api/types';
import { color, type } from '@/shared/config';
import { savedLabel } from '@/shared/lib/date';
import { AppText, Icon, Quote, Tap, emphasis } from '@/shared/ui';

/**
 * 질문 하나의 답.
 *
 * 뜻이 달린 카드를 쌓아 보여주지 않는다 — 영어 표제형 아래 한국어를 붙인 카드가
 * 세로로 늘어선 모양이 곧 단어장이고, 그건 ADR-0001이 "되지 않았던 그것"이라
 * 부른 것이다. 담아둘 만한 표현은 **문장 안의 밑줄**로 보이고, 누르면 그 뜻
 * 하나만 아래에 열린다. 문장을 먼저 지나야 뜻에 닿는다.
 *
 * 촬영 화면의 시트(`widgets/capture/ui/ask-sheet`)와 같은 모양이다 — 손으로
 * 적어 물었든 찍어서 물었든 답이 다르게 생기면 같은 일로 보이지 않는다.
 */
export function AskResult({
  sentence,
  translation,
  candidates,
  picked,
  onTogglePick,
}: {
  sentence: string;
  translation?: string;
  candidates: ApiCandidate[];
  /** 고른 후보를 표제형으로 센다 — 후보에는 id가 없다 */
  picked: Set<string>;
  onTogglePick: (term: string) => void;
}) {
  const marks: SentenceMark[] = candidates.map((c) => ({
    surface: c.surface ?? c.term,
    term: c.term,
    meaning: c.meaning,
  }));
  const segments = markSegments(sentence, marks);

  return (
    <View style={styles.wrap}>
      <Quote style={styles.sentence}>
        {segments.map((seg, i) =>
          seg.mark ? (
            <Quote
              key={i}
              style={picked.has(seg.mark.term) ? styles.markedOn : styles.marked}
              onPress={() => onTogglePick(seg.mark!.term)}
              accessibilityState={{ selected: picked.has(seg.mark.term) }}
              accessibilityLabel={`${seg.text}, ${picked.has(seg.mark.term) ? '담음' : '안 담음'}`}>
              {seg.text}
            </Quote>
          ) : (
            <Quote key={i}>{seg.text}</Quote>
          ),
        )}
      </Quote>

      {translation ? (
        <View style={styles.translation}>
          <AppText style={styles.translationText}>{translation}</AppText>
        </View>
      ) : null}

      {candidates.length ? (
        <AppText style={styles.hint}>
          밑줄 친 표현을 눌러 담을 것을 고르세요 · {picked.size}개 고름
        </AppText>
      ) : null}

      {/* 고른 표현의 뜻과, 예전에 만난 적이 있다면 그 사실 — 이 줄이 이 앱의 요지다 */}
      {candidates
        .filter((c) => picked.has(c.term))
        .map((c) => (
          <View key={c.term} style={styles.gloss}>
            <View style={styles.glossHead}>
              <Quote style={styles.glossTerm}>{c.term}</Quote>
              <Tap
                hitSlop={8}
                onPress={() => onTogglePick(c.term)}
                accessibilityRole="button"
                accessibilityLabel={`${c.term} 빼기`}>
                <Icon name="close" size={12} color={color.text.meta} />
              </Tap>
            </View>
            <AppText style={styles.glossMeaning}>{c.meaning}</AppText>
            {c.existing ? (
              <View style={styles.echo}>
                <Icon name="clock" size={14} color={color.primary} />
                <AppText style={styles.echoText}>
                  <AppText style={emphasis(color.primary)}>
                    {c.existing.lastSavedAt ? savedLabel(c.existing.lastSavedAt) : '예전'}
                  </AppText>{' '}
                  {c.existing.lastBookTitle ?? '어딘가'}에서 담으셨어요 — 담으면{' '}
                  {c.existing.met + 1}번째 만남이에요
                </AppText>
              </View>
            ) : null}
          </View>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  sentence: { fontSize: 18, lineHeight: 29, color: color.text.primary },
  marked: {
    color: color.text.primary,
    textDecorationLine: 'underline',
    textDecorationColor: color.border.strong,
  },
  markedOn: {
    color: color.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
    textDecorationColor: color.primary,
  },
  translation: {
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.border.subtle,
  },
  translationText: { ...type.body2Reading, color: color.text.body },
  hint: { ...type.caption1, color: color.text.meta },

  gloss: {
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: color.primaryBg,
  },
  glossHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  glossTerm: { flex: 1, fontSize: 16, lineHeight: 21, fontWeight: '600', color: color.primary },
  glossMeaning: { ...type.label2, lineHeight: 20, color: color.text.body },
  echo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderRadius: 11,
    backgroundColor: color.primaryTint,
  },
  echoText: { flex: 1, ...type.caption1, lineHeight: 17, color: color.text.body },
});
