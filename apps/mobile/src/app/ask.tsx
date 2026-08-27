import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ASK_QUOTA,
  ASK_RESULT,
  DRAFT_BOOK_ID,
  DRAFT_PAGE,
  DRAFT_SENTENCE,
  remaining,
} from '@/entities/ask/model/mock';
import { bookById } from '@/entities/book/model/mock';
import { color, type } from '@/shared/config';
import { ActionButton, AltPanel, AppText, Icon, ScreenHeader, Tap } from '@/shared/ui';
import { AskResult } from '@/widgets/ask/ui/ask-result';
import { SentenceField } from '@/widgets/ask/ui/sentence-field';

type Phase = 'writing' | 'answered' | 'pending';

/**
 * 03 질문 — 막힌 문장을 통째로 묻는다.
 *
 * 질문이 떨어졌거나 신호가 없으면 답만 미뤄질 뿐, 담는 일은 실패하지 않는다.
 * 읽던 흐름이 끊기는 것이 이 앱이 막으려는 바로 그 일이기 때문이다.
 */
export default function AskScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [sentence, setSentence] = useState(DRAFT_SENTENCE);
  const [phase, setPhase] = useState<Phase>('writing');
  const [used, setUsed] = useState(ASK_QUOTA.used);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const left = remaining({ ...ASK_QUOTA, used });
  const book = bookById(DRAFT_BOOK_ID);

  const togglePick = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const ask = () => {
    // 질문이 떨어져도 담기는 성공한다 — 답만 나중에 온다.
    if (left <= 0) {
      setPhase('pending');
      return;
    }
    setUsed((u) => u + 1);
    setPhase('answered');
    setPicked(new Set(ASK_RESULT.candidates.map((c) => c.id)));
  };

  const reset = () => {
    setPhase('writing');
    setPicked(new Set());
    setSentence('');
  };

  /** 뜻을 묻지 않고 문장만 남긴다. 어휘 항목이 없으니 서랍이 아니라 책으로 간다. */
  const keepOnly = () => router.back();

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader
        leading="close"
        onLeadingPress={() => router.back()}
        title="질문"
        trailing={
          <AppText style={[styles.quota, left === 0 ? styles.quotaOut : null]}>
            이번 달 {left}번 남음
          </AppText>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={styles.scroll}
        keyboardShouldPersistTaps="handled">
        <SentenceField
          value={sentence}
          onChangeText={setSentence}
          editable={phase === 'writing'}
          book={book}
          page={DRAFT_PAGE}
          onCapture={() => router.replace('/scan')}
        />

        {phase === 'answered' ? (
          <AskResult ask={ASK_RESULT} picked={picked} onTogglePick={togglePick} />
        ) : null}

        {phase === 'pending' ? (
          <AltPanel style={styles.pending}>
            <View style={styles.pendingHead}>
              <Icon name="clock" size={15} color={color.text.meta} />
              <AppText style={styles.pendingTitle}>문장은 담아뒀어요</AppText>
            </View>
            <AppText style={styles.pendingBody}>
              이번 달 질문을 다 쓰셨어요. 담아둔 문장은 다음 달에 자동으로 풀려요 — 읽던 데까지
              계속 읽으셔도 돼요.
            </AppText>
            <Tap style={styles.rewarded}>
              <AppText style={styles.rewardedLabel}>광고 보고 3번 더 물어보기</AppText>
            </Tap>
          </AltPanel>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        {phase === 'writing' ? (
          <>
            <ActionButton
              label={left > 0 ? '이 문장 물어보기' : '문장만 담아두기'}
              variant={left > 0 ? 'primary' : 'ink'}
              onPress={ask}
            />
            {/* 뜻은 몰라도 되고 그냥 좋았던 문장 — 이건 서랍이 아니라 책에 남는다 */}
            <ActionButton label="그냥 마음에 든 문장이에요" variant="subtle" onPress={keepOnly} />
          </>
        ) : null}

        {phase === 'answered' ? (
          <>
            <ActionButton
              label="서랍에 담기"
              aside={`${picked.size}개`}
              onPress={() => router.replace('/drawer')}
            />
            <ActionButton label="다른 문장 물어보기" variant="subtle" onPress={reset} />
          </>
        ) : null}

        {phase === 'pending' ? (
          <ActionButton label="다른 문장 담아두기" variant="ink" onPress={reset} />
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surface.base },
  quota: { ...type.caption1, fontWeight: '600', color: color.text.meta },
  quotaOut: { color: color.status.cautionary },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24, gap: 18 },

  pending: { padding: 16, gap: 10 },
  pendingHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  pendingTitle: { ...type.label2, fontWeight: '700', color: color.text.primary },
  pendingBody: { ...type.label2, lineHeight: 21, color: color.text.secondary },
  rewarded: {
    height: 44,
    borderRadius: 12,
    backgroundColor: color.surface.base,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardedLabel: { ...type.label2, fontWeight: '600', color: color.text.primary },

  footer: { paddingHorizontal: 20, paddingTop: 12, gap: 10 },
});
