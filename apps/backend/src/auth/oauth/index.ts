import type { ProviderName } from '../../readers/reader.schema';
import { apple } from './apple';
import { google } from './google';
import { kakao } from './kakao';
import { naver } from './naver';
import type { OAuthProvider } from './oauth.types';

/**
 * 로그인할 수 있는 곳은 넷뿐이다. 이메일·비밀번호는 만들지 않는다 —
 * 비밀번호를 맡는 순간 재설정 메일·유출 대응까지 우리가 지어야 한다.
 *
 * Apple은 앱스토어 때문에 있다 — 다른 소셜 로그인을 내면 Apple 로그인도
 * 함께 내야 한다(App Store 심사 지침 4.8).
 */
export const PROVIDERS: Record<ProviderName, OAuthProvider> = {
  kakao,
  naver,
  google,
  apple,
};

export * from './oauth.types';
