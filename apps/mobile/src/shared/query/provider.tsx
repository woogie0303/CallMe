import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Unauthenticated } from '@/shared/api/client';

/**
 * 서버에서 받아온 것을 담아두는 곳.
 *
 * 로그인이 끊긴 요청은 다시 시도하지 않는다 — 같은 401을 세 번 더 받을 뿐이고,
 * 그 사이 화면은 계속 비어 있다. 세션이 로그인 화면으로 되돌리는 게 답이다.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (count, error) => !(error instanceof Unauthenticated) && count < 2,
            staleTime: 30_000,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
