import { StyleSheet, View } from 'react-native';

import type { Book } from '@/entities/book/model/types';
import { SpineEdge } from '@/entities/book/ui/spine-edge';
import { gapLabel } from '@/entities/lexical-item/lib/select';
import type { LexicalItem } from '@/entities/lexical-item/model/types';
import { color, type } from '@/shared/config';
import { AppText, Quote, Tap, emphasis } from '@/shared/ui';

/**
 * 오늘의 표현 — 담아둔 것 중 하나를 홈으로 끌어올린다.
 *
 * 서랍처럼 목록을 펴지 않는다. 홈에 있어도 되는 이유는 고를 거리를 주기
 * 때문이 아니라 **오늘 이걸 다시 볼 이유**를 대기 때문이다. 그래서 뜻보다
 * 아래 한 줄이 중요하다 — 얼마 만에 또 헷갈렸는지.
 */
export function TodayItem({
  item,
  book,
  onPress,
}: {
  item: LexicalItem;
  book?: Book;
  onPress?: () => void;
}) {
  const gap = gapLabel(item);
  const last = item.encounters[item.encounters.length - 1];

  return (
    <Tap style={styles.card} onPress={onPress}>
      {book ? <SpineEdge book={book} /> : null}
      <View style={styles.body}>
        <AppText style={styles.eyebrow}>오늘의 표현</AppText>
        <Quote numberOfLines={1} style={styles.term}>
          {item.term}
        </Quote>
        <AppText numberOfLines={1} ellipsizeMode="tail" style={styles.meaning}>
          {item.meaning}
        </AppText>
        <AppText style={styles.reason}>
          {gap ? (
            <>
              <AppText style={emphasis(color.primary)}>{gap}</AppText> 또 헷갈렸어요
            </>
          ) : (
            `${last.savedLabel}에 담아뒀어요`
          )}
        </AppText>
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 18,
    backgroundColor: color.surface.base,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border.subtle,
    overflow: 'hidden',
  },
  /** 판이 검색 타일과 키를 맞추느라 늘어나도 글은 가운데에 선다 */
  body: { flex: 1, minWidth: 0, justifyContent: 'center', gap: 3, paddingHorizontal: 14 },
  eyebrow: { ...type.caption2, color: color.text.meta },
  term: { fontSize: 17, lineHeight: 23, fontWeight: '600', color: color.text.primary },
  meaning: { ...type.label2, color: color.text.secondary },
  reason: { ...type.caption2, color: color.text.meta, marginTop: 3 },
});
