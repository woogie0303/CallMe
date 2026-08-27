import '@/global.css';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { color } from '@/shared/config';

SplashScreen.preventAutoHideAsync();

/**
 * Reread는 흰 종이 위에서만 산다 — 화면은 라이트 하나뿐이다.
 * (디자인의 여섯 화면 모두 흰 바탕을 전제로 잉크·파랑의 대비를 쓴다.)
 */
export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: color.surface.base },
        }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="book-confirm" />
        <Stack.Screen name="ask" options={{ presentation: 'modal' }} />
        <Stack.Screen name="scan" />
        <Stack.Screen name="capture" />
        <Stack.Screen name="pending" />
        <Stack.Screen name="level" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}
