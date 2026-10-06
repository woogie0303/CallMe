import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  usePendingAsks,
  useAskQuota,
  useClaimAdBonus,
  useResolveAsk,
} from '@/entities/ask/api/ask.api';
import { toBook } from '@/entities/book/api/book.api';
import { showRewarded } from '@/shared/ads/ads';
import { color, gutter, type } from '@/shared/config';
import { savedLabel } from '@/shared/lib/date';
import {
  ActionButton,
  AltPanel,
  AppText,
  Icon,
  InkPanel,
  Mark,
  ScreenHeader,
} from '@/shared/ui';
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
  const claim = useClaimAdBonus();
  const [watching, setWatching] = useState(false);
  const left = quota?.remaining ?? 0;
  const oldest = pending[pending.length - 1];

  /** 광고를 끝까지 봤을 때만 서버에 보상을 청구한다 */
  async function watchAd() {
    setWatching(true);
    try {
      if (!(await showRewarded())) {
        Alert.alert(
          '광고를 보지 못했어요',
          '끝까지 보셔야 질문이 생겨요. 지금 보여줄 광고가 없을 수도 있으니 잠시 뒤에 다시 해주세요.',
        );
        return;
      }
      await claim.mutateAsync();
    } catch (error) {
      Alert.alert(
        '질문을 받지 못했어요',
        error instanceof Error ? error.message : '잠시 뒤에 다시 해주세요.',
      );
    } finally {
      setWatching(false);
    }
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        leading="back"
        onLeadingPress={() => router.back()}
        title="기다리는 문장"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={styles.scroll}
      >
        {/* 마지막 하나를 풀고 나면 0개가 된다 — 그때 '0개가 기다린다'고 하지 않는다 */}
        <InkPanel style={styles.hero}>
          <Mark name={pending.length ? 'waiting' : 'empty'} size={80} tile />
          <AppText style={styles.heroTitle}>
            {pending.length
              ? `문장 ${pending.length}개가\n답을 기다리고 있어요`
              : '기다리는 문장이\n없어요'}
          </AppText>
          <AppText style={styles.heroBody}>
            {!pending.length
              ? '담아둔 문장은 모두 풀렸어요.'
              : left > 0
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

        {/*
          이 앱의 유일한 권유 자리. 이번 달 질문을 다 쓴 독자에게만 선다 —
          남아 있는데 광고를 내밀면 읽는 흐름 속으로 들어온다. (ADR-0003)
        */}
        {pending.length && left === 0 ? (
          <AltPanel style={styles.rewarded}>
            <View style={styles.rewardedHead}>
              <Icon name="sparkle" size={15} color={color.primary} />
              <AppText style={styles.rewardedTitle}>
                지금 바로 풀고 싶다면
              </AppText>
            </View>
            <AppText style={styles.rewardedBody}>
              광고를 한 번 보면 질문 3번이 더 생겨요. 읽는 중엔 광고가 나오지
              않아요.
            </AppText>
            <ActionButton
              label="광고 보고 질문 받기"
              variant="subtle"
              loading={watching}
              onPress={watchAd}
            />
          </AltPanel>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <ActionButton
          label={
            !pending.length
              ? '다 풀었어요'
              : left > 0
                ? '가장 오래 기다린 문장부터'
                : '다음 달까지 그대로 둘게요'
          }
          variant={pending.length && left > 0 ? 'primary' : 'ink'}
          loading={resolve.isPending}
          onPress={() => {
            if (pending.length && left > 0 && oldest)
              resolve.mutate(oldest.ask._id);
            else router.back();
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surface.base },
  scroll: { flex: 1 },
  content: { paddingHorizontal: gutter, paddingBottom: 24, gap: 16 },
  hero: { padding: 22, gap: 10 },
  heroTitle: {
    ...type.heading1,
    fontWeight: '700',
    color: color.text.onInk,
    lineHeight: 30,
  },
  heroBody: { ...type.label2, lineHeight: 21, color: color.text.onInkMuted },
  rewarded: { padding: 16, gap: 10 },
  rewardedHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  rewardedTitle: {
    flex: 1,
    ...type.label2,
    fontWeight: '700',
    color: color.text.primary,
  },
  rewardedBody: { ...type.label2, lineHeight: 21, color: color.text.secondary },
  footer: { paddingHorizontal: gutter, paddingTop: 12 },
});
