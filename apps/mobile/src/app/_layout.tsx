import '@/global.css';

import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { color } from '@/shared/config';
import { QueryProvider } from '@/shared/query/provider';
import { SessionProvider, useSession } from '@/shared/session/session';

SplashScreen.preventAutoHideAsync();

/**
 * Reread는 흰 종이 위에서만 산다 — 화면은 라이트 하나뿐이다.
 * (디자인의 여섯 화면 모두 흰 바탕을 전제로 잉크·파랑의 대비를 쓴다.)
 */
export default function RootLayout() {
  return (
    <SessionProvider>
      <QueryProvider>
        <StatusBar style="dark" />
        <Gate />
      </QueryProvider>
    </SessionProvider>
  );
}

/**
 * 로그인 여부에 따라 문을 갈라놓는다.
 *
 * 세션이 정해지기 전에는 스플래시를 내리지 않는다 — 잠깐 로그인 화면이
 * 스쳤다가 홈으로 넘어가는 것이 앱이 고장난 것처럼 보이기 때문이다.
 */
function Gate() {
  const { status } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    SplashScreen.hideAsync();
    const atSignIn = segments[0] === 'sign-in';
    if (status === 'out' && !atSignIn) router.replace('/sign-in');
    if (status === 'in' && atSignIn) router.replace('/');
  }, [status, segments, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: color.surface.base },
      }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="book-add" />
      <Stack.Screen name="ask" options={{ presentation: 'modal' }} />
      <Stack.Screen name="scan" />
      <Stack.Screen name="capture" />
      <Stack.Screen name="pending" />
      <Stack.Screen name="retell" />
      <Stack.Screen name="level" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
