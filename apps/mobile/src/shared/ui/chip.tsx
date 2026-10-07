import { StyleSheet, View } from 'react-native';

import { color, type } from '@/shared/config';
import { AppText, Quote } from './text';

type Tone = 'neutral' | 'primary' | 'positive';

const TONES: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: color.fill.default, fg: color.text.secondary },
  primary: { bg: color.primaryBg, fg: color.primary },
  positive: { bg: color.status.positiveBg, fg: color.status.positiveText },
};

/** 사실 하나를 담는 작은 라벨 — 303p, 소설, 난이도 중, 구어체. */
export function Chip({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: Tone;
}) {
  const t = TONES[tone];
  return (
    <View style={[styles.chip, { backgroundColor: t.bg }]}>
      <AppText style={[type.caption2, styles.label, { color: t.fg }]}>
        {label}
      </AppText>
    </View>
  );
}

/** 책에서 온 표현을 담은 칩 — 안쪽 글자는 세리프다. */
export function TermChip({ term }: { term: string }) {
  return (
    <View style={styles.term}>
      <Quote style={styles.termText}>{term}</Quote>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  label: { fontWeight: '600' },
  term: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: color.surface.base,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border.subtle,
  },
  termText: { fontSize: 13, lineHeight: 17, color: color.text.primary },
});
