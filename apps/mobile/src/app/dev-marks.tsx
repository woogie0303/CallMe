import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { color, gutter, type } from '@/shared/config';
import {
  AppText,
  Mark,
  MARK_NAMES,
  ScreenHeader,
  type MarkName,
} from '@/shared/ui';

/**
 * 개발용 — 캐릭터를 한 화면에서 다 본다.
 *
 * 실제 화면 어딘가에 박아두지 않는다. 실제 자리(빈 서랍, 막힌 검색, 기다리는
 * 문장…)는 그 순간이 와야 보이고, 그걸 하나씩 재현하는 것보다 여기서 한 번에
 * 눈으로 확인하는 게 빠르다. 마이 탭 맨 아래(__DEV__에서만)에서 들어온다.
 */
const LABELS: Record<MarkName, string> = {
  empty: '상황 — 아직 아무것도 없음',
  'no-results': '검색 결과 없음',
  blocked: '잠시 막힘',
  waiting: '답을 기다리는 중',
  'no-history': '읽은 기록 없음',
  'quota-done': '질문 다 씀',
  'not-found': '찾을 수 없음',
  'ocr-failed': '글자를 못 읽음',
  reunion: '다시 만남',
  reading: '책을 읽는 중 — 로그인 화면',
};

export default function DevMarksScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <ScreenHeader
        leading="back"
        onLeadingPress={() => router.back()}
        title="캐릭터"
      />
      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {MARK_NAMES.map((name) => (
          <View key={name} style={styles.cell}>
            <Mark name={name} size={104} />
            <AppText style={styles.name}>{name}</AppText>
            <AppText style={styles.label}>{LABELS[name]}</AppText>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surface.base },
  grid: {
    paddingHorizontal: gutter,
    paddingBottom: 40,
    paddingTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cell: {
    width: '47%',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: color.surface.card,
  },
  name: { ...type.caption1, fontWeight: '700', color: color.text.primary },
  label: { ...type.caption2, color: color.text.secondary, textAlign: 'center' },
});
