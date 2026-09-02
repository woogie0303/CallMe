import { StyleSheet, View } from 'react-native';

import type { Book } from '@/entities/book/model/types';
import { BookCover } from '@/entities/book/ui/book-cover';
import type { ReadingProgress } from '@/entities/reading/model/mock';
import { color, type } from '@/shared/config';
import { AppText, CameraIcon, Icon, ProgressBar, Quote, Tap } from '@/shared/ui';

/**
 * 책 한 권을 크게 세우는 판. 홈의 '읽고 있는 책'과 책 화면의 머리가 이걸
 * 함께 쓴다 — 같은 책을 두 화면에서 다르게 그리면 같은 책으로 보이지 않는다.
 *
 * 화면 높이에 억지로 맞추지 않는다. 채울 내용이 없는데 판만 늘리면
 * 그만큼이 빈자리로 남는다 — 내용이 정하는 높이가 곧 이 판의 높이다.
 *
 * 진도와 버튼은 있을 때만 그린다. 읽고 있지 않은 책에 0% 막대를 세우면
 * 읽다 만 책처럼 보이고, 그건 사실이 아니다.
 */
export function BookHero({
  book,
  progress,
  inset = 20,
  onPressBook,
  onAsk,
  onCapture,
}: {
  book: Book;
  progress?: ReadingProgress;
  /** 좌우 여백. 이미 여백을 가진 화면 안에 놓일 때는 0을 준다. */
  inset?: number;
  onPressBook?: () => void;
  onAsk?: () => void;
  onCapture?: () => void;
}) {
  const ratio = progress ? progress.currentPage / progress.totalPages : 0;
  const actionable = Boolean(onAsk || onCapture);

  return (
    <View style={[styles.panel, { paddingHorizontal: inset }]}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Tap onPress={onPressBook} style={styles.titleBlock}>
            <Quote style={styles.title}>{book.title}</Quote>
            <AppText style={styles.author}>{book.author}</AppText>
          </Tap>

          {/* 이 책에 대고 지금 할 수 있는 일 둘 — 찍어서 묻기, 적어서 묻기 */}
          {actionable ? (
            <View style={styles.actions}>
              <Tap style={styles.action} onPress={onCapture} accessibilityLabel="페이지 촬영">
                <CameraIcon size={19} color={color.text.onInk} />
              </Tap>
              <View style={styles.divider} />
              <Tap style={styles.action} onPress={onAsk} accessibilityLabel="문장 물어보기">
                <Icon name="write" size={18} color={color.text.onInk} />
              </Tap>
            </View>
          ) : null}
        </View>

        <Tap onPress={onPressBook} style={styles.coverTap}>
          <BookCover book={book} width={130} height={200} radius={10} showTitle={false} />
        </Tap>
      </View>

      <View style={styles.progress}>
        {progress ? (
          <>
            <ProgressBar value={ratio} />
            <AppText style={styles.progressLabel}>
              p.{progress.currentPage} / {progress.totalPages} · {Math.round(ratio * 100)}% ·{' '}
              {progress.lastReadLabel}
            </AppText>
          </>
        ) : (
          <AppText style={styles.progressLabel}>{book.pages}p</AppText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /** 화면 높이에 맞추지 않는다 — 내용만큼만 쓴다. 아래 여백은 쓰는 쪽이 정한다. */
  panel: { gap: 20 },

  /**
   * 왼쪽 칸을 표지 높이만큼 늘리고, 그 안에서 제목은 위·버튼은 아래로 벌린다.
   * 표지의 윗변·밑변과 글이 같은 선에서 만나 네모 하나로 읽힌다.
   */
  row: { flexDirection: 'row', gap: 16, alignItems: 'stretch' },
  left: { flex: 1, minWidth: 0, alignSelf: 'flex-end', gap: 16 },
  /** 표지는 제 높이(200)만 쓴다 — stretch에 딸려 늘어나지 않게 못 박는다 */
  coverTap: { alignSelf: 'flex-start' },
  titleBlock: { gap: 4 },
  title: {
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '600',
    color: color.text.primary,
    letterSpacing: -0.3,
  },
  author: { ...type.label2, color: color.text.secondary },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 14,
    backgroundColor: color.primary,
    overflow: 'hidden',
  },
  action: {
    width: 52,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 22,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },

  progress: { gap: 6 },
  progressLabel: { ...type.caption2, color: color.text.meta },
});
