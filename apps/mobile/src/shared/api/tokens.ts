import * as SecureStore from 'expo-secure-store';
import type { Tokens } from './types';

const ACCESS = 'reread.accessToken';
const REFRESH = 'reread.refreshToken';

/**
 * 토큰은 기기의 보안 저장소에만 둔다. AsyncStorage는 평문이라, 잠금 해제된
 * 기기에서 다른 앱이나 백업을 통해 읽힐 수 있다.
 *
 * 웹에서는 SecureStore가 없어서 조용히 실패한다 — 웹은 아직 붙이지 않는다.
 */
export async function saveTokens(
  tokens: Pick<Tokens, 'accessToken' | 'refreshToken'>,
) {
  await SecureStore.setItemAsync(ACCESS, tokens.accessToken);
  await SecureStore.setItemAsync(REFRESH, tokens.refreshToken);
}

export async function readTokens(): Promise<{
  access: string;
  refresh: string;
} | null> {
  const [access, refresh] = await Promise.all([
    SecureStore.getItemAsync(ACCESS),
    SecureStore.getItemAsync(REFRESH),
  ]);
  return access && refresh ? { access, refresh } : null;
}

export async function clearTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS),
    SecureStore.deleteItemAsync(REFRESH),
  ]);
}
