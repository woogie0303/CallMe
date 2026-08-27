import { StyleSheet, View } from 'react-native';

import type { Book } from '@/entities/book/model/types';
import { BookCover } from '@/entities/book/ui/book-cover';
import { color, shadow, type } from '@/shared/config';
import { AltPanel, AppText, Chip, Icon } from '@/shared/ui';

/**
 * 검색 결과 한 권을 확인하는 화면.
 * 여기서 "맞다"고 하면 이 책에서 모은 문장이 한곳에 쌓이기 시작한다.
 */
export function BookConfirm({ book }: { book: Book }) {
  return (
    <View style={styles.wrap}>
      <View>
        <AppText style={styles.question}>이 책이 맞나요?</AppText>
        <AppText style={styles.sub}>등록하면 이 책에서 모은 문장이 한곳에 쌓여요</AppText>
      </View>

      <View style={styles.row}>
        <BookCover
          book={book}
          width={112}
          height={158}
          radius={12}
          titleSize={15}
          showAuthor
          style={shadow.cover}
        />
        <View style={styles.meta}>
          <AppText style={styles.title}>{book.title}</AppText>
          <AppText style={styles.byline}>
            {[book.author, book.publisher && `${book.publisher}, ${book.year}`]
              .filter(Boolean)
              .join(' · ')}
          </AppText>
          {book.rating ? (
            <View style={styles.rating}>
              <Icon name="starFill" size={14} color={color.status.cautionary} />
              <AppText style={styles.ratingValue}>{book.rating}</AppText>
              <AppText style={styles.raters}>· {book.raters?.toLocaleString()}명</AppText>
            </View>
          ) : null}
          <View style={styles.chips}>
            <Chip label={`${book.pages}p`} />
            {book.genre ? <Chip label={book.genre} /> : null}
            {book.level ? <Chip label={`난이도 ${LEVEL_LABEL[book.level]}`} tone="primary" /> : null}
          </View>
        </View>
      </View>

      {book.summary ? (
        <View style={styles.block}>
          <AppText style={styles.blockTitle}>줄거리</AppText>
          <AppText style={styles.blockBody}>{book.summary}</AppText>
        </View>
      ) : null}

      {book.primer ? (
        <AltPanel style={styles.primer}>
          <View style={styles.primerHead}>
            <Icon name="bulb" size={15} color={color.primary} />
            <AppText style={styles.primerTitle}>읽기 전에</AppText>
          </View>
          <AppText style={styles.primerBody}>{book.primer}</AppText>
        </AltPanel>
      ) : null}
    </View>
  );
}

/** 칩은 짧아야 한다 — "보통"은 "중"으로 줄인다. */
const LEVEL_LABEL = { 쉬움: '하', 보통: '중', 어려움: '상' } as const;

const styles = StyleSheet.create({
  wrap: { gap: 24 },
  question: { ...type.title3, color: color.text.primary, letterSpacing: -0.69, lineHeight: 32 },
  sub: { ...type.label1, color: color.text.meta, marginTop: 4 },
  row: { flexDirection: 'row', gap: 18 },
  meta: { flex: 1, gap: 8, paddingTop: 4, minWidth: 0 },
  title: { ...type.heading2, fontWeight: '700', fontSize: 19, letterSpacing: -0.38, lineHeight: 25 },
  byline: { ...type.label2, color: color.text.secondary },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  ratingValue: { ...type.label2, fontWeight: '600', color: color.text.primary },
  raters: { ...type.caption1, color: color.text.meta },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  block: { gap: 8 },
  blockTitle: { ...type.label1, fontWeight: '700', color: color.text.primary },
  blockBody: { ...type.label1, lineHeight: 23, color: color.text.secondary },
  primer: { padding: 16, gap: 10 },
  primerHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  primerTitle: { ...type.label2, fontWeight: '700', color: color.text.primary },
  primerBody: { ...type.label2, lineHeight: 21, color: color.text.secondary },
});
