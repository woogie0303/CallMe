import { StyleSheet, View } from 'react-native';

import { color, type } from '@/shared/config';
import { AppText, Icon, Tap, type FilledIconName } from '@/shared/ui';

export type BookTab = 'liked' | 'retell';

const TABS: { value: BookTab; icon: FilledIconName; title: string }[] = [
  { value: 'liked', icon: 'heart', title: '마음에 들었던 문장' },
  { value: 'retell', icon: 'write', title: '리텔링' },
];

/**
 * 지금 보고 있는 갈래의 이름이 제목 자리에 그대로 서고, 갈아타는 버튼 둘은
 * 줄 끝으로 물러난다. 라벨을 둘 다 펴 놓으면 제목이 사라지고 컨트롤만 남는데,
 * 이 화면에서 먼저 읽혀야 하는 건 지금 무엇을 보고 있는가다. 아이콘 둘은
 * 그 다음 — 옮겨 탈 수 있다는 사실만 알리면 된다.
 *
 * 가운데 선은 장식이 아니라 제목과 버튼을 같은 줄에 묶어두는 자리다.
 */
export function BookTabs({
  value,
  onChange,
  likedCount,
}: {
  value: BookTab;
  onChange: (next: BookTab) => void;
  likedCount: number;
}) {
  const current = TABS.find((t) => t.value === value) ?? TABS[0];

  return (
    <View style={styles.row}>
      <AppText style={styles.title}>{current.title}</AppText>
      {value === 'liked' && likedCount ? (
        <AppText style={styles.aside}>{likedCount}개</AppText>
      ) : null}

      <View style={styles.rule} />

      <View style={styles.switch}>
        {TABS.map((tab) => {
          const on = tab.value === value;
          return (
            <Tap
              key={tab.value}
              style={[styles.button, on ? styles.buttonOn : null]}
              onPress={() => onChange(tab.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={tab.title}>
              <Icon
                name={tab.icon}
                size={16}
                color={on ? color.text.primary : color.text.assistive}
              />
            </Tap>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { ...type.body2, fontWeight: '700', color: color.text.primary, letterSpacing: -0.15 },
  aside: { ...type.caption1, color: color.text.meta },
  /** 제목과 버튼 사이를 잇는 선 — 남는 폭을 전부 가져간다 */
  rule: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: color.border.default },
  switch: { flexDirection: 'row', gap: 4 },
  button: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  buttonOn: { backgroundColor: color.fill.default },
});
