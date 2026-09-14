import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useItems } from '@/entities/lexical-item/api/item.api';
import { color, type } from '@/shared/config';
import { AppText, Icon, Tap, emphasis } from '@/shared/ui';
import { DrawerList } from '@/widgets/drawer/ui/drawer-list';

/** 서랍 — 담아둔 어휘 항목이 모이는 곳. 항목이 주인이고 문장이 딸린다. */
export default function DrawerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: items = [] } = useItems();
  const confused = items.filter((i) => i.status === '헷갈려요').length;
  const again = items.filter((i) => i.met > 1).length;
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');

  const closeSearch = () => {
    setSearching(false);
    setQuery('');
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
              placeholder="표현이나 뜻으로 찾기"
              placeholderTextColor={color.text.assistive}
              style={styles.searchInput}
            />
          </View>
        ) : (
          <View style={styles.headText}>
            <AppText style={styles.title}>서랍</AppText>
            <AppText style={styles.summary}>
              표현 {items.length}개 · 아직 헷갈리는 건 {confused}개
              {again > 0 ? (
                <AppText style={emphasis(color.primary)}> · 다시 만난 건 {again}개</AppText>
              ) : null}
            </AppText>
          </View>
        )}
        <Tap
          hitSlop={12}
          onPress={() => (searching ? closeSearch() : setSearching(true))}
          accessibilityLabel={searching ? '검색 닫기' : '표현 검색'}>
          <Icon name={searching ? 'close' : 'search'} size={21} color={color.text.primary} />
        </Tap>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={styles.scroll}>
        <DrawerList query={query} onOpenItem={(id) => router.push(`/item/${id}`)} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surface.base },
  /** 왼쪽 글 덩어리가 두 줄이어도 오른쪽 아이콘은 그 가운데에 선다 */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
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
  content: { paddingHorizontal: 20, paddingBottom: 24 },
});
