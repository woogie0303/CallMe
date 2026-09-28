import { applicationId } from 'expo-application';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

import { api } from '@/shared/api/client';
import type { ProviderName, SignInResult } from '@/shared/api/types';

/**
 * 소셜 로그인 — 제공자별 네이티브 SDK.
 *
 * 한동안 `expo-auth-session`으로 브라우저 동의 화면을 띄웠는데, 돌아올 주소
 * (redirect URI)가 어디서 도느냐에 따라 달라지는 것이 발목을 잡았다. Expo Go에서는
 * `exp://192.168.x.x:8081/--/oauth`가 되어 콘솔에 등록해 둔 것과 어긋나고, 무엇보다
 * **구글이 커스텀 스킴을 정책으로 막았다** — 설정으로 풀 수 있는 문제가 아니었다.
 *
 * 네이티브 SDK는 돌아올 주소를 자기가 관리한다. 대신 앱이 토큰을 직접 받게 되므로
 * **서버가 그 토큰이 우리 앱 것인지 확인해야 한다** — 남의 앱에서 받은 토큰으로
 * 로그인되면 안 된다. 그래서 가능한 곳에서는 액세스 토큰이 아니라 `idToken`을
 * 받아 보낸다(서버가 `aud`를 대조한다).
 *
 * | 제공자 | 보내는 것 | 서버의 확인 |
 * |---|---|---|
 * | 카카오 | idToken (nonce 필요) | aud == 네이티브 앱 키 |
 * | 구글   | idToken               | aud == iOS 클라이언트 id |
 * | 네이버 | accessToken           | **대조할 수단이 없다** — 아래 주석 참고 |
 *
 * ## 모듈이 없을 수 있다
 *
 * 셋 다 네이티브 모듈이라 **개발 빌드를 다시 만들기 전에는 없다**(Expo Go에서는
 * 영영 없다). 최상단에서 import하면 모듈이 없을 때 이 파일이 끝까지 평가되지
 * 못하고, 그러면 이걸 부르는 화면의 default export까지 사라져 **앱이 통째로
 * 죽는다** — `shared/ocr/text-extractor.ts`가 같은 이유로 같은 방식을 쓴다.
 *
 * 그래서 쓸 때가 되어서야 한 번 불러오고, 없으면 그 제공자만 '설정 안 됨'으로
 * 둔다. 로그인 하나 때문에 앱이 안 켜지는 것이 가장 나쁘다.
 */

/**
 * 네이티브 모듈을 한 번만 불러와 둔다.
 *
 * `require`에 변수를 넘기면 Metro가 번들에 무엇을 넣을지 알 수 없어 빌드가
 * 깨진다 — 그래서 묶어 쓰는 헬퍼를 두지 않고 **글자 그대로 적힌 경로**로
 * 하나씩 부른다. 없으면 null이고, 그 제공자만 못 쓰게 된다.
 */
type KakaoCore = { initializeKakaoSDK: (key: string) => void };
type KakaoUser = {
  login: (opts?: { nonce?: string }) => Promise<{ accessToken: string; idToken?: string }>;
};
type NaverSdk = {
  initialize: (p: {
    appName: string;
    consumerKey: string;
    consumerSecret: string;
    /** 네이버 앱에서 돌아올 URL 스킴 — iOS에서는 이게 없으면 돌아오지 못한다 */
    serviceUrlSchemeIOS?: string;
  }) => void;
  login: () => Promise<{ successResponse?: { accessToken: string }; failureResponse?: unknown }>;
};
type GoogleSdk = {
  configure: (p: { iosClientId?: string }) => void;
  hasPlayServices: () => Promise<boolean>;
  signIn: () => Promise<
    { type: 'success'; data: { idToken: string | null } } | { type: 'cancelled' }
  >;
};
type AppleSdk = {
  AppleAuthenticationScope: { FULL_NAME: number; EMAIL: number };
  signInAsync: (p: { requestedScopes: number[] }) => Promise<{
    identityToken: string | null;
    fullName: { givenName: string | null; familyName: string | null; nickname: string | null } | null;
  }>;
};

/* eslint-disable @typescript-eslint/no-require-imports */
const SDK = {
  kakaoCore: ((): KakaoCore | null => {
    try {
      return require('@react-native-kakao/core') as KakaoCore;
    } catch {
      return null;
    }
  })(),
  kakaoUser: ((): KakaoUser | null => {
    try {
      return require('@react-native-kakao/user') as KakaoUser;
    } catch {
      return null;
    }
  })(),
  naver: ((): NaverSdk | null => {
    try {
      return (require('@react-native-seoul/naver-login') as { default: NaverSdk }).default;
    } catch {
      return null;
    }
  })(),
  google: ((): GoogleSdk | null => {
    try {
      return (require('@react-native-google-signin/google-signin') as { GoogleSignin: GoogleSdk })
        .GoogleSignin;
    } catch {
      return null;
    }
  })(),
  apple: ((): AppleSdk | null => {
    if (Platform.OS !== 'ios') return null;
    try {
      return require('expo-apple-authentication') as AppleSdk;
    } catch {
      return null;
    }
  })(),
};
/* eslint-enable @typescript-eslint/no-require-imports */

