import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api, Unauthenticated } from '@/shared/api/client';
import { clearTokens, readTokens, saveTokens } from '@/shared/api/tokens';
import type { ProviderName, ReaderView } from '@/shared/api/types';
import { devSignIn, signInWith } from './oauth';

type Status = 'loading' | 'in' | 'out';

type Session = {
  status: Status;
  reader: ReaderView | null;
  signIn: (provider: ProviderName) => Promise<void>;
  signInAsDeveloper: () => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<Session | null>(null);

/**
 * 로그인한 사람 하나. 화면은 이걸 통해서만 '지금 누구인지'를 안다.
 *
 * 앱을 열 때 저장된 토큰으로 한 번 물어본다. 토큰이 살아 있으면 로그인 화면을
 * 건너뛰고, 죽었으면 지우고 로그인으로 보낸다 — 만료된 토큰을 들고 앱을
 * 돌아다니다 화면마다 하나씩 실패하는 것보다 문 앞에서 한 번 확인하는 게 낫다.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [reader, setReader] = useState<ReaderView | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      const stored = await readTokens();
      if (!stored) {
        if (alive) setStatus('out');
        return;
      }

      try {
        const me = await api<ReaderView>('/auth/me');
        if (!alive) return;
        setReader(me);
        setStatus('in');
      } catch (error) {
        if (!alive) return;
        /** 토큰이 죽었거나 서버가 모르는 독자다. 둘 다 다시 로그인이 답이다. */
        if (error instanceof Unauthenticated) await clearTokens();
        setStatus('out');
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const enter = useCallback(
    async (result: Awaited<ReturnType<typeof devSignIn>>) => {
      await saveTokens(result);
      setReader(result.reader);
      setStatus('in');
    },
    [],
  );

  const value = useMemo<Session>(
    () => ({
      status,
      reader,
      signIn: async (provider) => enter(await signInWith(provider)),
      signInAsDeveloper: async () => enter(await devSignIn()),
      signOut: async () => {
        const stored = await readTokens();
        if (stored) {
          /** 서버에서도 끊는다. 실패해도 기기에서는 지운다. */
          await api('/auth/logout', {
            method: 'POST',
            anonymous: true,
            body: { refreshToken: stored.refresh },
          }).catch(() => undefined);
        }
        await clearTokens();
        setReader(null);
        setStatus('out');
      },
    }),
    [status, reader, enter],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error('SessionProvider 안에서만 쓸 수 있어요.');
  return session;
}
