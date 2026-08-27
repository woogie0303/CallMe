import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, type } from '@/shared/config';
import { AppText, Icon, MicIcon, Tap, type FilledIconName } from '@/shared/ui';

/** 지금 보고 있는 곳만 검다. 나머지는 배경으로 물러난다. */
const TABS: Record<string, { label: string; icon: FilledIconName | 'mic' }> = {
  index: { label: '홈', icon: 'home' },
  drawer: { label: '서랍', icon: 'bookmark' },
  retell: { label: '리텔링', icon: 'mic' },
  quiz: { label: '퀴즈', icon: 'graduation' },
  my: { label: '마이', icon: 'person' },
};

/**
 * 리텔링과 퀴즈는 말하고 고르는 일에 화면을 통째로 쓴다 —
 * 그 두 곳에서는 탭 바가 스스로 물러난다.
 */
const IMMERSIVE = new Set(['retell', 'quiz']);

export function AppTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const current = state.routes[state.index]?.name;
  if (IMMERSIVE.has(current)) return null;

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + 10 }]}>
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === index;
        const tint = focused ? color.text.primary : 'rgba(23,23,25,0.32)';

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
            {tab.icon === 'mic' ? (
              <MicIcon size={22} color={tint} />
            ) : (
              <Icon name={tab.icon} size={22} color={tint} />
            )}
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
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  tab: { alignItems: 'center', gap: 5, flex: 1 },
  label: { ...type.caption2, fontSize: 10, lineHeight: 12 },
});
