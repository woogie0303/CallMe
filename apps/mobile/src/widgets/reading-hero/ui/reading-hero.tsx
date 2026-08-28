import { StyleSheet, View } from 'react-native';

import type { Book } from '@/entities/book/model/types';
import { BookCover } from '@/entities/book/ui/book-cover';
import { SpineRibbon } from '@/entities/book/ui/spine-ribbon';
import type { ReadingProgress } from '@/entities/reading/model/mock';
import { color, type } from '@/shared/config';
import { AppText, CameraIcon, Icon, InkPanel, ProgressBar, Quote, Tap } from '@/shared/ui';

/**
 * 홈에서 가장 먼저 보이는 것 — 지금 읽는 책 한 권.
 *
 * 짜임새는 북모리의 '읽고 있는 책' 카드에서 가져왔다: 위쪽에 꽂힌 책갈피,
 * 왼쪽 표지, 오른쪽에 언제부터 어디까지, 그리고 모서리에 지금 할 수 있는 일.
 * 다만 표면은 잉크다 — 이 앱에서 잉크 판은 '지금 집중할 것 하나'의 자리이고,
 * 홈에는 그런 게 이 카드뿐이다.
 */
export function ReadingHero({
  book,
  progress,
  savedCount,
  onPressBook,
  onAsk,
  onCapture,
}: {
  book: Book;
  progress: ReadingProgress;
  /** 이 책에서 담아둔 어휘 항목 수 */
  savedCount: number;
  onPressBook?: () => void;
  onAsk?: () => void;
  onCapture?: () => void;
}) {
  const ratio = progress.currentPage / progress.totalPages;

  return (
    <InkPanel style={styles.panel}>
      <View style={styles.ribbon}>
        <SpineRibbon book={book} />
      </View>

      <Tap onPress={onPressBook} style={styles.titleBlock}>
        <Quote style={styles.title}>{book.title}</Quote>
        <AppText style={styles.author}>{book.author}</AppText>
      </Tap>

      <View style={styles.row}>
        <Tap onPress={onPressBook}>
          <BookCover book={book} width={78} height={108} radius={10} showTitle={false} />
        </Tap>

        <View style={styles.meta}>
          <View style={styles.when}>
            <AppText style={styles.started}>{progress.startedLabel}</AppText>
            <AppText style={styles.status}>{progress.lastReadLabel}</AppText>
          </View>

          <View style={styles.progress}>
            <ProgressBar value={ratio} track={color.fill.onInk} />
            <AppText style={styles.progressLabel}>
              p.{progress.currentPage} / {progress.totalPages} · {Math.round(ratio * 100)}%
            </AppText>
          </View>

          <View style={styles.saved}>
            <Icon name="bookmark" size={13} color={color.text.onInkMeta} />
            <AppText style={styles.savedLabel}>
              {savedCount > 0 ? `담아둔 표현 ${savedCount}개` : '아직 담은 표현 없음'}
            </AppText>
          </View>
        </View>
      </View>

      {/* 이 책에 대고 지금 할 수 있는 일 둘 — 찍어서 묻기, 적어서 묻기 */}
      <View style={styles.actions}>
        <Tap style={styles.action} onPress={onCapture} accessibilityLabel="페이지 촬영">
          <CameraIcon size={19} color={color.text.onInk} />
        </Tap>
        <View style={styles.divider} />
        <Tap style={styles.action} onPress={onAsk} accessibilityLabel="문장 물어보기">
          <Icon name="write" size={18} color={color.text.onInk} />
        </Tap>
      </View>
    </InkPanel>
  );
}

const styles = StyleSheet.create({
  panel: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 20,
    borderRadius: 28,
  },
  /** 카드 윗변에 걸치도록 위쪽 패딩 없이 흘려 넣는다 */
  ribbon: { marginBottom: 14 },

  titleBlock: { gap: 4, marginBottom: 16 },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    color: color.text.onInk,
    letterSpacing: -0.2,
  },
  author: { ...type.caption1, color: color.text.onInkMeta },

  row: { flexDirection: 'row', gap: 16 },
  meta: { flex: 1, minWidth: 0, gap: 12, paddingTop: 2 },
  when: { gap: 3 },
  started: { ...type.caption1, color: color.text.onInkMeta },
  status: { ...type.label2, fontWeight: '600', color: color.text.onInkBody },
  progress: { gap: 6 },
  progressLabel: { ...type.caption2, color: color.text.onInkMeta },
  saved: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  savedLabel: { ...type.caption2, color: color.text.onInkMeta },

  actions: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: color.primary,
    overflow: 'hidden',
  },
  action: { width: 48, height: 44, alignItems: 'center', justifyContent: 'center' },
  divider: { width: StyleSheet.hairlineWidth, height: 22, backgroundColor: 'rgba(255,255,255,0.28)' },
});
