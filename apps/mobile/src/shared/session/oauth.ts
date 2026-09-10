import * as AuthSession from 'expo-auth-session';
import { api } from '@/shared/api/client';
import type { ProviderName, SignInResult } from '@/shared/api/types';

/**
 * 동의 화면은 앱이 띄우고, 받아온 인가 코드는 서버가 토큰으로 바꾼다.
 * 앱에는 클라이언트 시크릿이 들어오지 않는다 — 앱 번들은 뜯어볼 수 있다.
 */
const ENDPOINTS: Record<ProviderName, { authorize: string; scopes: string[]; pkce: boolean }> = {
  kakao: {
    authorize: 'https://kauth.kakao.com/oauth/authorize',
    scopes: ['profile_nickname', 'profile_image', 'account_email'],
    pkce: true,
  },
  /** 네이버는 PKCE를 쓰지 않는다. 대신 state로 요청을 맞춰본다. */
  naver: {
    authorize: 'https://nid.naver.com/oauth2.0/authorize',
    scopes: [],
    pkce: false,
  },
  google: {
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
    scopes: ['openid', 'profile', 'email'],
    pkce: true,
  },
};

const CLIENT_IDS: Record<ProviderName, string | undefined> = {
  kakao: process.env.EXPO_PUBLIC_KAKAO_CLIENT_ID,
  naver: process.env.EXPO_PUBLIC_NAVER_CLIENT_ID,
  google: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
};

export function configured(provider: ProviderName): boolean {
  return Boolean(CLIENT_IDS[provider]);
}

/** 사용자가 동의 화면을 그냥 닫은 것 — 오류가 아니다 */
export class SignInCancelled extends Error {}

export async function signInWith(provider: ProviderName): Promise<SignInResult> {
  const clientId = CLIENT_IDS[provider];
  if (!clientId) throw new Error(`${provider} 로그인이 아직 설정되지 않았어요.`);

  const { authorize, scopes, pkce } = ENDPOINTS[provider];
  /** 제공자 콘솔에 등록한 주소와 **글자 하나까지 같아야** 한다 */
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'reread', path: 'oauth' });

  const request = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    scopes,
    usePKCE: pkce,
    responseType: AuthSession.ResponseType.Code,
  });

  const result = await request.promptAsync({ authorizationEndpoint: authorize });
  if (result.type !== 'success') throw new SignInCancelled();

  return api<SignInResult>(`/auth/${provider}`, {
    method: 'POST',
    anonymous: true,
    body: {
      code: result.params.code,
      redirectUri,
      codeVerifier: pkce ? request.codeVerifier : undefined,
      state: request.state,
    },
  });
}

/**
 * 개발용 문. 서버의 ALLOW_DEV_LOGIN이 켜져 있을 때만 열린다.
 * 소셜 로그인이 실제로 도는 것을 확인하면 이 함수와 로그인 화면의 버튼을 지운다.
 */
export function devSignIn(nickname = '개발용 독자'): Promise<SignInResult> {
  return api<SignInResult>('/dev/login', {
    method: 'POST',
    anonymous: true,
    body: { nickname },
  });
}
