import { StyleSheet, View } from 'react-native';

import { color, type } from '@/shared/config';
import { AppText } from './text';

/** 목록 위의 제목 한 줄. 오른쪽 곁말은 세지 않아도 되는 정보다. */
export function SectionHeader({ title, aside }: { title: string; aside?: string }) {
  return (
    <View style={styles.row}>
      <AppText style={styles.title}>{title}</AppText>
      {aside ? <AppText style={styles.aside}>{aside}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  title: { ...type.body2, fontWeight: '700', color: color.text.primary, letterSpacing: -0.15 },
  aside: { ...type.caption1, color: color.text.meta },
});
