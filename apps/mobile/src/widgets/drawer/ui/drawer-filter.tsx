import { StyleSheet, View } from 'react-native';

import { color, type } from '@/shared/config';
import { AppText, Tap } from '@/shared/ui';

export type DrawerFilter = '전체' | '헷갈려요' | '다시 만난 것' | '외웠어요';

export const DRAWER_FILTERS: DrawerFilter[] = ['전체', '헷갈려요', '다시 만난 것', '외웠어요'];

/** 지금 보는 갈래만 잉크색으로 찬다. 나머지는 배경으로 물러난다. */
export function DrawerFilterRow({
  value,
  onChange,
}: {
  value: DrawerFilter;
  onChange: (next: DrawerFilter) => void;
}) {
  return (
    <View style={styles.row}>
      {DRAWER_FILTERS.map((filter) => {
        const on = filter === value;
        return (
          <Tap
            key={filter}
            style={[styles.chip, on ? styles.chipOn : null]}
            onPress={() => onChange(filter)}>
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
