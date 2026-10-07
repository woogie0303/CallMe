import { getJson, postForm } from './http';
import type {
  CodeExchange,
  OAuthProfile,
  OAuthProvider,
  ProviderConfig,
} from './oauth.types';

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

  /** 네이버는 state를 우리가 넣은 그대로 돌려주고, callback에서 그 값으로 대조한다 */
  authorizeUrl({ redirectUri, state }, config): string {
    const url = new URL('https://nid.naver.com/oauth2.0/authorize');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', config.clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('state', state);
    return url.toString();
  },

  async exchange(
    input: CodeExchange,
    config: ProviderConfig,
  ): Promise<OAuthProfile> {
    const token = await postForm<TokenResponse>(
      '네이버',
      'https://nid.naver.com/oauth2.0/token',
      {
        grant_type: 'authorization_code',
        code: input.code,
        /** 동의 화면에 보낸 state와 같은 값을 그대로 다시 보내야 한다(네이버 요구) */
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
