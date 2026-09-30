import type { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { color, type } from '@/shared/config';
import { Icon, type FilledIconName } from './icon';
import { Tap } from './pressable-row';
import { AppText } from './text';

/**
 * 눌러서 다른 화면으로 넘어가는 회색 판. 오른쪽 꺾쇠가 '여기서 끝이 아니다'를
 * 말하는 유일한 표시라서, 넘어가는 자리는 전부 이 한 모양을 쓴다.
 *
 * 글의 크기는 고르게 하지 않고 `eyebrow`가 정한다 — 작은 라벨을 머리에 인
 * 줄은 아래가 값(레벨, 개수)이라 크게 서야 하고, 라벨이 없는 줄은 제목과
 * 설명이라 제목이 본문 크기면 족하다. 같은 판에 두 리듬이 필요한 이유가
 * 그것이고, 쓰는 쪽에서 크기를 고르게 두면 곧 제각각이 된다.
 */
export function DisclosureRow({
  icon,
  eyebrow,
  title,
  body,
  onPress,
}: {
  /**
   * 왼쪽에 서는 아이콘 타일 — 갈림길을 고르는 자리에서만 쓴다. 면 아이콘은 이름으로,
   * 선 아이콘(`TrashIcon` 등)은 그린 것을 그대로 넘긴다.
   */
  icon?: FilledIconName | ReactElement;
  /** 아래 값이 무엇인지 먼저 말하는 작은 라벨 */
  eyebrow?: string;
  title: string;
  body?: string;
  onPress?: () => void;
}) {
  const big = Boolean(eyebrow);

  return (
    <Tap
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[eyebrow, title, body].filter(Boolean).join(', ')}>
      {icon ? (
        <View style={styles.iconTile}>
          {typeof icon === 'string' ? (
            <Icon name={icon} size={19} color={color.text.primary} />
          ) : (
            icon
          )}
        </View>
      ) : null}

      <View style={styles.text}>
        {eyebrow ? <AppText style={styles.eyebrow}>{eyebrow}</AppText> : null}
        <AppText style={big ? styles.value : styles.title}>{title}</AppText>
        {body ? <AppText style={big ? styles.hint : styles.body}>{body}</AppText> : null}
      </View>

      <Icon name="chevronRight" size={16} color={color.text.assistive} />
    </Tap>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 18,
    backgroundColor: color.surface.alt,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.surface.base,
  },
  text: { flex: 1, minWidth: 0, gap: 3 },
  eyebrow: { ...type.caption1, color: color.text.meta },
  value: { ...type.headline1, fontWeight: '700', color: color.text.primary },
  hint: { ...type.caption2, color: color.text.assistive },
  title: { ...type.label1, fontWeight: '700', color: color.text.primary },
  body: { ...type.caption1, lineHeight: 17, color: color.text.meta },
});
