import { StyleSheet, View } from 'react-native';

import { color, type } from '@/shared/config';
import { AppText, Tap } from '@/shared/ui';

/**
 * 문장을 거르는 갈래(ADR-0004).
 *
 * 예전 갈래는 항목의 상태(외웠어요·헷갈려요)였다. 서랍이 문장의 목록이 된
 * 지금 그건 줄이 아니라 줄 **안의** 밑줄에 대한 이야기라, 여기서 물으면
 * 답할 수 없다 — 밑줄 셋이 서로 다른 상태인 문장은 어느 갈래인가.
 * 그래서 갈래도 문장이 답할 수 있는 것으로 바꾼다.
 */
export type DrawerFilter = '아직 안 물어봤어요' | '표현이 있어요' | '다시 만났어요';

/**
 * '전체'를 갈래로 두지 않는다. 서랍을 열면 어차피 전체가 먼저 보이고, 그
 * 상태를 가리키는 칩까지 나란히 세우면 지금 보고 있는 게 갈래인지 전체인지
 * 한 번 더 헤아려야 한다 — 아무것도 안 골랐으면 전체, 골랐으면 그 갈래다.
 */
export const DRAWER_FILTERS: DrawerFilter[] = [
  '아직 안 물어봤어요',
  '표현이 있어요',
  '다시 만났어요',
];

/**
 * 지금 보는 갈래만 잉크색으로 찬다. 나머지는 배경으로 물러난다.
 * 골라둔 칩을 한 번 더 누르면 풀린다 — 그게 곧 '전체'로 돌아가는 길이다.
 */
export function DrawerFilterRow({
  value,
  onChange,
}: {
  value?: DrawerFilter;
  onChange: (next: DrawerFilter | undefined) => void;
}) {
  return (
    <View style={styles.row}>
      {DRAWER_FILTERS.map((filter) => {
        const on = filter === value;
        return (
          <Tap
            key={filter}
            style={[styles.chip, on ? styles.chipOn : null]}
            onPress={() => onChange(on ? undefined : filter)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityHint={on ? '눌러서 전체 보기' : undefined}>
            <AppText style={[styles.label, on ? styles.labelOn : null]}>{filter}</AppText>
          </Tap>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 11,
    backgroundColor: color.fill.default,
  },
  chipOn: { backgroundColor: color.surface.ink },
  label: { ...type.label2, fontWeight: '600', color: color.text.secondary },
  labelOn: { color: color.text.onInk },
});
