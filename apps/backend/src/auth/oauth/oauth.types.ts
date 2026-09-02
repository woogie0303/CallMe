import type { ProviderName } from '../../readers/reader.schema';

/** 앱이 제공자에게서 받아오는 것 — 딱 이만큼만 쓴다. */
export type OAuthProfile = {
  providerId: string;
  nickname: string;
  email?: string;
  profileImage?: string;
};

/** 클라이언트가 동의 화면에서 받아온 인가 코드와, 그 코드를 받은 조건 */
export type CodeExchange = {
  code: string;
  redirectUri: string;
  /** PKCE를 쓴 클라이언트만 보낸다 */
  codeVerifier?: string;
  /** 네이버가 요구한다 */
  state?: string;
};

export type ProviderConfig = {
  clientId: string;
  clientSecret?: string;
};

export type OAuthProvider = {
  readonly name: ProviderName;
  exchange(input: CodeExchange, config: ProviderConfig): Promise<OAuthProfile>;
};
