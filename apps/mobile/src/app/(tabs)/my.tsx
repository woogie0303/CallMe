import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAskQuota, usePendingAsks } from '@/entities/ask/api/ask.api';
import { useItems } from '@/entities/lexical-item/api/item.api';
import { useReader } from '@/entities/reader/api/reader.api';
import { READING_WEEK } from '@/entities/reading/model/mock';
import { color, type } from '@/shared/config';
import { useSession } from '@/shared/session/session';
import { ActionButton, AltPanel, AppText, Icon, ProgressBar, Tap } from '@/shared/ui';

/** 마이 — 내 레벨과, 이번 달 남은 질문과, 쌓인 것들. */
export default function MyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useSession();
  const { data: reader } = useReader();
  const { data: items = [] } = useItems();
  const { data: quota } = useAskQuota();
  const { data: pending = [] } = usePendingAsks();
  const confused = items.filter((i) => i.status === '헷갈려요').length;
  const again = items.filter((i) => i.met > 1).length;
  const left = quota?.remaining ?? 0;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <AppText style={styles.title}>마이</AppText>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={styles.scroll}>
        <Tap onPress={() => router.push('/level')}>
          <AltPanel style={styles.levelPanel}>
            <View style={styles.levelText}>
              <AppText style={styles.levelLabel}>내 레벨</AppText>
              <AppText style={styles.levelValue}>{reader?.level ?? '—'}</AppText>
              <AppText style={styles.levelHint}>
                책을 한 권 끝낼 때마다 다시 물어봐요 · 지금까지 {reader?.booksFinished ?? 0}권
              </AppText>
            </View>
            <Icon name="chevronRight" size={16} color={color.text.assistive} />
          </AltPanel>
        </Tap>

        <AltPanel style={styles.quotaPanel}>
          <View style={styles.quotaHead}>
            <AppText style={styles.quotaLabel}>이번 달 질문</AppText>
            <AppText style={styles.quotaValue}>
              {quota?.used ?? 0} / {quota?.limit ?? 0}
            </AppText>
          </View>
          <ProgressBar value={quota ? quota.used / Math.max(1, quota.limit) : 0} />
          <AppText style={styles.quotaHint}>
            {left > 0
              ? `${left}번 남았어요. 다 써도 문장은 그대로 담겨요.`
              : '다 쓰셨어요. 담은 문장은 다음 달에 자동으로 풀려요.'}
          </AppText>
        </AltPanel>

        {pending.length ? (
          <Tap onPress={() => router.push('/pending')}>
            <AltPanel style={styles.pendingPanel}>
              <View style={styles.levelText}>
                <AppText style={styles.levelLabel}>기다리는 문장</AppText>
                <AppText style={styles.levelValue}>{pending.length}개</AppText>
              </View>
              <Icon name="chevronRight" size={16} color={color.text.assistive} />
            </AltPanel>
          </Tap>
        ) : null}

        <AltPanel style={styles.statsPanel}>
          <Row label="담아둔 표현" value={`${items.length}개`} />
          <Row label="아직 헷갈리는 표현" value={`${confused}개`} />
          <Row label="다시 만난 표현" value={`${again}개`} />
          <Row label="이번 주에 읽은 날" value={`${READING_WEEK.days}일`} />
        </AltPanel>

        <ActionButton label="로그아웃" variant="subtle" onPress={signOut} />
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <AppText style={styles.rowLabel}>{label}</AppText>
      <AppText style={styles.rowValue}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surface.base },
  header: { paddingHorizontal: 24, paddingBottom: 14 },
  title: { ...type.title3, color: color.text.primary },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },

  levelPanel: { padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  pendingPanel: { padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  levelText: { flex: 1, gap: 3 },
  levelLabel: { ...type.caption1, color: color.text.meta },
  levelValue: { ...type.headline1, fontWeight: '700', color: color.text.primary },
  levelHint: { ...type.caption2, color: color.text.assistive },

  quotaPanel: { padding: 18, gap: 10 },
  quotaHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  quotaLabel: { ...type.label2, fontWeight: '700', color: color.text.primary },
  quotaValue: { ...type.label2, color: color.text.meta },
  quotaHint: { ...type.caption2, color: color.text.secondary },

  statsPanel: { padding: 18, gap: 14 },
  row: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  rowLabel: { ...type.label1, color: color.text.secondary },
  rowValue: { ...type.label1, fontWeight: '700', color: color.text.primary },
});
