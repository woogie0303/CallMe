import { useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAskQuota } from '@/entities/ask/api/ask.api';
import { useItems } from '@/entities/lexical-item/api/item.api';
import { useReader } from '@/entities/reader/api/reader.api';
import { useReadingWeek } from '@/entities/reading/api/reading.api';
import { color, gutter, type } from '@/shared/config';
import { useSession } from '@/shared/session/session';
import {
  ActionButton,
  AltPanel,
  AppText,
  DisclosureRow,
  Mark,
  ProgressBar,
} from '@/shared/ui';

/**
 * 마이 — 내 레벨과, 이번 달 남은 질문과, 쌓인 것들.
 *
 * 기다리는 문장은 여기 없다. 답을 기다리는 문장은 **할 일**이지 설정이 아니라서,
 * 문장이 사는 곳(서랍)에서 말을 건다 — 여기 두면 세 탭을 건너야 닿고, 줄이
 * 하나도 없을 땐 아예 보이지 않아서 있는 줄도 모른다.
 */
export default function MyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useSession();
  const { data: reader } = useReader();
  const { data: items = [] } = useItems();
  const { data: quota } = useAskQuota();
  const { data: week } = useReadingWeek();
  const again = items.filter((i) => i.met > 1).length;
  const left = quota?.remaining ?? 0;

  /** 되돌릴 수 없는 일은 한 번 묻는다 — 다시 들어오려면 로그인부터다 */
  const confirmSignOut = () =>
    Alert.alert(
      '로그아웃할까요?',
      '담아둔 것은 그대로 있어요. 다시 로그인하면 이어서 볼 수 있어요.',
      [
        { text: '그대로 둘게요', style: 'cancel' },
        { text: '로그아웃', style: 'destructive', onPress: signOut },
      ],
    );

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <AppText style={styles.title}>마이</AppText>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={styles.scroll}
      >
        <DisclosureRow
          eyebrow="내 레벨"
          title={reader?.level ?? '—'}
          body={`책을 한 권 끝낼 때마다 다시 물어봐요 · 지금까지 ${reader?.booksFinished ?? 0}권`}
          onPress={() => router.push('/level')}
        />

        <AltPanel style={styles.quotaPanel}>
          <View style={styles.quotaHead}>
            <AppText style={styles.quotaLabel}>이번 달 질문</AppText>
            <AppText style={styles.quotaValue}>
              {quota?.used ?? 0} / {quota?.limit ?? 0}
            </AppText>
          </View>
          <ProgressBar
            value={quota ? quota.used / Math.max(1, quota.limit) : 0}
          />
          {left > 0 ? (
            <AppText
              style={styles.quotaHint}
            >{`${left}번 남았어요. 다 써도 문장은 그대로 담겨요.`}</AppText>
          ) : (
            <View style={styles.quotaDone}>
              <Mark name="quota-done" size={40} />
              <AppText style={styles.quotaHint}>
                다 쓰셨어요. 담은 문장은 다음 달에 자동으로 풀려요.
              </AppText>
            </View>
          )}
        </AltPanel>

        <AltPanel style={styles.statsPanel}>
          <Row label="담아둔 표현" value={`${items.length}개`} />
          <Row label="다시 만난 표현" value={`${again}개`} />
          <Row label="이번 주에 읽은 날" value={`${week?.days ?? 0}일`} />
        </AltPanel>

        {/* 나가는 문은 쌓인 것들과 한 덩어리로 두지 않는다 */}
        <View style={styles.exit}>
          <ActionButton
            label="로그아웃"
            variant="subtle"
            onPress={confirmSignOut}
          />
        </View>

        {/* 개발 빌드에서만 — 캐릭터 9개를 한 번에 확인하는 자리, 출시에는 안 나간다 */}
        {__DEV__ ? (
          <View style={styles.exit}>
            <ActionButton
              label="캐릭터 9개 보기 (dev)"
              variant="subtle"
              onPress={() => router.push('/dev-marks')}
            />
          </View>
        ) : null}
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
  header: { paddingHorizontal: gutter, paddingBottom: 14 },
  title: { ...type.title3, color: color.text.primary },
  scroll: { flex: 1 },
  content: { paddingHorizontal: gutter, paddingBottom: 24, gap: 12 },

  quotaPanel: { padding: 18, gap: 10 },
  quotaHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  quotaLabel: { ...type.label2, fontWeight: '700', color: color.text.primary },
  quotaValue: { ...type.label2, color: color.text.meta },
  quotaHint: { ...type.caption2, color: color.text.secondary, flex: 1 },
  quotaDone: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  statsPanel: { padding: 18, gap: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  rowLabel: { ...type.label1, color: color.text.secondary },
  rowValue: { ...type.label1, fontWeight: '700', color: color.text.primary },

  exit: { marginTop: 12 },
});
