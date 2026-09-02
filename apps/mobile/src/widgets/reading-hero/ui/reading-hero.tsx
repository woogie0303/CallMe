import { StyleSheet, View } from "react-native";

import type { Book } from "@/entities/book/model/types";
import { BookCover } from "@/entities/book/ui/book-cover";
import type { ReadingProgress } from "@/entities/reading/model/mock";
import { color, type } from "@/shared/config";
import {
  AppText,
  CameraIcon,
  Icon,
  ProgressBar,
  Quote,
  Tap,
} from "@/shared/ui";

/**
 * 홈에서 가장 먼저 보이는 것 — 지금 읽는 책 한 권.
 *
 * 화면 높이에 억지로 맞추지 않는다. 채울 내용이 없는데 판만 늘리면
 * 그만큼이 빈자리로 남는다 — 내용이 정하는 높이가 곧 이 판의 높이다.
 */
export function ReadingHero({
  book,
  progress,
  onPressBook,
  onAsk,
  onCapture,
}: {
  book: Book;
  progress: ReadingProgress;
  onPressBook?: () => void;
  onAsk?: () => void;
  onCapture?: () => void;
}) {
  const ratio = progress.currentPage / progress.totalPages;

  return (
    <View style={styles.panel}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Tap onPress={onPressBook} style={styles.titleBlock}>
            <Quote style={styles.title}>{book.title}</Quote>
            <AppText style={styles.author}>{book.author}</AppText>
          </Tap>

          {/* 이 책에 대고 지금 할 수 있는 일 둘 — 찍어서 묻기, 적어서 묻기 */}
          <View style={styles.actions}>
            <Tap
              style={styles.action}
              onPress={onCapture}
              accessibilityLabel="페이지 촬영"
            >
              <CameraIcon size={19} color={color.text.onInk} />
            </Tap>
            <View style={styles.divider} />
            <Tap
              style={styles.action}
              onPress={onAsk}
              accessibilityLabel="문장 물어보기"
            >
              <Icon name="write" size={18} color={color.text.onInk} />
            </Tap>
          </View>
        </View>

        <Tap onPress={onPressBook} style={styles.coverTap}>
          <BookCover
            book={book}
            width={130}
            height={200}
            radius={10}
            showTitle={false}
          />
        </Tap>
      </View>

      <View style={styles.progress}>
        <ProgressBar value={ratio} />
        <AppText style={styles.progressLabel}>
          p.{progress.currentPage} / {progress.totalPages} ·{" "}
          {Math.round(ratio * 100)}% · {progress.lastReadLabel}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /** 화면 높이에 맞추지 않는다 — 내용만큼만 쓴다. 아래 여백은 홈이 정한다. */
  panel: {
    paddingHorizontal: 20,
    gap: 20,
  },

  /**
   * 왼쪽 칸을 표지 높이만큼 늘리고, 그 안에서 제목은 위·버튼은 아래로 벌린다.
   * 표지의 윗변·밑변과 글이 같은 선에서 만나 네모 하나로 읽힌다.
   */
  row: { flexDirection: "row", gap: 16, alignItems: "stretch" },
  left: { flex: 1, minWidth: 0, alignSelf: "flex-end", gap: 16 },
  /** 표지는 제 높이(200)만 쓴다 — stretch에 딸려 늘어나지 않게 못 박는다 */
  coverTap: { alignSelf: "flex-start" },
  titleBlock: { gap: 4 },
  title: {
    fontSize: 24,
    lineHeight: 31,
    fontWeight: "600",
    color: color.text.primary,
    letterSpacing: -0.3,
  },
  author: { ...type.label2, color: color.text.secondary },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 14,
    backgroundColor: color.primary,
    overflow: "hidden",
  },
  action: {
    width: 52,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 22,
    backgroundColor: "rgba(255,255,255,0.28)",
  },

  progress: { gap: 6 },
  progressLabel: { ...type.caption2, color: color.text.meta },
});
