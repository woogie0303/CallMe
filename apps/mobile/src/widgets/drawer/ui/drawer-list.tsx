import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useItems, type ItemSummary } from '@/entities/lexical-item/api/item.api';
import { ItemRow } from '@/entities/lexical-item/ui/item-row';
import { color } from '@/shared/config';
import { EmptyState } from '@/shared/ui';
import { DrawerFilterRow, type DrawerFilter } from './drawer-filter';

const MATCH: Record<DrawerFilter, (item: ItemSummary) => boolean> = {
  헷갈려요: (i) => i.status === '헷갈려요',
  '다시 만난 것': (i) => i.met > 1,
  외웠어요: (i) => i.status === '외웠어요',
};

/**
 * 서랍은 항목별로 모인다. 책별이 아니다 —
 * 여러 책을 건너다닌 항목이 한 줄에 서는 것이 이 화면의 전부다.
 *
 * 거르는 일은 앞에서 한다. 네 갈래가 전부 같은 목록을 다르게 보는 것뿐이라,
 * 갈래를 바꿀 때마다 서버에 다시 물어보면 이미 손에 있는 걸 또 받는 셈이다.
 */
export function DrawerList({
  query,
  onOpenItem,
}: {
  /** 검색어 — 표현이나 뜻에 들어 있으면 남긴다. 갈래 필터와 함께 걸린다. */
  query?: string;
  onOpenItem?: (id: string) => void;
}) {
  const [filter, setFilter] = useState<DrawerFilter | undefined>();
  const { data, isPending, error } = useItems();
  const byFilter = filter ? (data ?? []).filter(MATCH[filter]) : (data ?? []);
  const needle = query?.trim().toLowerCase();
  const items = needle
    ? byFilter.filter(
        (item) =>
          item.term.toLowerCase().includes(needle) || item.meaning.toLowerCase().includes(needle),
      )
    : byFilter;

  return (
    <View style={styles.wrap}>
      <DrawerFilterRow value={filter} onChange={setFilter} />

      {isPending ? (
        <ActivityIndicator style={styles.spinner} color={color.text.assistive} />
      ) : error ? (
        <EmptyState mark="quiet" title="목록을 불러오지 못했어요" body={error.message} />
      ) : items.length ? (
        <View style={styles.list}>
          {items.map((item) => (
            <ItemRow key={item.id} item={item} onPress={() => onOpenItem?.(item.id)} />
          ))}
        </View>
      ) : (
        <EmptyState
          mark="drawer"
          title={
            needle
              ? `'${query}'와 맞는 표현이 없어요`
              : filter === '다시 만난 것'
                ? '아직 같은 표현을 두 번 만난 적이 없어요'
                : filter
                  ? '아직 이 갈래에 담아둔 표현이 없어요'
                  : '아직 담아둔 표현이 없어요'
          }
          body={needle ? undefined : '원서를 읽다 막힌 문장을 물어보면 여기에 쌓여요.'}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  list: { gap: 10 },
  spinner: { paddingTop: 40 },
});
