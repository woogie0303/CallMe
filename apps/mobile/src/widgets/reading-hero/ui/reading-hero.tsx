import { StyleSheet, View } from 'react-native';

import { BookCover } from '@/entities/book/ui/book-cover';
import type { Book } from '@/entities/book/model/types';
import type { ReadingProgress } from '@/entities/reading/model/mock';
import { color, type } from '@/shared/config';
import { AppText, Icon, InkPanel, ProgressBar, Tap , CameraIcon } from '@/shared/ui';

/**
 * 홈에서 가장 먼저 보이는 것. 지금 읽는 책 하나와,
 * 그 책에 대고 바로 말을 걸 수 있는 입력 한 줄.
 */
export function ReadingHero({
  book,
  progress,
  onWriteMemo,
  onCapture,
  onPressBook,
}: {
  book: Book;
  progress: ReadingProgress;
  onWriteMemo?: () => void;
  onCapture?: () => void;
  onPressBook?: () => void;
}) {
  const ratio = progress.currentPage / progress.totalPages;
  const percent = Math.round(ratio * 100);

  return (
    <InkPanel style={styles.panel}>
      <View style={styles.top}>
        <Tap onPress={onPressBook}>
          <BookCover book={book} width={76} height={104} radius={10} />
        </Tap>
        <View style={styles.meta}>
          <AppText style={styles.eyebrow}>읽고 있는 책</AppText>
          <AppText style={styles.title}>{book.title}</AppText>
          <AppText style={styles.author}>{book.author}</AppText>
          <View style={styles.progress}>
            <ProgressBar value={ratio} track={color.fill.onInk} />
            <AppText style={styles.progressLabel}>
              p.{progress.currentPage} / {progress.totalPages} · {percent}% ·{' '}
              {progress.lastReadLabel}
            </AppText>
          </View>
        </View>
      </View>

      <Tap style={styles.composer} onPress={onWriteMemo}>
        <AppText style={styles.placeholder}>이 책에 대한 메모를 남겨보세요</AppText>
        <Tap style={styles.ghostButton} onPress={onCapture} hitSlop={6}>
          <CameraIcon size={17} color={color.text.onInkBody} />
        </Tap>
        <View style={styles.sendButton}>
          <Icon name="send" size={15} color={color.text.onInk} />
        </View>
      </Tap>
    </InkPanel>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 20, gap: 14, borderRadius: 28 },
  top: { flexDirection: 'row', gap: 16 },
  meta: { flex: 1, gap: 8, minWidth: 0, paddingTop: 2 },
  eyebrow: { ...type.caption2, fontWeight: '600', color: color.text.onInkMeta },
  title: {
    ...type.headline1,
    fontWeight: '700',
    color: color.text.onInk,
    letterSpacing: -0.36,
    lineHeight: 23,
  },
  author: { ...type.caption1, color: color.text.onInkSecondary },
  progress: { gap: 5, marginTop: 'auto' },
  progressLabel: { ...type.caption2, color: color.text.onInkMeta },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    borderRadius: 14,
    backgroundColor: color.fill.onInk,
    paddingLeft: 16,
    paddingRight: 8,
  },
  placeholder: { flex: 1, ...type.label2, color: color.text.onInkAssistive },
  ghostButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
