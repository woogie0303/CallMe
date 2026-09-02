import { getJson, postForm } from './http';
import type { CodeExchange, OAuthProfile, OAuthProvider, ProviderConfig } from './oauth.types';

type TokenResponse = { access_token: string };
type UserInfo = {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
};

export const google: OAuthProvider = {
  name: 'google',

  async exchange(input: CodeExchange, config: ProviderConfig): Promise<OAuthProfile> {
    const token = await postForm<TokenResponse>('구글', 'https://oauth2.googleapis.com/token', {
      grant_type: 'authorization_code',
      code: input.code,
      redirect_uri: input.redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code_verifier: input.codeVerifier,
    });

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
};
