import { StyleSheet, View } from 'react-native';

import type { ApiCandidate } from '@/shared/api/types';
import { color, type } from '@/shared/config';
import { AltPanel, AppText } from '@/shared/ui';
import { CandidateCard } from './candidate-card';

/**
 * 질문 하나의 답. 번역이 먼저 오고 추천 항목이 따라온다 —
 * 문장을 통째로 물었기 때문에 여기 적힌 뜻은 이 페이지에서의 뜻이다.
 */
export function AskResult({
  translation,
  candidates,
  picked,
  onTogglePick,
}: {
  translation?: string;
  candidates: ApiCandidate[];
  /** 고른 후보를 표제형으로 센다 — 후보에는 id가 없다 */
  picked: Set<string>;
  onTogglePick: (term: string) => void;
}) {
  return (
    <View style={styles.wrap}>
      <AltPanel style={styles.translation}>
        <AppText style={styles.translationLabel}>이런 뜻이에요</AppText>
        <AppText style={styles.translationText}>{translation}</AppText>
      </AltPanel>

      <View style={styles.section}>
        <AppText style={styles.sectionTitle}>
          이 문장에서 담아둘 만한 것 {candidates.length}개
        </AppText>
        {candidates.map((candidate) => (
          <CandidateCard
            key={candidate.term}
            candidate={candidate}
            picked={picked.has(candidate.term)}
            onToggle={() => onTogglePick(candidate.term)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 18 },
  translation: { padding: 16, gap: 6 },
  translationLabel: { ...type.caption2, fontWeight: '700', color: color.text.meta },
  translationText: { ...type.body2Reading, color: color.text.primary },
  section: { gap: 10 },
  sectionTitle: { ...type.body2, fontWeight: '700', color: color.text.primary },
});
