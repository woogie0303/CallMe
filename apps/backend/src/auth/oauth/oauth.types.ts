import type { ProviderName } from '../../readers/reader.schema';

/** 앱이 제공자에게서 받아오는 것 — 딱 이만큼만 쓴다. */
export type OAuthProfile = {
  providerId: string;
  nickname: string;
  email?: string;
  profileImage?: string;
};

/** 서버가 인가 코드를 토큰으로 바꿀 때 필요한 것 */
export type CodeExchange = {
  code: string;
  redirectUri: string;
  /** 네이버만 요구한다 — 동의 화면에 보낸 것과 같은 값을 토큰 교환 때도 다시 보내야 한다 */
  state?: string;
};

export type ProviderConfig = {
  clientId: string;
  clientSecret?: string;
};

/**
 * 네이티브 SDK가 앱에서 직접 받아 온 토큰.
 *
 * Apple만 이 길로 들어온다 — iOS 시스템 창이 브라우저를 거치지 않고 앱에
 * `identityToken`을 바로 준다. 카카오·네이버·구글은 이제 전부 브라우저 동의
 * 화면 + 서버 콜백(`exchange`)으로 들어오므로 이 토큰을 대조할 일이 없다.
 */
export type TokenExchange = { idToken: string } & {
  /**
   * 앱이 따로 알고 있는 이름. Apple은 이름을 토큰에 넣지 않고 **처음 로그인할
   * 때 앱에만** 한 번 알려준다 — 그걸 받아 두는 자리다.
   */
  nickname?: string;
};

export type OAuthProvider = {
  readonly name: ProviderName;
  /** 인가 코드를 토큰으로 바꾸고 프로필을 받아온다 — 카카오·네이버·구글 */
  exchange(input: CodeExchange, config: ProviderConfig): Promise<OAuthProfile>;
  /**
   * 동의 화면 URL을 짓는다. 카카오·네이버·구글만 있다 — Apple은 브라우저를
   * 타지 않으므로 없다(`undefined`면 컨트롤러가 400으로 막는다).
   */
  authorizeUrl?(
    params: { redirectUri: string; state: string },
    config: ProviderConfig,
  ): string;
  /** 앱이 네이티브 SDK로 직접 받아온 토큰을 대조한다 — Apple만 있다 */
  verify?(input: TokenExchange, config: ProviderConfig): Promise<OAuthProfile>;
};
