import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { ReadingCalendarDay } from '@/entities/reading/model/types';
import { accent, color, type } from '@/shared/config';
import { AppText, Icon, Tap } from '@/shared/ui';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 읽은 날 달력 — 한 달씩, 이전·다음 버튼으로 옮겨 본다.
 *
 * 머리는 달 이름 하나다("9월"). 따로 '읽은 날'이라는 제목을 두지 않는 이유는,
 * 모눈을 보면 그게 무엇인지 이미 알고 — 지금 몇 월을 보고 있는지가 더 필요한
 * 말이라서다.
 *
 * **칸은 달이 바뀌는 즉시 선다.** 칸의 모양(그 달이 무슨 요일에 시작하고 며칠까지
 * 있는지)은 달만 알면 정해지고, 서버에서 오는 건 칸의 짙기뿐이다. 그래서 받아오는
 * 동안 화면 전체를 도는 표시로 덮지 않고, 빈 칸을 먼저 세운 뒤 짙기만 채운다 —
 * 달을 넘길 때마다 화면이 통째로 깜박이면 넘겨보는 맛이 없다.
 *
 * 몇 쪽을 읽었는지는 **누르기 전엔 안 보인다.** 짙기만으로 이미 '읽었다/안
 * 읽었다'는 보이고, 정확한 숫자는 궁금해서 눌러본 사람에게만 준다. 달을 옮기면
 * 그 말도 사라진다 — 다른 달의 날짜가 남아 있으면 지금 보는 달과 어긋난다.
 *
 * 앞으로는 가입한 달까지, 뒤로는 이번 달까지만 간다(`canPrev`·`canNext`).
 */
export function ReadingCalendar({
  year,
  month,
  days,
  canPrev,
  canNext,
  onPrevMonth,
  onNextMonth,
}: {
  year: number;
  /** 1~12 */
  month: number;
  /** 받아오는 중이면 없다 — 그동안 칸은 빈 채로 선다 */
  days?: ReadingCalendarDay[];
  canPrev: boolean;
  canNext: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  /** 누른 날 — 어느 달에서 눌렀는지를 함께 들고 있어서, 달이 바뀌면 저절로 사라진다 */
  const [picked, setPicked] = useState<{ key: string; day: ReadingCalendarDay } | null>(null);
  const monthKey = `${year}-${month}`;
  const shown = picked?.key === monthKey ? picked.day : null;

  const now = new Date();
  const today = now.toDateString();
  const label = year === now.getFullYear() ? `${month}월` : `${year}년 ${month}월`;

  /** 그 달의 칸 — 서버를 기다리지 않고 달만으로 정한다 */
  const count = new Date(year, month, 0).getDate();
  const pagesByDate = new Map((days ?? []).map((day) => [day.date.toDateString(), day.pages]));
  const monthDays: ReadingCalendarDay[] = Array.from({ length: count }, (_, i) => {
    const date = new Date(year, month - 1, i + 1);
    return { date, pages: pagesByDate.get(date.toDateString()) ?? 0 };
  });
  const most = Math.max(1, ...monthDays.map((day) => day.pages));

  /** 첫 줄이 일요일에서 시작하도록 앞을 비운다 */
  const lead = monthDays[0].date.getDay();
  const cells: (ReadingCalendarDay | null)[] = [...Array(lead).fill(null), ...monthDays];
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <AppText style={styles.month}>{label}</AppText>
        <View style={styles.arrows}>
          <Tap
            style={styles.nav}
            onPress={onPrevMonth}
            disabled={!canPrev}
            accessibilityRole="button"
            accessibilityLabel="이전 달">
            <View style={styles.flip}>
              <Icon
                name="chevronRight"
                size={15}
                color={canPrev ? color.text.secondary : color.fill.bold}
              />
            </View>
          </Tap>
          <Tap
            style={styles.nav}
            onPress={onNextMonth}
            disabled={!canNext}
            accessibilityRole="button"
            accessibilityLabel="다음 달">
            <Icon
              name="chevronRight"
              size={15}
              color={canNext ? color.text.secondary : color.fill.bold}
            />
          </Tap>
        </View>
      </View>

      <View style={[styles.grid, !days ? styles.gridLoading : null]}>
        <View style={styles.row}>
          {WEEKDAYS.map((day) => (
            <AppText key={day} style={styles.weekday}>
              {day}
            </AppText>
          ))}
        </View>

        {weeks.map((week, w) => (
          <View key={w} style={styles.row}>
            {week.map((day, d) =>
              day ? (
                <Tap
                  key={d}
                  style={[
                    styles.cell,
                    { backgroundColor: shade(day.pages / most, day.pages) },
                    day.date.toDateString() === today ? styles.today : null,
                    shown?.date.getTime() === day.date.getTime() ? styles.cellPicked : null,
                  ]}
                  onPress={() =>
                    setPicked((prev) =>
                      prev?.key === monthKey && prev.day.date.getTime() === day.date.getTime()
                        ? null
                        : { key: monthKey, day },
                    )
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`${dayLabel(day.date)}, ${day.pages}쪽`}
                />
              ) : (
                <View key={d} style={[styles.cell, styles.blank]} />
              ),
            )}
          </View>
        ))}
      </View>

      {shown ? (
        <AppText style={styles.pickedText}>
          {dayLabel(shown.date)} · {shown.pages ? `${shown.pages}쪽 읽었어요` : '안 읽은 날이에요'}
        </AppText>
      ) : null}
    </View>
  );
}

/** 안 읽은 날은 바탕 회색, 읽은 날은 강조색을 네 단계 짙기로 */
function shade(ratio: number, pages: number): string {
  if (pages <= 0) return color.fill.default;
  if (ratio > 0.75) return accent(1);
  if (ratio > 0.5) return accent(0.7);
  if (ratio > 0.25) return accent(0.45);
  return accent(0.25);
}

function dayLabel(date: Date): string {
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`;
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },

  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  /** 절(섹션) 제목 자리 — '주로 읽은 장르'와 같은 크기로 선다 */
  month: { ...type.heading2, color: color.text.primary },
  arrows: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  nav: { padding: 8 },
  /** 오른쪽 꺾쇠를 뒤집어 왼쪽 화살표로 쓴다 — 왼쪽 꺾쇠 아이콘이 따로 없다 */
  flip: { transform: [{ scaleX: -1 }] },

  grid: { gap: 6 },
  /** 받아오는 동안은 칸을 옅게 — 도는 표시 없이 '아직 채우는 중'만 말한다 */
  gridLoading: { opacity: 0.5 },
  row: { flexDirection: 'row', gap: 6 },
  weekday: { flex: 1, textAlign: 'center', ...type.caption2, color: color.text.meta },
  cell: { flex: 1, aspectRatio: 1, borderRadius: 7 },
  blank: { backgroundColor: 'transparent' },
  /** 오늘은 테두리로만 — 아직 안 읽었으면 다른 빈 날과 같은 색이어야 한다 */
  today: { borderWidth: 1.5, borderColor: color.text.primary },
  cellPicked: { borderWidth: 2, borderColor: color.primary },

  pickedText: {
    ...type.label2,
    fontWeight: '600',
    color: color.text.secondary,
    textAlign: 'center',
  },
});
