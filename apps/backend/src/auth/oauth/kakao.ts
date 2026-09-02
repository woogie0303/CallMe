import { getJson, postForm } from './http';
import type { CodeExchange, OAuthProfile, OAuthProvider, ProviderConfig } from './oauth.types';

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
};
