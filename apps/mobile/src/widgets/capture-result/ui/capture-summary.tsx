import { StyleSheet, View } from 'react-native';

import type { Book } from '@/entities/book/model/types';
import { color, type } from '@/shared/config';
import { AppText, PageThumb, Tap } from '@/shared/ui';

/** 방금 찍은 페이지에서 몇 개를 건졌는지. 사진은 옆에 그대로 남는다. */
export function CaptureSummary({
  book,
  page,
  count,
  onViewPhoto,
}: {
  book: Book;
  page: number;
  count: number;
  onViewPhoto?: () => void;
}) {
  return (
    <View style={styles.row}>
      <PageThumb width={86} height={112} />
      <View style={styles.meta}>
        <AppText style={styles.headline}>표현 {count}개를{'\n'}찾았어요</AppText>
        <AppText style={styles.source}>
          {book.title} · p.{page} · 방금 촬영
        </AppText>
        <Tap hitSlop={8} onPress={onViewPhoto}>
          <AppText style={styles.link}>사진 다시 보기</AppText>
        </Tap>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  meta: { flex: 1, gap: 6 },
  headline: {
    ...type.heading2,
    fontWeight: '700',
    color: color.text.primary,
    letterSpacing: -0.4,
    lineHeight: 27,
  },
  source: { ...type.caption1, color: color.text.meta },
  link: { ...type.caption1, fontWeight: '600', color: color.primary, marginTop: 2 },
});
