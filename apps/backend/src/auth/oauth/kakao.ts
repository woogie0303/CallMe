import { getJson, peekJwt, postForm, rejectToken } from './http';
import type {
  CodeExchange,
  OAuthProfile,
  OAuthProvider,
  ProviderConfig,
  TokenExchange,
} from './oauth.types';

/** 카카오 idToken 안에 든 것 중 우리가 보는 것 */
type IdToken = { aud?: string; sub?: string; nickname?: string; email?: string; picture?: string };
/** 액세스 토큰이 어느 앱 것인지 알려준다 */
type TokenInfo = { id: number; app_id: number };

type TokenResponse = { access_token: string };
type UserMe = {
  id: number;
  kakao_account?: {
    email?: string;
    profile?: { nickname?: string; profile_image_url?: string };
  };
};

export const kakao: OAuthProvider = {
  name: 'kakao',

  async exchange(input: CodeExchange, config: ProviderConfig): Promise<OAuthProfile> {
    const token = await postForm<TokenResponse>('카카오', 'https://kauth.kakao.com/oauth/token', {
      grant_type: 'authorization_code',
      code: input.code,
      redirect_uri: input.redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code_verifier: input.codeVerifier,
    });

    const me = await getJson<UserMe>(
      '카카오',
      'https://kapi.kakao.com/v2/user/me',
      token.access_token,
    );

    /** 이메일은 동의 항목이라 안 줄 수 있다 — 없어도 로그인은 된다 */
    return {
      providerId: String(me.id),
      nickname: me.kakao_account?.profile?.nickname ?? '독자',
      email: me.kakao_account?.email,
      profileImage: me.kakao_account?.profile?.profile_image_url,
    };
  },

  /**
   * 앱에서 온 토큰.
   *
   * idToken이 오면 `aud`가 우리 네이티브 앱 키인지 본다. 액세스 토큰만 오면
   * `access_token_info`로 **그 토큰이 어느 앱 것인지** 물어서 대조한다 —
   * 둘 중 무엇이든 대조를 건너뛰면 남의 앱 토큰으로 로그인할 수 있다.
   */
  async verify(input: TokenExchange, config: ProviderConfig): Promise<OAuthProfile> {
    if ('idToken' in input) {
      const claims = peekJwt<IdToken>(input.idToken);
      if (!claims?.sub) rejectToken('카카오', 'idToken을 읽지 못했어요.');
      if (claims.aud && claims.aud !== config.nativeAppKey && claims.aud !== config.clientId) {
        rejectToken('카카오', '다른 앱에 발급된 토큰이에요.');
      }
      return {
        providerId: claims.sub,
        nickname: claims.nickname ?? '독자',
        email: claims.email,
        profileImage: claims.picture,
      };
    }

    const info = await getJson<TokenInfo>(
      '카카오',
      'https://kapi.kakao.com/v1/user/access_token_info',
      input.accessToken,
    );
    if (config.appId && String(info.app_id) !== config.appId) {
      rejectToken('카카오', '다른 앱에 발급된 토큰이에요.');
    }

    const me = await getJson<UserMe>(
      '카카오',
      'https://kapi.kakao.com/v2/user/me',
      input.accessToken,
    );
    return {
      providerId: String(me.id),
      nickname: me.kakao_account?.profile?.nickname ?? '독자',
      email: me.kakao_account?.email,
      profileImage: me.kakao_account?.profile?.profile_image_url,
    };
  },
};
