import type { ProviderName } from '../../readers/reader.schema';
import { google } from './google';
import { kakao } from './kakao';
import { naver } from './naver';
import type { OAuthProvider } from './oauth.types';

/**
 * 로그인할 수 있는 곳은 셋뿐이다. 이메일·비밀번호는 만들지 않는다 —
 * 비밀번호를 맡는 순간 재설정 메일·유출 대응까지 우리가 지어야 한다.
 */
export const PROVIDERS: Record<ProviderName, OAuthProvider> = {
  kakao,
  naver,
  google,
};

export * from './oauth.types';
