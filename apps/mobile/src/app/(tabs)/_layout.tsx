import { Tabs } from 'expo-router/js-tabs';

import { AppTabBar } from '@/widgets/app-tab-bar/ui/app-tab-bar';

/**
 * 홈 · 서랍 · 리텔링 · 퀴즈 · 마이. 탭 바는 디자인 그대로 직접 그린다
 * (`widgets/app-tab-bar`) — 리텔링과 퀴즈에서는 스스로 물러난다.
 */
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <AppTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: '홈' }} />
      <Tabs.Screen name="drawer" options={{ title: '서랍' }} />
      <Tabs.Screen name="retell" options={{ title: '리텔링' }} />
      <Tabs.Screen name="quiz" options={{ title: '퀴즈' }} />
      <Tabs.Screen name="my" options={{ title: '마이' }} />
    </Tabs>
  );
}