/**
 * 이 빌드에서 그 제공자를 실제로 쓸 수 있는지.
 *
 * `require`가 되는 것만으로는 부족하다 — 이 패키지들은 JS는 멀쩡히 불러와지고
 * **부를 때가 되어서야** "네이티브가 안 붙었다"며 터진다. 그래서 `require` 성공
 * 여부가 아니라 **초기화가 실제로 통과했는지**를 기록해 두고 그걸 본다.
 */
const live: Partial<Record<ProviderName, boolean>> = {};

/** 네이티브가 안 붙었으면 부르는 순간 터진다 — 터뜨리지 말고 '없음'으로 적어둔다 */
function tryInit(provider: ProviderName, run: () => void): void {
  try {
    run();
    live[provider] = true;
  } catch {
    live[provider] = false;
  }
}

const KAKAO_NATIVE_APP_KEY = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY;
const NAVER_CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID;
/** 네이버 SDK가 앱에서 요구한다 — 이 값은 번들에 박힌다(네이버 설계상 피할 수 없다) */
const NAVER_CLIENT_SECRET = process.env.EXPO_PUBLIC_NAVER_CLIENT_SECRET;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
/**
 * Apple 로그인은 **유료 개발자 계정**에서만 켤 수 있는 권한이 필요하다. 무료 개인
 * 팀으로 지은 빌드에 그 권한을 넣으면 빌드가 실패하므로, 켜도 되는 빌드에서만
 * `true`로 둔다. `app.config.js`가 같은 값을 보고 권한을 넣는다 — 둘이 어긋나면
 * 버튼은 눌리는데 시스템 창이 뜨지 않는다.
 */
const APPLE_SIGN_IN = process.env.EXPO_PUBLIC_APPLE_SIGN_IN === 'true';

/**
 * 키도 있고 모듈도 들어 있어야 쓸 수 있다. 둘 중 하나라도 없으면 버튼은
 * '준비 중'으로 남는다 — 눌러도 실패할 것을 눌리게 두지 않는다.
 */
export function configured(provider: ProviderName): boolean {
  prepareSocialSignIn();
  return live[provider] === true;
}

/**
 * SDK는 쓰기 전에 한 번 깨워야 한다. 앱이 켜질 때 부른다 —
 * 로그인 버튼을 누른 뒤에 하면 첫 번째 누름이 조용히 실패한다.
 */
let ready = false;
export function prepareSocialSignIn(): void {
  if (ready) return;
  ready = true;

  tryInit('apple', () => {
    if (!SDK.apple) throw new Error('없음');
    if (!APPLE_SIGN_IN) throw new Error('권한 없음');
  });

  tryInit('kakao', () => {
    if (!SDK.kakaoCore || !SDK.kakaoUser) throw new Error('없음');
    if (!KAKAO_NATIVE_APP_KEY) throw new Error('키 없음');
    SDK.kakaoCore.initializeKakaoSDK(KAKAO_NATIVE_APP_KEY);
  });

  tryInit('naver', () => {
    if (!SDK.naver) throw new Error('없음');
    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) throw new Error('키 없음');
    /**
     * `serviceUrlSchemeIOS`를 빼면 SDK가 경고만 남기고 넘어가지만, 네이버 앱에서
     * 돌아올 주소가 없어서 **앱 전환으로 하는 로그인이 돌아오지 못한다.**
     *
     * 값은 `app.config.js`가 네이버 플러그인에 넘긴 것과 같아야 한다 — 거기서
     * 번들 id를 스킴으로 등록하므로 여기서도 번들 id를 그대로 쓴다. 문자로 적어두면
     * 번들 id를 바꿀 때 한쪽만 바뀐다.
     */
    SDK.naver.initialize({
      appName: 'Reread',
      consumerKey: NAVER_CLIENT_ID,
      consumerSecret: NAVER_CLIENT_SECRET,
      serviceUrlSchemeIOS: applicationId ?? undefined,
    });
  });

  tryInit('google', () => {
    if (!SDK.google) throw new Error('없음');
    if (!GOOGLE_IOS_CLIENT_ID) throw new Error('키 없음');
    /**
     * iOS 클라이언트만 넘긴다. 웹 클라이언트를 함께 주면 idToken의 `aud`가 웹
     * 쪽 값이 되어, 서버가 대조하는 `GOOGLE_CLIENT_ID`와 어긋난다.
     */
    SDK.google.configure({ iosClientId: GOOGLE_IOS_CLIENT_ID });
  });

  if (__DEV__) {
    const off = (['kakao', 'naver', 'google'] as ProviderName[]).filter((p) => !live[p]);
    if (off.length) {
      console.log(
        `[oauth] 이 빌드에서 못 쓰는 로그인: ${off.join(', ')} — 개발 빌드(expo run:ios)가 필요해요.`,
      );
    }
  }
}

/** 사용자가 동의 화면을 그냥 닫은 것 — 오류가 아니다 */
export class SignInCancelled extends Error {}

