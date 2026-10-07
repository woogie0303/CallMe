import { ActivityIndicator, StyleSheet, View } from 'react-native';

import type { Book } from '@/entities/book/model/types';
import { CoverThumb } from '@/entities/book/ui/cover-thumb';
import { color, type } from '@/shared/config';
import { AppText, Quote, Tap, TrashIcon } from '@/shared/ui';

/** 한 줄에 필요한 것 전부. 책은 찾아 나서지 않고 받아 쓴다. */
export type PendingRow = {
  id: string;
  text: string;
  page?: number;
  capturedLabel: string;
  /** 왜 기다리는지 — 서버가 준 말을 그대로 보여준다. 없으면 알약을 세우지 않는다. */
  reason?: string;
  /** 우리 쪽 문제로 못 풀었다(연결 실패·중간에 끊김) — 한도가 찬 것(질문 소진)과 구분한다. 빨강은 이것 하나에만 쓴다 */
  failed?: boolean;
  book?: Book;
};

/**
 * 할 일이 남은 문장들 — 답을 기다리는 문장과, 답은 왔는데 표현을 안 고른 문장이
 * 같은 모양으로 선다. 줄을 누르면 그 문장으로 들어가고, 휴지통은 그 문장을 지운다.
 *
 * 이유는 작은 알약으로 보이고, 연결 실패만 연한 빨강이다 — 질문 소진은 실패가
 * 아니라 한도라서 빨강으로 말하지 않는다.
 */
export function PendingList({
  asks,
  onPressAsk,
  onRemove,
  busyId,
}: {
  asks: PendingRow[];
  onPressAsk?: (id: string) => void;
  /** 이 줄의 문장을 지운다. 확인은 부르는 쪽이 한다. */
  onRemove?: (id: string) => void;
  /** 지금 다시 묻는 중인 줄 — 휴지통 자리에 도는 표시가 서고 다시 눌리지 않는다 */
  busyId?: string;
}) {
  return (
    <View style={styles.list}>
      {asks.map((ask) => {
        const book = ask.book;
        const busy = busyId === ask.id;
        return (
          <Tap
            key={ask.id}
            style={styles.card}
            disabled={Boolean(busyId)}
            onPress={() => onPressAsk?.(ask.id)}
          >
            {book ? <CoverThumb book={book} style={styles.thumb} /> : null}
            <View style={styles.body}>
              <Quote style={styles.text}>{ask.text}</Quote>
              <View style={styles.foot}>
                <AppText style={styles.source}>
                  {book ? `${book.title} · p.${ask.page}` : '책 미정'}
                </AppText>
                <View style={styles.status}>
                  <AppText style={styles.when}>{ask.capturedLabel}</AppText>
                  {ask.reason ? (
                    <View
                      style={[
                        styles.badge,
                        ask.failed ? styles.badgeFailed : null,
                      ]}
                    >
                      <AppText
                        style={[
                          styles.reason,
                          ask.failed ? styles.reasonFailed : null,
                        ]}
                      >
                        {ask.reason}
                      </AppText>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
            {busy ? (
              <ActivityIndicator
                size="small"
                color={color.text.assistive}
                style={styles.side}
              />
            ) : onRemove ? (
              <Tap
                hitSlop={10}
                style={styles.side}
                disabled={Boolean(busyId)}
                onPress={() => onRemove(ask.id)}
                accessibilityRole="button"
                accessibilityLabel="이 문장 지우기"
              >
                <TrashIcon size={18} color={color.text.meta} />
              </Tap>
            ) : null}
          </Tap>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    backgroundColor: color.surface.base,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border.subtle,
    overflow: 'hidden',
  },
  thumb: { marginTop: 14, marginLeft: 14 },
  body: {
    flex: 1,
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 14,
    minWidth: 0,
  },
  /** 휴지통·도는 표시 — 문장 첫 줄 높이에 맞춰 오른쪽 위에 선다 */
  side: { marginTop: 16, marginRight: 14 },
  text: { fontSize: 15, lineHeight: 23, color: color.text.body },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  source: { ...type.caption2, color: color.text.meta },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  when: { ...type.caption2, color: color.text.meta },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: color.fill.default,
  },
  badgeFailed: { backgroundColor: color.status.negativeBg },
  reason: { ...type.caption2, color: color.text.meta },
  reasonFailed: { color: color.status.negative, fontWeight: '600' },
});
