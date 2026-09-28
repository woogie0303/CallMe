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
  /** 카카오 네이티브 앱 키 — 앱이 보내는 idToken의 aud가 이 값이다 */
  nativeAppKey?: string;
  /** 카카오 앱 id(숫자) — 액세스 토큰이 어느 앱 것인지 대조할 때 */
  appId?: string;
};

/**
 * 네이티브 SDK가 앱에서 직접 받아 온 토큰.
 *
 * 인가 코드와 달리 이 토큰은 **우리 서버를 거치지 않고** 만들어진 것이라,
 * 받는 쪽에서 "우리 앱에 발급된 것인가"를 확인해야 한다. 확인하지 않으면 남의
 * 앱에서 받은 토큰으로도 그 사람 계정에 로그인할 수 있다.
 *
 * 그래서 가능한 제공자에서는 `idToken`(서명된 JWT, `aud`에 클라이언트가 적혀
 * 있다)을 받는다. `accessToken`만 주는 제공자는 각자 따로 대조한다.
 */
export type TokenExchange = { idToken: string } | { accessToken: string };

export type OAuthProvider = {
  readonly name: ProviderName;
  /** 브라우저 동의 화면에서 받아온 인가 코드 — 웹에서 쓴다 */
  exchange(input: CodeExchange, config: ProviderConfig): Promise<OAuthProfile>;
  /** 네이티브 SDK가 준 토큰 — 앱에서 쓴다 */
  verify(input: TokenExchange, config: ProviderConfig): Promise<OAuthProfile>;
};
