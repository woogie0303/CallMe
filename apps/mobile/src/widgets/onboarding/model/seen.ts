import * as SecureStore from 'expo-secure-store';

/**
 * 안내를 봤는지는 **독자마다** 적는다. 기기에 하나만 적으면 같은 기기에서 새로 가입한
 * 사람이 안내를 못 보고, 계정을 지우고 다시 만든 사람도 마찬가지다.
 */
const key = (readerId: string) => `onboarding.seen.${readerId}`;

/**
 * 읽지 못하면 **봤다고 친다** — 안내가 길을 막는 일은 없어야 한다. 한 번 더 보여주는 것보다
 * 못 보여주는 쪽이 싸다(마이 탭에서 언제든 다시 열 수 있다).
 */
export async function hasSeenOnboarding(readerId: string): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(key(readerId))) === '1';
  } catch {
    return true;
  }
}

export async function markOnboardingSeen(readerId: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key(readerId), '1');
  } catch {
    /* 못 적어도 안내를 한 번 더 보게 될 뿐이다 */
  }
}
