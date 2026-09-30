import { StyleSheet, View } from 'react-native';

import type { Book } from '@/entities/book/model/types';
import { CoverThumb } from '@/entities/book/ui/cover-thumb';
import { color, type } from '@/shared/config';
import { AppText, Quote, SectionHeader, Tap } from '@/shared/ui';

/**
 * 문장 목록. 원문은 세리프로, 출처는 산세리프로 적힌다.
 *
 * 책(`book`)을 넘기면 왼쪽에 표지가 서고 출처에 제목이 붙는다. 책 화면의
 * '마음에 들었던 문장'처럼 한 권 안에서 보는 목록에는 넘기지 않는다 — 모든 줄에
 * 같은 표지가 서면 출처를 알려주지도 못하면서 문장 읽을 폭만 줄인다.
 */
/** 한 줄에 필요한 것 전부. */
export type SentenceRow = {
  id: string;
  text: string;
  page?: number;
  book?: Book;
};

export function SentenceShelf({
  sentences,
  title = '다시 볼 문장',
  aside,
  onPressSentence,
}: {
  sentences: SentenceRow[];
  /** null이면 제목을 그리지 않는다 — 탭 라벨이 이미 이름을 대고 있을 때 */
  title?: string | null;
  aside?: string;
  onPressSentence?: (id: string) => void;
}) {
  return (
    <View style={styles.wrap}>
      {title !== null ? <SectionHeader title={title} aside={aside} /> : null}
      {sentences.map((s) => {
        const book = s.book;
        return (
          <Tap key={s.id} style={styles.row} onPress={() => onPressSentence?.(s.id)}>
            {book ? <CoverThumb book={book} /> : null}
            <View style={styles.body}>
              <Quote numberOfLines={2} style={styles.text}>
                {s.text}
              </Quote>
              {book || s.page ? (
                <AppText style={styles.source}>
                  {[book?.title, s.page ? `p.${s.page}` : null].filter(Boolean).join(' · ')}
                </AppText>
              ) : null}
            </View>
          </Tap>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: color.surface.alt,
  },
  body: { flex: 1, gap: 4, minWidth: 0 },
  text: { fontSize: 14, lineHeight: 19, color: color.text.primary },
  source: { ...type.caption2, color: color.text.meta },
});
