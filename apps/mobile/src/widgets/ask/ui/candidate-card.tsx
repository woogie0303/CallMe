import { StyleSheet, View } from 'react-native';

import type { ApiCandidate } from '@/shared/api/types';
import { color, type } from '@/shared/config';
import { savedLabel } from '@/shared/lib/date';
import { AppText, Chip, Icon, Quote, Tap, emphasis } from '@/shared/ui';

/**
 * 추천 항목 한 장. 이미 서랍에 있는 항목이면 아래에 재회 줄이 붙는다 —
 * 이 줄이 붙은 카드가 이 앱이 존재하는 이유다.
 */
export function CandidateCard({
  candidate,
  picked,
  onToggle,
}: {
  candidate: ApiCandidate;
  picked: boolean;
  onToggle?: () => void;
}) {
  /** 재회 줄에 필요한 것은 질문의 답이 이미 함께 실어 보낸다 */
  const existing = candidate.existing;

  return (
    <Tap style={[styles.card, picked ? styles.cardPicked : null]} onPress={onToggle}>
      <View style={styles.head}>
        <Quote style={styles.term}>{candidate.term}</Quote>
        <Chip
          label={candidate.register}
          tone={candidate.register === '구어체' ? 'positive' : 'neutral'}
        />
        <View style={[styles.check, picked ? styles.checkOn : null]}>
          {picked ? <Icon name="check" size={13} color={color.text.onInk} /> : null}
        </View>
      </View>

      <AppText style={styles.meaning}>{candidate.meaning}</AppText>

      {existing ? (
        <View style={styles.echo}>
          <Icon name="clock" size={15} color={color.primary} />
          <AppText style={styles.echoText}>
            <AppText style={emphasis(color.primary)}>
              {existing.lastSavedAt ? savedLabel(existing.lastSavedAt) : '예전'}
            </AppText>{' '}
            {existing.lastBookTitle ?? '어딘가'}
            에서 담으셨어요 — 담으면 {existing.met + 1}번째 만남이에요
          </AppText>
        </View>
      ) : null}
    </Tap>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 10,
    borderRadius: 18,
    backgroundColor: color.surface.base,
    borderWidth: 1,
    borderColor: color.border.subtle,
  },
  cardPicked: { borderColor: color.primaryLine, backgroundColor: color.primaryBgSoft },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  term: { flex: 1, fontSize: 18, lineHeight: 23, fontWeight: '600', color: color.text.primary },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: color.border.strong,
  },
  checkOn: { backgroundColor: color.primary, borderColor: color.primary },
  meaning: { ...type.label1, lineHeight: 21, color: color.text.body },
  echo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: color.primaryTint,
  },
  echoText: { flex: 1, ...type.caption1, lineHeight: 17, color: color.text.body },
});
