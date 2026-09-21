import { ScrollView, StyleSheet, View } from 'react-native';

import type { ItemSummary } from '@/entities/lexical-item/api/item.api';
import { ItemCard } from '@/entities/lexical-item/ui/item-card';
import { SectionHeader } from '@/shared/ui';

/**
 * 한 책에서 담은 표현들. 가로로 흘린다 —
 * 세로로 쌓으면 책 화면이 목록 하나로 끝나버리고, 이 표현들은 훑어보는
 * 것이지 하나씩 읽어 내려가는 것이 아니다. (하나씩 보는 곳은 서랍이다.)
 */
export function ItemShelf({
  items,
  title = '이 책에서 담은 표현',
  onPressItem,
  /** 부모의 좌우 여백 — 카드가 화면 오른쪽으로 흘러나가게 상쇄한다 */
  bleed = 20,
}: {
  items: ItemSummary[];
  /** null이면 제목을 그리지 않는다 — 탭 라벨이 이미 이름을 대고 있을 때 */
  title?: string | null;
  onPressItem?: (id: string) => void;
  bleed?: number;
}) {
  return (
    <View style={styles.wrap}>
      {title !== null ? <SectionHeader title={title} aside={`${items.length}개`} /> : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginRight: -bleed }}
        contentContainerStyle={[styles.rail, { paddingRight: bleed }]}>
        {items.map((item) => (
          <ItemCard key={item.id} item={item} onPress={() => onPressItem?.(item.id)} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  rail: { gap: 10 },
});
