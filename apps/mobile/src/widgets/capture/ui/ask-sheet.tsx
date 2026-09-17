import Animated, { FadeIn, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { markSegments } from '@/entities/sentence/lib/segments';
import type { SentenceMark } from '@/entities/sentence/model/types';
import type { ApiCandidate } from '@/shared/api/types';
import { color, gutter, type } from '@/shared/config';
import { ActionButton, AppText, Icon, Quote, Tap } from '@/shared/ui';

/** 시트가 서는 세 자리 */
export type SheetPhase = 'picked' | 'answered' | 'pending';

/**
 * 짚은 문장 하나가 올라오는 시트.
 *
 * 화면을 옮기지 않는 것이 요점이다. 예전에는 문장을 고르면 질문 화면으로
 * `replace`해 버려서 사진이 사라졌고, 그래서 한 장을 찍어도 문장 하나밖에 못
 * 물었다. 시트는 사진 위에 얹히므로, 답을 받고 담은 뒤에도 쪽은 그대로 있다 —
 * 막힌 문장이 한 쪽에 하나뿐인 경우는 드물다.
 *
 * 답이 오면 같은 시트가 자란다. 뜻이 먼저 오고, 담아둘 만한 표현은 **문장 안의
 * 밑줄**로 보인다 — 뜻이 딸린 카드 더미로 쌓지 않는 이유는 그 모양이 곧
 * 단어장이기 때문이다(ADR-0001·0004).
 */
export function AskSheet({
  sentence,
  phase,
  translation,
  candidates,
  picked,
  quotaLeft,
  busy,
  pendingReason,
  onTogglePick,
  onAsk,
  onKeepOnly,
  onKeep,
  onClose,
}: {
  sentence: string;
  phase: SheetPhase;
  translation?: string;
  candidates: ApiCandidate[];
  picked: Set<string>;
  quotaLeft: number;
  busy?: boolean;
  pendingReason?: string;
  onTogglePick: (term: string) => void;
  onAsk: () => void;
  onKeepOnly: () => void;
  onKeep: () => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();

  /** 답이 왔으면 후보를 문장 안의 밑줄로 그린다 */
  const marks: SentenceMark[] = candidates.map((c) => ({
    surface: c.surface ?? c.term,
    term: c.term,
    meaning: c.meaning,
  }));
  const segments = phase === 'answered' ? markSegments(sentence, marks) : [{ text: sentence }];

  return (
    <Animated.View
      entering={SlideInDown.duration(260)}
      exiting={SlideOutDown.duration(180)}
      style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.grip} />

      <View style={styles.head}>
        <AppText style={styles.eyebrow}>
          {phase === 'picked' ? '이 문장' : phase === 'answered' ? '이런 뜻이에요' : '담아뒀어요'}
        </AppText>
        <Tap hitSlop={10} onPress={onClose} accessibilityRole="button" accessibilityLabel="닫기">
          <Icon name="close" size={16} color={color.text.meta} />
        </Tap>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}>
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

        {phase === 'answered' && translation ? (
          <Animated.View entering={FadeIn.duration(200)} style={styles.translation}>
            <AppText style={styles.translationText}>{translation}</AppText>
          </Animated.View>
        ) : null}

        {/* 밑줄을 눌러 고른다는 것을 한 번은 말해줘야 한다 */}
        {phase === 'answered' && candidates.length ? (
          <AppText style={styles.pickHint}>
            밑줄 친 표현을 눌러 담을 것을 고르세요 · {picked.size}개 고름
          </AppText>
        ) : null}

        {phase === 'pending' ? (
          <AppText style={styles.pendingBody}>
            {pendingReason === '질문 소진'
              ? '이번 달 질문을 다 쓰셨어요. 문장은 담아뒀으니 다음 달에 자동으로 풀려요.'
              : '지금은 답을 받지 못했어요. 문장은 담아뒀으니 나중에 다시 풀어드릴게요.'}
          </AppText>
        ) : null}
      </ScrollView>

      <View style={styles.actions}>
        {phase === 'picked' ? (
          <>
            <ActionButton
              label={quotaLeft > 0 ? '이 문장 물어보기' : '문장만 담아두기'}
              variant={quotaLeft > 0 ? 'primary' : 'ink'}
              loading={busy}
              onPress={onAsk}
            />
            <ActionButton
              label="그냥 마음에 든 문장이에요"
              variant="subtle"
              loading={busy}
              onPress={onKeepOnly}
            />
          </>
        ) : phase === 'answered' ? (
          <ActionButton
            label="서랍에 담기"
            aside={`${picked.size}개`}
            disabled={picked.size === 0}
            loading={busy}
            onPress={onKeep}
          />
        ) : (
          <ActionButton label="다른 문장 고르기" variant="ink" onPress={onClose} />
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  /** 사진 위에 얹힌다 — 쪽은 그대로 있고 시트만 올라온다 */
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '72%',
    backgroundColor: color.surface.base,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    gap: 10,
  },
  grip: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: color.fill.bold,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: gutter,
  },
  eyebrow: { ...type.caption1, fontWeight: '700', color: color.text.meta },

  scroll: { flexGrow: 0 },
  body: { paddingHorizontal: gutter, paddingBottom: 6, gap: 12 },
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
  pickHint: { ...type.caption1, color: color.text.meta },
  pendingBody: { ...type.label2, lineHeight: 21, color: color.text.secondary },

  actions: { paddingHorizontal: gutter, paddingTop: 4, gap: 8 },
});
