import { getJson, postForm, rejectToken } from './http';
import type {
  CodeExchange,
  OAuthProfile,
  OAuthProvider,
  ProviderConfig,
  TokenExchange,
} from './oauth.types';

/** 구글이 idToken을 뜯어서 돌려주는 자리 — 서명 검증까지 구글이 해준다 */
type TokenInfo = {
  aud: string;
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
};

type TokenResponse = { access_token: string };
type UserInfo = {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
};

export const google: OAuthProvider = {
  name: 'google',

  async exchange(
    input: CodeExchange,
    config: ProviderConfig,
  ): Promise<OAuthProfile> {
    const token = await postForm<TokenResponse>(
      '구글',
      'https://oauth2.googleapis.com/token',
      {
        grant_type: 'authorization_code',
        code: input.code,
        redirect_uri: input.redirectUri,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code_verifier: input.codeVerifier,
      },
    );

    const profile = await getJson<UserInfo>(
      '구글',
      'https://www.googleapis.com/oauth2/v3/userinfo',
      token.access_token,
    );

    return {
      providerId: profile.sub,
      nickname: profile.name ?? profile.email?.split('@')[0] ?? '독자',
      email: profile.email,
      profileImage: profile.picture,
    };
  },

  /**
   * 앱에서 온 idToken. 서명 검증은 구글의 tokeninfo가 대신 해주고, 우리는
   * **`aud`가 우리 클라이언트인지**를 본다 — 이게 없으면 다른 구글 앱에서 받은
   * 토큰으로도 로그인이 된다.
   */
  async verify(
    input: TokenExchange,
    config: ProviderConfig,
  ): Promise<OAuthProfile> {
    if (!('idToken' in input)) rejectToken('구글', 'idToken이 필요해요.');

    const info = await getJson<TokenInfo>(
      '구글',
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(input.idToken)}`,
      '',
    );

    if (info.aud !== config.clientId) {
      rejectToken('구글', '다른 앱에 발급된 토큰이에요.');
    }

    return {
      providerId: info.sub,
      nickname: info.name ?? info.email?.split('@')[0] ?? '독자',
      email: info.email,
      profileImage: info.picture,
    };
  },
};
