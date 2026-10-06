import { useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { color, type } from '@/shared/config';
import { AppText } from '@/shared/ui';
import type { ReminderTime } from '@/shared/notifications/reminder';

const ITEM = 46;
/** 위아래로 둘씩 보인다 — 가운데 하나가 고른 것 */
const VISIBLE = 5;
const PAD = ITEM * Math.floor(VISIBLE / 2);

const PERIODS = ['오전', '오후'];
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, '0'),
);

/** 24시간 → 오전·오후와 12시간 */
function split({ hour, minute }: ReminderTime) {
  return {
    period: hour < 12 ? 0 : 1,
    hour: (hour % 12 || 12) - 1,
    minute,
  };
}

function join(period: number, hourIndex: number, minute: number): ReminderTime {
  const h12 = hourIndex + 1;
  return { hour: (h12 % 12) + (period === 1 ? 12 : 0), minute };
}

/** 마이 탭에 보이는 한 줄 — '오후 8:00' */
export function formatReminderTime(time: ReminderTime): string {
  const { period, hour } = split(time);
  return `${PERIODS[period]} ${hour + 1}:${String(time.minute).padStart(2, '0')}`;
}

/**
 * 알림 시각을 고르는 휠 — 오전·오후 / 시 / 분.
 *
 * iOS 기본 선택기를 쓰지 않는다. 기본 선택기는 회색 알약과 시스템 서체라 이 앱의
 * 종이색 위에서 혼자 다른 앱처럼 보였다. 여기서는 고른 줄만 먹색 굵은 글씨로 서고
 * 나머지는 흐리게 물러난다 — 앱의 다른 고르기(`SectionSwitch`, 시트)와 같은 말투다.
 */
export function TimeWheel({
  value,
  onChange,
}: {
  value: ReminderTime;
  onChange: (time: ReminderTime) => void;
}) {
  const start = split(value);
  /** 휠 셋이 따로 굴러도 마지막 값을 다 알고 있어야 한 번에 합쳐 올린다 */
  const now = useRef(start);

  const emit = (next: Partial<typeof start>) => {
    now.current = { ...now.current, ...next };
    onChange(join(now.current.period, now.current.hour, now.current.minute));
  };

  return (
    <View style={styles.wheel}>
      {/* 가운데 한 줄을 칠해 '여기가 고른 값'이라고 말한다 */}
      <View pointerEvents="none" style={styles.band} />
      <Column
        label="오전·오후"
        items={PERIODS}
        index={start.period}
        onSelect={(period) => emit({ period })}
        flex={1}
      />
      <Column
        label="시"
        items={HOURS}
        index={start.hour}
        onSelect={(hour) => emit({ hour })}
        flex={1.2}
      />
      <Column
        label="분"
        items={MINUTES}
        index={start.minute}
        onSelect={(minute) => emit({ minute })}
        flex={1.2}
      />
    </View>
  );
}

function Column({
  label,
  items,
  index,
  onSelect,
  flex,
}: {
  label: string;
  items: string[];
  index: number;
  onSelect: (index: number) => void;
  flex: number;
}) {
  const ref = useRef<ScrollView>(null);
  /** 처음 자리만 쓴다 — 굴리는 도중 부모 값이 바뀌어 다시 끌려가지 않게 */
  const [first] = useState(index);
  /** 굴리는 동안 가운데에 걸린 줄 — 손을 떼기 전에도 글씨가 따라 바뀐다 */
  const [live, setLive] = useState(index);

  const at = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    Math.min(
      items.length - 1,
      Math.max(0, Math.round(e.nativeEvent.contentOffset.y / ITEM)),
    );

  const step = (delta: number) => {
    const next = Math.min(items.length - 1, Math.max(0, live + delta));
    ref.current?.scrollTo({ y: next * ITEM, animated: true });
    setLive(next);
    onSelect(next);
  };

  return (
    <ScrollView
      ref={ref}
      style={{ flex }}
      contentContainerStyle={{ paddingVertical: PAD }}
      contentOffset={{ x: 0, y: first * ITEM }}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM}
      decelerationRate="fast"
      scrollEventThrottle={16}
      onScroll={(e) => {
        const next = at(e);
        if (next !== live) setLive(next);
      }}
      onMomentumScrollEnd={(e) => onSelect(at(e))}
      onScrollEndDrag={(e) => {
        /** 손을 떼는 순간 멈춰 있으면 관성 이벤트가 오지 않는다 */
        if (Math.abs(e.nativeEvent.velocity?.y ?? 0) < 0.05) onSelect(at(e));
      }}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: items[live] }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) =>
        step(e.nativeEvent.actionName === 'increment' ? 1 : -1)
      }
    >
      {items.map((item, i) => (
        <View key={item} style={styles.item}>
          <AppText style={i === live ? styles.on : styles.off}>{item}</AppText>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wheel: {
    flexDirection: 'row',
    height: ITEM * VISIBLE,
    paddingHorizontal: 8,
  },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: PAD,
    height: ITEM,
    borderRadius: 14,
    backgroundColor: color.surface.alt,
  },
  item: { height: ITEM, alignItems: 'center', justifyContent: 'center' },
  on: { ...type.heading2, fontWeight: '700', color: color.text.primary },
  off: { ...type.heading2, fontWeight: '500', color: color.text.meta },
});
