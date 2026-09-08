import { Tabs } from 'expo-router/js-tabs';

import { AppTabBar } from '@/widgets/app-tab-bar/ui/app-tab-bar';

/**
 * 홈 · 서랍 · 퀴즈 · 마이. 탭 바는 디자인 그대로 직접 그린다
 * (`widgets/app-tab-bar`). 어느 탭에서도 물러나지 않는다 — 풀다 말고 다른 데로
 * 갈 수 있어야 하고, 탭 바가 사라지면 나가는 길이 헤더 하나뿐이 된다.
 *
 * 리텔링은 탭이 아니다. 옮겨 적는 일은 늘 **읽던 책의 한 챕터**에 대고 하는
 * 것이라, 책 화면 안(`widgets/book-detail`)에서 열린다.
 */
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <AppTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: '홈' }} />
      <Tabs.Screen name="drawer" options={{ title: '서랍' }} />
      <Tabs.Screen name="quiz" options={{ title: '퀴즈' }} />
      <Tabs.Screen name="my" options={{ title: '마이' }} />
    </Tabs>
  );
}
