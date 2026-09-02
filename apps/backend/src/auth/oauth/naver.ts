import { getJson, postForm } from './http';
import type { CodeExchange, OAuthProfile, OAuthProvider, ProviderConfig } from './oauth.types';

type TokenResponse = { access_token: string };
type Me = {
  response?: {
    id: string;
    nickname?: string;
    name?: string;
    email?: string;
    profile_image?: string;
  };
};

export const naver: OAuthProvider = {
  name: 'naver',

  async exchange(input: CodeExchange, config: ProviderConfig): Promise<OAuthProfile> {
    const token = await postForm<TokenResponse>(
      '네이버',
      'https://nid.naver.com/oauth2.0/token',
      {
        grant_type: 'authorization_code',
        code: input.code,
        /** 네이버만 state를 검사한다 — 클라이언트가 받은 값을 그대로 넘긴다 */
        state: input.state,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      },
    );

    const me = await getJson<Me>(
      '네이버',
      'https://openapi.naver.com/v1/nid/me',
      token.access_token,
    );

    if (!me.response) {
      throw new Error('네이버가 프로필을 주지 않았어요.');
    }

    return {
      providerId: me.response.id,
      nickname: me.response.nickname ?? me.response.name ?? '독자',
      email: me.response.email,
      profileImage: me.response.profile_image,
    };
  },
};
