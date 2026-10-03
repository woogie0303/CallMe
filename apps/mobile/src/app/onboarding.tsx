import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useSession } from '@/shared/session/session';
import { markOnboardingSeen } from '@/widgets/onboarding/model/seen';
import { Onboarding } from '@/widgets/onboarding/ui/onboarding';

/**
 * 첫 실행 안내. 처음 온 독자는 로그인 직후(`OnboardingRedirect`), 그 밖에는 마이 탭에서
 * 들어온다. 끝내거나 건너뛰면 어디서 왔든 온 자리로 돌아간다.
 */
export default function OnboardingScreen() {
  const router = useRouter();
  const { reader } = useSession();

  /** 건너뛴 것도 본 것으로 적는다 — 건너뛴 사람에게 다음 실행에 또 내밀지 않는다 */
  const finish = useCallback(async () => {
    if (reader) await markOnboardingSeen(reader.id);
    router.back();
  }, [reader, router]);

  return <Onboarding onFinish={finish} />;
}
