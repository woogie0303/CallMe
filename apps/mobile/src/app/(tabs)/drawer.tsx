import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCreateAsk } from '@/entities/ask/api/ask.api';
import { useSentenceFeed } from '@/entities/sentence/api/feed.api';
import { color, gutter, type } from '@/shared/config';
import { AppText, Icon, Tap, emphasis } from '@/shared/ui';
import { DrawerList } from '@/widgets/drawer/ui/drawer-list';

/**
 * 서랍 — 담아둔 문장이 모이는 곳(ADR-0004).
 *
 * 문장이 주인이고 표현은 그 안의 밑줄이다. 머리에 적는 수도 그래서 문장 수다 —
 * 예전에는 표현 수를 셌는데, 목록에 선 것과 세어 보여주는 것이 다르면 둘 중
 * 어느 쪽이 서랍인지 알 수 없어진다.
 */
export default function DrawerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { feed } = useSentenceFeed();
  const ask = useCreateAsk();
  const unasked = feed.filter((s) => !s.asked).length;
  const again = feed.filter((s) => s.marks.some((m) => (m.met ?? 0) > 1)).length;
  /** 답을 기다리는 문장 — 할 일이라 문장이 사는 곳에서 말을 건다 */
  const waiting = feed.filter((s) => s.pending).length;
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');

  const closeSearch = () => {
    setSearching(false);
    setQuery('');
  };

  /** 담아둔 문장을 지금 묻는다 — 문장을 새로 만들지 않고 그 줄에 답을 붙인다 */
  const askLater = async (sentenceId: string) => {
    if (ask.isPending) return;
    try {
      await ask.mutateAsync({ sentenceId });
    } catch (error) {
      Alert.alert('묻지 못했어요', error instanceof Error ? error.message : '');
    }
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        {searching ? (
          <View style={styles.searchField}>
            <Icon name="search" size={18} color={color.text.assistive} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              autoFocus
              placeholder="문장이나 뜻으로 찾기"
              placeholderTextColor={color.text.assistive}
              style={styles.searchInput}
            />
          </View>
        ) : (
          <View style={styles.headText}>
            <AppText style={styles.title}>서랍</AppText>
            <AppText style={styles.summary}>
              문장 {feed.length}개{unasked > 0 ? ` · 아직 안 물어본 건 ${unasked}개` : ''}
              {again > 0 ? (
                <AppText style={emphasis(color.primary)}> · 다시 만난 건 {again}개</AppText>
              ) : null}
            </AppText>
          </View>
        )}
        <Tap
          hitSlop={12}
          onPress={() => (searching ? closeSearch() : setSearching(true))}
          accessibilityRole="button"
          accessibilityLabel={searching ? '검색 닫기' : '문장 검색'}>
          <Icon name={searching ? 'close' : 'search'} size={21} color={color.text.primary} />
        </Tap>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={styles.scroll}>
        {/*
          기다리는 문장은 오류가 아니라 상태다(ADR-0003). 그래서 경고처럼
          붉게 세우지 않고, 여기서 이어서 할 수 있는 일로만 알린다.
        */}
        {waiting > 0 && !query ? (
          <Tap
            style={styles.waiting}
            onPress={() => router.push('/pending')}
            accessibilityRole="button"
            accessibilityLabel={`답을 기다리는 문장 ${waiting}개 보기`}>
            <Icon name="clock" size={15} color={color.primary} />
            <AppText style={styles.waitingText}>문장 {waiting}개가 답을 기다리고 있어요</AppText>
            <Icon name="chevronRight" size={14} color={color.primary} />
          </Tap>
        ) : null}

        <DrawerList
          query={query}
          onOpenItem={(id) => router.push({ pathname: '/item/[id]', params: { id } })}
          onAsk={askLater}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surface.base },
  /**
   * 왼쪽 글 덩어리가 두 줄이어도 오른쪽 아이콘은 그 가운데에 선다.
   * 좌우 여백은 아래 목록과 같다 — 제목만 다른 선에서 시작하면 머리와 몸이
   * 서로 다른 화면처럼 보인다.
   */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: gutter,
    paddingBottom: 14,
    gap: 12,
  },
  headText: { flex: 1, gap: 4 },
  title: { ...type.title3, color: color.text.primary },
  summary: { ...type.label2, color: color.text.meta },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: color.surface.alt,
  },
  searchInput: { flex: 1, ...type.label1, color: color.text.primary },
  scroll: { flex: 1 },
  content: { paddingHorizontal: gutter, paddingBottom: 24, gap: 12 },
  waiting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: color.primaryBg,
  },
  waitingText: { flex: 1, ...type.label2, fontWeight: '600', color: color.primary },
});
