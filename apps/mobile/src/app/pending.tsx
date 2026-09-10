import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePendingAsks, useAskQuota, useResolveAsk } from '@/entities/ask/api/ask.api';
import { toBook } from '@/entities/book/api/book.api';
import { color, type } from '@/shared/config';
import { savedLabel } from '@/shared/lib/date';
import { ActionButton, AltPanel, AppText, Icon, InkPanel, ScreenHeader } from '@/shared/ui';
import { PendingList } from '@/widgets/pending-asks/ui/pending-list';

/**
 * 답을 기다리는 문장들.
 *
 * 여기가 이 앱의 유일한 권유 자리다 — 광고도 결제도 읽는 중에 끼어들지 않고,
 * 이미 멈춰 선 이 화면에서만 말을 건다. (Q27·Q28)
 */
export default function PendingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: pending = [] } = usePendingAsks();
  const { data: quota } = useAskQuota();
  const resolve = useResolveAsk();
  const left = quota?.remaining ?? 0;
  const oldest = pending[pending.length - 1];

  return (
    <View style={styles.screen}>
      <ScreenHeader leading="back" onLeadingPress={() => router.back()} title="기다리는 문장" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={styles.scroll}>
        <InkPanel style={styles.hero}>
          <AppText style={styles.heroTitle}>
            문장 {pending.length}개가{'\n'}답을 기다리고 있어요
          </AppText>
          <AppText style={styles.heroBody}>
            {left > 0
              ? `이번 달 질문이 ${left}번 남았어요. 하나씩 풀어볼까요?`
              : '이번 달 질문을 다 쓰셨어요. 다음 달 1일에 자동으로 풀려요.'}
          </AppText>
        </InkPanel>

        <PendingList
          asks={pending.map((view) => ({
            id: view.ask._id,
            text: view.sentence?.text ?? '',
            page: view.sentence?.page,
            capturedLabel: savedLabel(view.ask.createdAt),
            reason: view.ask.pendingReason ?? '기다리는 중',
            book: view.book ? toBook(view.book) : undefined,
          }))}
          onPressAsk={(id) => resolve.mutate(id)}
        />

        <AltPanel style={styles.rewarded}>
          <View style={styles.rewardedHead}>
            <Icon name="sparkle" size={15} color={color.primary} />
            <AppText style={styles.rewardedTitle}>지금 바로 풀고 싶다면</AppText>
          </View>
          <AppText style={styles.rewardedBody}>
            광고를 한 번 보면 질문 3번이 더 생겨요. 읽는 중엔 광고가 나오지 않아요.
          </AppText>
          <ActionButton label="광고 보고 3번 더 받기" variant="subtle" />
        </AltPanel>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <ActionButton
          label={
            resolve.isPending
              ? '물어보는 중…'
              : left > 0
                ? '가장 오래 기다린 문장부터'
                : '다음 달까지 그대로 둘게요'
          }
          variant={left > 0 ? 'primary' : 'ink'}
          onPress={() => {
            if (left > 0 && oldest) resolve.mutate(oldest.ask._id);
            else if (left <= 0) router.back();
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surface.base },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 24, gap: 16 },
  hero: { padding: 22, gap: 10 },
  heroTitle: { ...type.heading1, fontWeight: '700', color: color.text.onInk, lineHeight: 30 },
  heroBody: { ...type.label2, lineHeight: 21, color: color.text.onInkMuted },
  rewarded: { padding: 16, gap: 10 },
  rewardedHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  rewardedTitle: { ...type.label2, fontWeight: '700', color: color.text.primary },
  rewardedBody: { ...type.label2, lineHeight: 21, color: color.text.secondary },
  footer: { paddingHorizontal: 20, paddingTop: 12 },
});
