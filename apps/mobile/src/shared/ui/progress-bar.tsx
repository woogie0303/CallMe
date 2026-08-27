import { StyleSheet, View } from 'react-native';

import { color } from '@/shared/config';

export function ProgressBar({
  value,
  height = 4,
  track = color.fill.bold,
  fill = color.primary,
}: {
  /** 0~1 */
  value: number;
  height?: number;
  track?: string;
  fill?: string;
}) {
  return (
    <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: track }]}>
      <View
        style={{
          width: `${Math.min(1, Math.max(0, value)) * 100}%`,
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: fill,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: 'hidden', width: '100%' },
});
