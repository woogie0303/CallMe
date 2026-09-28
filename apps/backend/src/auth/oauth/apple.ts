import { createPublicKey, verify as verifySignature, type JsonWebKey } from 'node:crypto';
import { getJson, peekJwt, rejectToken } from './http';
import type { OAuthProfile, OAuthProvider, ProviderConfig, TokenExchange } from './oauth.types';

type AppleHeader = { kid?: string; alg?: string };

type AppleClaims = {
  iss: string;
  aud: string;
  exp: number;
  sub: string;
  email?: string;
};

type AppleKey = JsonWebKey & { kid: string };

const ISSUER = 'https://appleid.apple.com';
const KEYS_URL = 'https://appleid.apple.com/auth/keys';
/** Apple은 키를 드물게 바꾼다 — 하루 동안은 다시 묻지 않는다 */
const KEYS_TTL_MS = 24 * 60 * 60 * 1000;

let cached: { keys: AppleKey[]; at: number } | null = null;

/**
 * Apple 공개키 목록. 모르는 `kid`가 오면 캐시를 버리고 한 번 더 받는다 — Apple이
 * 키를 막 돌렸을 때 하루 동안 모든 로그인이 실패하지 않게.
 */
async function keyFor(kid: string): Promise<AppleKey | undefined> {
  const fresh = cached && Date.now() - cached.at < KEYS_TTL_MS;
  if (fresh) {
    const hit = cached!.keys.find((key) => key.kid === kid);
    if (hit) return hit;
  }
  const { keys } = await getJson<{ keys: AppleKey[] }>('Apple', KEYS_URL, '');
  cached = { keys, at: Date.now() };
  return keys.find((key) => key.kid === kid);
}

/**
 * Apple로 로그인.
 *
 * 브라우저 동의 화면 길(`exchange`)은 없다 — Apple 로그인은 iOS의 시스템 창으로만
 * 한다. 앱이 받은 `identityToken`(서명된 JWT)을 **우리가 직접** 검증한다. 구글처럼
 * 대신 검증해주는 주소가 없어서다.
 *
 * 확인하는 것: Apple 키로 서명됐는지, 발급자가 Apple인지, `aud`가 **우리 앱의 번들
 * id**인지(없으면 남의 앱이 받은 토큰으로 로그인된다), 만료되지 않았는지.
 *
 * 이름은 토큰에 없다. Apple은 **처음 로그인할 때 앱에만** 이름을 한 번 알려주므로,
 * 앱이 그걸 `nickname`으로 함께 보낸다. 두 번째부터는 오지 않는다.
 */
export const apple: OAuthProvider = {
  name: 'apple',

  async exchange(): Promise<OAuthProfile> {
    rejectToken('Apple', '앱에서만 로그인할 수 있어요.');
  },

  async verify(input: TokenExchange, config: ProviderConfig): Promise<OAuthProfile> {
    if (!('idToken' in input)) rejectToken('Apple', 'identityToken이 필요해요.');

    const [head, body, signature] = input.idToken.split('.');
    if (!head || !body || !signature) rejectToken('Apple', '토큰 모양이 아니에요.');

    let header: AppleHeader;
    try {
      header = JSON.parse(Buffer.from(head, 'base64url').toString('utf8')) as AppleHeader;
    } catch {
      rejectToken('Apple', '토큰을 읽지 못했어요.');
    }
    if (header.alg !== 'RS256' || !header.kid) rejectToken('Apple', '서명 방식을 알 수 없어요.');

    const jwk = await keyFor(header.kid);
    if (!jwk) rejectToken('Apple', '서명한 키를 찾지 못했어요.');

    const valid = verifySignature(
      'RSA-SHA256',
      Buffer.from(`${head}.${body}`),
      createPublicKey({ key: jwk, format: 'jwk' }),
      Buffer.from(signature, 'base64url'),
    );
    if (!valid) rejectToken('Apple', '서명이 맞지 않아요.');

    const claims = peekJwt<AppleClaims>(input.idToken);
    if (!claims) rejectToken('Apple', '토큰을 읽지 못했어요.');
    if (claims.iss !== ISSUER) rejectToken('Apple', 'Apple이 발급한 토큰이 아니에요.');
    if (claims.aud !== config.clientId) rejectToken('Apple', '다른 앱에 발급된 토큰이에요.');
    if (claims.exp * 1000 < Date.now()) rejectToken('Apple', '토큰이 만료됐어요.');

    return {
      providerId: claims.sub,
      nickname: input.nickname?.trim() || claims.email?.split('@')[0] || '독자',
      email: claims.email,
    };
  },
};
