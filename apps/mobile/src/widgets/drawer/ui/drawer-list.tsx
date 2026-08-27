import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isReencountered } from '@/entities/lexical-item/lib/select';
import { ITEMS } from '@/entities/lexical-item/model/mock';
import type { LexicalItem } from '@/entities/lexical-item/model/types';
import { ItemRow } from '@/entities/lexical-item/ui/item-row';
import { color, type } from '@/shared/config';
import { AppText } from '@/shared/ui';
import { DrawerFilterRow, type DrawerFilter } from './drawer-filter';

const MATCH: Record<DrawerFilter, (item: LexicalItem) => boolean> = {
  전체: () => true,
  헷갈려요: (i) => i.status === '헷갈려요',
  '다시 만난 것': isReencountered,
  외웠어요: (i) => i.status === '외웠어요',
};

/**
 * 서랍은 항목별로 모인다. 책별이 아니다 —
 * 여러 책을 건너다닌 항목이 한 줄에 서는 것이 이 화면의 전부다.
 */
export function DrawerList({ onOpenItem }: { onOpenItem?: (id: string) => void }) {
  const [filter, setFilter] = useState<DrawerFilter>('전체');
  const items = useMemo(() => ITEMS.filter(MATCH[filter]), [filter]);

  return (
    <View style={styles.wrap}>
      <DrawerFilterRow value={filter} onChange={setFilter} />

      {items.length ? (
        <View style={styles.list}>
          {items.map((item) => (
            <ItemRow key={item.id} item={item} onPress={() => onOpenItem?.(item.id)} />
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <AppText style={styles.emptyText}>
            {filter === '다시 만난 것'
              ? '아직 같은 표현을 두 번 만나지 않았어요.\n계속 읽다 보면 여기가 채워져요.'
              : '여기에 담긴 게 아직 없어요.'}
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  list: { gap: 10 },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { ...type.label2, lineHeight: 22, color: color.text.assistive, textAlign: 'center' },
});
