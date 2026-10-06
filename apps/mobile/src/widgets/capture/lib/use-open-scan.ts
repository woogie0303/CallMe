import { useRouter } from 'expo-router';
import { useCallback, useRef } from 'react';

import { showInterstitial } from '@/shared/ads/ads';

/**
 * 촬영 화면을 여는 단 하나의 길. **사진으로 묻는 버튼을 누른 순간** 광고를 한 번
 * 보이고, 광고가 끝나면 촬영으로 간다. 직접 적어 묻는 길에는 광고가 없다.
 *
 * `replace`는 직접 적는 화면에서 사진으로 바꿔 탈 때 — 그 화면을 쌓아 두지 않는다.
 * 광고가 안 떠도 촬영은 열린다(`showInterstitial`). 광고가 도는 동안 같은 버튼이
 * 또 눌려 촬영이 두 번 열리지 않게 막는다.
 */
export function useOpenScan() {
  const router = useRouter();
  const busy = useRef(false);

  return useCallback(
    async (bookId?: string, options?: { replace?: boolean }) => {
      if (busy.current) return;
      busy.current = true;
      try {
        await showInterstitial();
      } finally {
        busy.current = false;
      }
      const href = bookId
        ? ({ pathname: '/scan', params: { bookId } } as const)
        : '/scan';
      if (options?.replace) router.replace(href);
      else router.push(href);
    },
    [router],
  );
}
