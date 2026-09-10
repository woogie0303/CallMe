import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useItems, type ItemSummary } from '@/entities/lexical-item/api/item.api';
import { ItemRow } from '@/entities/lexical-item/ui/item-row';
import { color, type } from '@/shared/config';
import { AppText } from '@/shared/ui';
import { DrawerFilterRow, type DrawerFilter } from './drawer-filter';

const MATCH: Record<DrawerFilter, (item: ItemSummary) => boolean> = {
  전체: () => true,
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
export function DrawerList({ onOpenItem }: { onOpenItem?: (id: string) => void }) {
  const [filter, setFilter] = useState<DrawerFilter>('전체');
  const { data, isPending, error } = useItems();
  const items = (data ?? []).filter(MATCH[filter]);

  return (
    <View style={styles.wrap}>
      <DrawerFilterRow value={filter} onChange={setFilter} />

      {isPending ? (
        <ActivityIndicator style={styles.spinner} color={color.text.assistive} />
      ) : error ? (
        <View style={styles.empty}>
          <AppText style={styles.emptyText}>{error.message}</AppText>
        </View>
      ) : items.length ? (
        <View style={styles.list}>
          {items.map((item) => (
            <ItemRow key={item.id} item={item} onPress={() => onOpenItem?.(item.id)} />
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <AppText style={styles.emptyText}>
            {filter === '다시 만난 것'
              ? '아직 같은 표현을 두 번 만난 적이 없어요.'
              : '아직 담아둔 표현이 없어요.'}
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  list: { gap: 10 },
  spinner: { paddingTop: 40 },
  empty: { paddingTop: 40, alignItems: 'center' },
  emptyText: { ...type.label2, color: color.text.assistive, textAlign: 'center', lineHeight: 21 },
});