/**
 * 동의 화면까지 가지도 못했거나 제공자가 거절한 것.
 *
 * 취소와 묶어 던지면 화면이 조용히 아무것도 안 한다 — 사용자가 닫은 것과
 * 제공자가 거절한 것이 같은 모양이 되기 때문이다.
 */
export class SignInFailed extends Error {
  constructor(
    message: string,
    readonly detail: { provider: ProviderName; raw?: string },
  ) {
    super(message);
  }
}

/** SDK마다 취소를 다른 모양으로 알린다 — 전부 '닫았다'로 모은다 */
function cancelled(error: unknown): boolean {
  const code = (error as { code?: string })?.code;
  const message = error instanceof Error ? error.message : String(error);
  return (
    code === 'SIGN_IN_CANCELLED' ||
    code === 'ERR_REQUEST_CANCELED' ||
    code === '-5' ||
    /cancel/i.test(message) ||
    /user_cancel/i.test(message)
  );
}

export async function signInWith(provider: ProviderName): Promise<SignInResult> {
  if (!configured(provider)) throw new Error(`${provider} 로그인이 아직 설정되지 않았어요.`);
  prepareSocialSignIn();

  try {
    const token = await tokenFrom(provider);
    return await api<SignInResult>(`/auth/${provider}`, {
      method: 'POST',
      anonymous: true,
      body: token,
    });
  } catch (error) {
    if (error instanceof SignInCancelled || error instanceof SignInFailed) throw error;
    if (cancelled(error)) throw new SignInCancelled();
    throw new SignInFailed(
      error instanceof Error ? error.message : `${provider} 로그인을 마치지 못했어요.`,
      { provider, raw: String(error).slice(0, 300) },
    );
  }
}

/** 서버로 보낼 것 — 가능한 곳에서는 idToken, 아니면 accessToken */
type ProviderToken = ({ idToken: string } | { accessToken: string }) & { nickname?: string };

/**
 * Apple이 준 이름을 한 줄로. 한글 이름은 성과 이름을 붙여 쓰고(강동욱), 그 밖에는
 * 이름 먼저 띄어 쓴다(John Smith).
 */
function joinName(given: string | null, family: string | null): string | undefined {
  if (!given && !family) return undefined;
  const hangul = /[가-힣]/.test(`${given ?? ''}${family ?? ''}`);
  return hangul
    ? `${family ?? ''}${given ?? ''}`
    : [given, family].filter(Boolean).join(' ');
}

async function tokenFrom(provider: ProviderName): Promise<ProviderToken> {
  if (provider === 'apple') {
    const sdk = SDK.apple;
    if (!sdk) throw new SignInFailed('이 빌드에 Apple 로그인이 없어요.', { provider });
    const credential = await sdk.signInAsync({
      requestedScopes: [sdk.AppleAuthenticationScope.FULL_NAME, sdk.AppleAuthenticationScope.EMAIL],
    });
    if (!credential.identityToken) {
      throw new SignInFailed('Apple이 identityToken을 주지 않았어요.', { provider });
    }
    /**
     * 이름은 **처음 로그인할 때만** 온다. 두 번째부터는 비어 있고, 서버는 이미
     * 저장해 둔 이름을 쓴다.
     */
    const name = credential.fullName;
    return {
      idToken: credential.identityToken,
      nickname: name?.nickname ?? joinName(name?.givenName ?? null, name?.familyName ?? null),
    };
  }

  if (provider === 'kakao') {
    /**
     * nonce를 넘겨야 카카오가 idToken을 준다(OIDC). 없으면 액세스 토큰만 오고,
     * 그러면 서버가 '우리 앱 것인지'를 대조할 방법이 사라진다.
     */
    const sdk = SDK.kakaoUser;
    if (!sdk) throw new SignInFailed('이 빌드에 카카오 로그인이 없어요.', { provider });
    const nonce = Crypto.randomUUID();
    const token = await sdk.login({ nonce });
    if (token.idToken) return { idToken: token.idToken };
    return { accessToken: token.accessToken };
  }

  if (provider === 'naver') {
    const sdk = SDK.naver;
    if (!sdk) throw new SignInFailed('이 빌드에 네이버 로그인이 없어요.', { provider });
    const result = await sdk.login();
    const accessToken = result.successResponse?.accessToken;
    if (!accessToken) {
      throw new SignInFailed('네이버가 토큰을 주지 않았어요.', {
        provider,
        raw: JSON.stringify(result.failureResponse ?? result).slice(0, 300),
      });
    }
    return { accessToken };
  }

  const sdk = SDK.google;
  if (!sdk) throw new SignInFailed('이 빌드에 구글 로그인이 없어요.', { provider });
  await sdk.hasPlayServices();
  const result = await sdk.signIn();
  const idToken = result.type === 'success' ? result.data.idToken : null;
  if (!idToken) {
    if (result.type === 'cancelled') throw new SignInCancelled();
    throw new SignInFailed('구글이 idToken을 주지 않았어요.', { provider });
  }
  return { idToken };
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
