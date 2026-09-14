import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBookSearch, type BookSearchResult } from '@/entities/book/api/book.api';
import { spineFor } from '@/entities/book/lib/spine';
import { BookCover } from '@/entities/book/ui/book-cover';
import { color, type } from '@/shared/config';
import { EmptyState } from '@/shared/ui/empty-state';
import { AppText, Icon, ScreenHeader, Tap } from '@/shared/ui';

/**
 * 제목이나 지은이로 찾는다. 서버가 대신 불러오므로 앱에는 검색 키가 없다.
 *
 * 고른 결과를 바로 등록하지 않고 손 입력 화면으로 값을 채워 넘긴다 — 검색
 * 결과의 쪽수나 저자 표기가 어긋날 때가 있고, 그 화면에서 한 번 눈으로 보고
 * 고칠 수 있어야 한다.
 */
export default function BookSearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { data: results, isFetching } = useBookSearch(query);

  const pick = (book: BookSearchResult) =>
    router.replace({
      pathname: '/book-add',
      params: {
        title: book.title,
        author: book.author,
        pages: book.pages ? String(book.pages) : undefined,
        cover: book.cover,
      },
    });

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
      <ScreenHeader leading="back" onLeadingPress={() => router.back()} title="책 찾기" />

      <View style={styles.field}>
        <Icon name="search" size={17} color={color.text.assistive} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          autoFocus
          placeholder="제목이나 지은이"
          placeholderTextColor={color.text.assistive}
          style={styles.input}
          returnKeyType="search"
        />
        {isFetching ? <ActivityIndicator size="small" color={color.text.assistive} /> : null}
      </View>

      <FlatList
        data={results ?? []}
        keyExtractor={(item, i) => `${item.title}-${item.author}-${i}`}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          query.trim().length <= 1 ? null : isFetching ? null : (
            <EmptyState
              mark="quiet"
              title="찾는 책이 없어요"
              body="원문 제목이나 지은이 영문 표기로 다시 찾아보세요. 그래도 없으면 직접 입력할 수 있어요."
            />
          )
        }
        renderItem={({ item }) => (
          <Tap style={styles.row} onPress={() => pick(item)}>
            <BookCover
              book={{
                id: 'preview',
                title: item.title,
                author: item.author,
                pages: item.pages ?? 0,
                cover: item.cover,
                spine: spineFor(item.title),
              }}
              width={44}
              height={64}
              radius={6}
              showTitle={false}
            />
            <View style={styles.rowText}>
              <AppText numberOfLines={1} style={styles.rowTitle}>
                {item.title}
              </AppText>
              <AppText numberOfLines={1} style={styles.rowMeta}>
                {item.author}
                {item.publisher ? ` · ${item.publisher}` : ''}
              </AppText>
            </View>
          </Tap>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surface.base },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 14,
    backgroundColor: color.surface.alt,
  },
  input: { flex: 1, ...type.label1, color: color.text.primary },
  list: { paddingHorizontal: 20, paddingBottom: 24, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  rowText: { flex: 1, gap: 3, minWidth: 0 },
  rowTitle: { ...type.label1, fontWeight: '600', color: color.text.primary },
  rowMeta: { ...type.caption1, color: color.text.meta },
});
