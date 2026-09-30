import { getJson, postForm, rejectToken } from './http';
import type {
  CodeExchange,
  OAuthProfile,
  OAuthProvider,
  ProviderConfig,
  TokenExchange,
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

  /**
   * 앱에서 온 액세스 토큰.
   *
   * **여기에는 구멍이 하나 있다.** 네이버는 "이 토큰이 어느 앱에 발급됐는지"를
   * 알려주는 공개 엔드포인트가 없다 — 구글의 tokeninfo(`aud`)나 카카오의
   * `access_token_info`(`app_id`)에 해당하는 것이 없다. 그래서 여기서는 토큰이
   * 살아 있는지(프로필이 나오는지)만 확인하고, 그 토큰이 **우리 앱 것인지는
   * 대조하지 못한다.**
   *
   * 뜻하는 바: 다른 네이버 앱에서 발급된 액세스 토큰을 손에 넣은 사람은 그 토큰
   * 주인으로 로그인할 수 있다. 토큰을 구하는 일 자체가 쉽지 않아 당장 막지는
   * 않지만, 셋 중 이 길만 검증이 없다는 것은 알고 있어야 한다.
   *
   * 고치는 길: 네이버가 OIDC(id_token)를 열어주면 `aud`를 대조할 수 있다.
   */
  async verify(input: TokenExchange): Promise<OAuthProfile> {
    if (!('accessToken' in input))
      rejectToken('네이버', '액세스 토큰이 필요해요.');

    const me = await getJson<Me>(
      '네이버',
      'https://openapi.naver.com/v1/nid/me',
      input.accessToken,
    );
    if (!me.response) rejectToken('네이버', '프로필을 주지 않았어요.');

    return {
      providerId: me.response.id,
      nickname: me.response.nickname ?? me.response.name ?? '독자',
      email: me.response.email,
      profileImage: me.response.profile_image,
    };
  },
};
