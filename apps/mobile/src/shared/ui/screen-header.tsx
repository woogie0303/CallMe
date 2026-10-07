import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, gutter, type } from '@/shared/config';
import { Icon } from './icon';
import { Tap } from './pressable-row';
import { AppText } from './text';

/**
 * 화면 맨 위 한 줄. 디자인의 여섯 화면이 모두 같은 리듬을 쓴다 —
 * 왼쪽에 나가는 길, 가운데에 지금 어디인지, 오른쪽에 지금 할 수 있는 일 하나.
 */
export function ScreenHeader({
  leading = 'back',
  onLeadingPress,
  title,
  trailing,
  gap = 12,
}: {
  leading?: 'back' | 'close' | ReactNode | null;
  onLeadingPress?: () => void;
  title?: string;
  trailing?: ReactNode;
  /** 헤더 아래 여백 — 화면마다 조금씩 다르다 */
  gap?: number;
}) {
  const insets = useSafeAreaInsets();
  const lead =
    leading === 'back' ? (
      <Icon name="arrowLeft" size={22} color={color.text.primary} />
    ) : leading === 'close' ? (
      <Icon name="close" size={20} color={color.text.primary} />
    ) : (
      leading
    );

  return (
    <View
      style={[styles.row, { paddingTop: insets.top + 6, paddingBottom: gap }]}
    >
      <View style={styles.side}>
        {lead ? (
          <Tap
            hitSlop={12}
            onPress={onLeadingPress}
            accessibilityRole="button"
            /* 그림뿐인 단추라 읽어줄 이름을 따로 준다 */
            accessibilityLabel={
              leading === 'back'
                ? '뒤로'
                : leading === 'close'
                  ? '닫기'
                  : undefined
            }
          >
            {lead}
          </Tap>
        ) : null}
      </View>
      {title ? <AppText style={styles.title}>{title}</AppText> : null}
      <View style={[styles.side, styles.trailing]}>{trailing}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: gutter,
  },
  side: { minWidth: 40, justifyContent: 'center' },
  trailing: { alignItems: 'flex-end' },
  title: { ...type.label2, fontWeight: '600', color: color.text.meta },
});

/** 헤더 오른쪽의 글자 버튼 — 저장, 더보기처럼 되돌릴 수 있는 행동 */
export function HeaderAction({
  label,
  tone = color.primary,
  onPress,
}: {
  label: string;
  tone?: string;
  onPress?: () => void;
}) {
  return (
    <Tap
      hitSlop={12}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <AppText style={[type.label2, { fontWeight: '600', color: tone }]}>
        {label}
      </AppText>
    </Tap>
  );
}
