import { StyleSheet, View } from 'react-native';

import type { LexicalItem } from '@/entities/lexical-item/model/types';
import { ItemRow } from '@/entities/lexical-item/ui/item-row';
import { SectionHeader } from '@/shared/ui';

/** 홈에 얹는 짧은 선반. 서랍과 같은 줄을 쓴다 — 두 곳이 달라 보이면 안 된다. */
export function ItemShelf({
  items,
  total,
  title = '다시 볼 표현',
  onPressItem,
}: {
  items: LexicalItem[];
  total: number;
  title?: string;
  onPressItem?: (id: string) => void;
}) {
  return (
    <View style={styles.wrap}>
      <SectionHeader title={title} aside={`전체 ${total}개`} />
      {items.map((item) => (
        <ItemRow key={item.id} item={item} onPress={() => onPressItem?.(item.id)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
});
