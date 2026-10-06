import { useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { useSentenceFeed } from '@/entities/sentence/api/feed.api';
import { useDeleteSentence } from '@/entities/sentence/api/sentence.api';
import { color, gutter, type } from '@/shared/config';
import { AltPanel, AppText, Mark, ScreenHeader } from '@/shared/ui';
import { PendingList } from '@/widgets/pending-asks/ui/pending-list';

/**
 * 물어서 답은 왔는데 표현을 아직 하나도 안 고른 문장들.
 *
 * 답의 표현은 추천일 뿐이라(서버 `Candidate`) 독자가 골라야 서랍에 담긴다. 고르지
 * 않은 문장은 '마음에 들었던 문장'도 '담은 표현'도 아니어서, 서랍 목록이 아니라
 * 여기 모인다. 하나를 눌러 들어가 표현을 고르면 '담은 표현'으로 가고, 필요 없는
 * 문장은 여기서 지운다.
 */
export default function UnpickedScreen() {
  const router = useRouter();
  const { unpicked } = useSentenceFeed();
  const remove = useDeleteSentence();

  const confirmRemove = (id: string) => {
    if (remove.isPending) return;
    Alert.alert('이 문장을 지울까요?', '받아둔 뜻도 함께 지워져요.', [
      { text: '그대로 둘게요', style: 'cancel' },
      {
        text: '지우기',
        style: 'destructive',
        onPress: () =>
          remove.mutate(id, {
            onError: (error) =>
              Alert.alert(
                '지우지 못했어요',
                error instanceof Error ? error.message : '',
              ),
          }),
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        leading="back"
        onLeadingPress={() => router.back()}
        title="표현을 고를 문장"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={styles.scroll}
      >
        <AltPanel style={styles.hero}>
          <Mark name={unpicked.length ? 'reunion' : 'empty'} size={104} />
          <AppText style={styles.heroTitle}>
            {unpicked.length
              ? `문장 ${unpicked.length}개의\n답이 와 있어요`
              : '고를 문장이\n없어요'}
          </AppText>
          <AppText style={styles.heroBody}>
            {unpicked.length
              ? '눌러서 담아둘 표현을 골라주세요. 필요 없는 문장은 지워도 돼요.'
              : '답이 온 문장은 모두 정리했어요.'}
          </AppText>
        </AltPanel>

        <PendingList
          asks={unpicked.map((row) => ({
            id: row.id,
            text: row.text,
            page: row.page,
            capturedLabel: row.savedLabel ?? '',
            book: row.book,
          }))}
          onPressAsk={(id) =>
            router.push({
              pathname: '/sentence/[id]',
              params: { id, reveal: '1' },
            })
          }
          onRemove={confirmRemove}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surface.base },
  scroll: { flex: 1 },
  content: { paddingHorizontal: gutter, paddingBottom: 24, gap: 16 },
  hero: {
    paddingVertical: 26,
    paddingHorizontal: 22,
    gap: 10,
    alignItems: 'center',
  },
  heroTitle: {
    ...type.heading1,
    fontWeight: '700',
    color: color.text.primary,
    lineHeight: 30,
    textAlign: 'center',
  },
  heroBody: {
    ...type.label2,
    lineHeight: 21,
    color: color.text.secondary,
    textAlign: 'center',
  },
});
