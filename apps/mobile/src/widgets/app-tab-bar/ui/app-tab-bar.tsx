import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, type } from '@/shared/config';
import { AppText, Icon, Tap, type FilledIconName } from '@/shared/ui';

/** 지금 보고 있는 곳만 검다. 나머지는 배경으로 물러난다. */
const TABS: Record<string, { label: string; icon: FilledIconName }> = {
  index: { label: '홈', icon: 'home' },
  drawer: { label: '서랍', icon: 'bookmark' },
  my: { label: '마이', icon: 'person' },
};

export function AppTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + 10 }]}>
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === index;
        const tint = focused ? color.text.primary : color.text.meta;

        return (
          <Tap
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            style={styles.tab}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}>
            <Icon name={tab.icon} size={22} color={tint} />
            <AppText style={[styles.label, { color: tint, fontWeight: focused ? '600' : '500' }]}>
              {tab.label}
            </AppText>
          </Tap>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.border.hairline,
    backgroundColor: color.surface.base,
  },
  tab: { alignItems: 'center', gap: 5, flex: 1 },
  label: { ...type.caption2, fontSize: 10, lineHeight: 12 },
});
