import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPrivateKey, sign } from 'node:crypto';

const TOKEN_URL = 'https://appleid.apple.com/auth/token';
const REVOKE_URL = 'https://appleid.apple.com/auth/revoke';
const AUDIENCE = 'https://appleid.apple.com';

/**
 * Apple 쪽 연결을 맺고 끊는다.
 *
 * 계정을 지울 때 Apple 로그인으로 만든 계정이면 Apple에도 "이 앱과의 연결을 끊는다"고
 * 알려야 한다(심사 지침 5.1.1(v), Apple 로그인 정책). 끊으려면 로그인 때 앱이 받은
 * `authorizationCode`를 Apple 토큰 엔드포인트에서 refresh token으로 바꿔 둬야 하고,
 * 그 refresh token을 `/auth/revoke`에 내야 한다. 둘 다 **우리 서버가 Apple 개발자
 * 계정의 키(.p8)로 서명한 `client_secret`** 을 요구한다.
 *
 * 키가 없으면(무료 팀 개발, 아직 유료 계정 전) 아무 일도 하지 않는다 — 로그인과
 * 계정 삭제는 그대로 돈다. 다만 그동안 만들어진 Apple 계정은 refresh token이 없어서
 * 회수할 수 없으니, 출시 전에 이 값들을 채워야 한다(`.env.example`).
 *
 * 한 번도 Apple과 실제로 통신해 본 적이 없다 — 유료 개발자 계정이 있어야 시험할 수 있다.
 */
@Injectable()
export class AppleTokenService {
  private readonly log = new Logger(AppleTokenService.name);

  constructor(private readonly config: ConfigService) {}

  /** 서명에 필요한 값이 다 있는가 */
  enabled(): boolean {
    return Boolean(
      this.config.get('APPLE_CLIENT_ID') &&
      this.config.get('APPLE_TEAM_ID') &&
      this.config.get('APPLE_KEY_ID') &&
      this.config.get('APPLE_PRIVATE_KEY'),
    );
  }

  /**
   * 로그인 때 받은 코드를 refresh token으로 바꾼다. **실패해도 던지지 않는다** —
   * 이걸 못 받았다고 로그인을 막으면 독자가 앱에 못 들어온다. 못 받으면 나중에
   * 회수를 못 할 뿐이라, 눈에 띄게 남기고 넘어간다.
   */
  async exchangeCode(authorizationCode: string): Promise<string | undefined> {
    if (!this.enabled()) return undefined;
    try {
      const response = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.config.getOrThrow<string>('APPLE_CLIENT_ID'),
          client_secret: this.clientSecret(),
          code: authorizationCode,
          grant_type: 'authorization_code',
        }),
      });
      const body = (await response.json()) as { refresh_token?: string };
      if (!response.ok || !body.refresh_token) {
        this.log.error(
          `Apple이 refresh token을 주지 않았어요: ${response.status}`,
        );
        return undefined;
      }
      return body.refresh_token;
    } catch (error) {
      this.log.error(`Apple 토큰 교환에 실패했어요: ${String(error)}`);
      return undefined;
    }
  }

  /**
   * refresh token을 회수한다. 던진다 — 부르는 쪽(계정 삭제)이 실패를 어떻게 다룰지
   * 정한다. 이미 회수된 토큰(`invalid_grant`)은 목적이 이뤄진 것이라 성공으로 친다.
   */
  async revoke(refreshToken: string): Promise<void> {
    const response = await fetch(REVOKE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.config.getOrThrow<string>('APPLE_CLIENT_ID'),
        client_secret: this.clientSecret(),
        token: refreshToken,
        token_type_hint: 'refresh_token',
      }),
    });
    if (response.ok) return;

    const text = await response.text();
    if (response.status === 400 && text.includes('invalid_grant')) return;
    throw new Error(
      `Apple 회수 실패 ${response.status}: ${text.slice(0, 200)}`,
    );
  }

  /** Apple이 요구하는 ES256 JWT. 유효 시간은 짧게 — 요청 한 번에만 쓴다. */
  private clientSecret(): string {
    const now = Math.floor(Date.now() / 1000);
    const header = {
      alg: 'ES256',
      kid: this.config.getOrThrow<string>('APPLE_KEY_ID'),
    };
    const claims = {
      iss: this.config.getOrThrow<string>('APPLE_TEAM_ID'),
      iat: now,
      exp: now + 300,
      aud: AUDIENCE,
      sub: this.config.getOrThrow<string>('APPLE_CLIENT_ID'),
    };
    const encode = (value: object) =>
      Buffer.from(JSON.stringify(value)).toString('base64url');
    const input = `${encode(header)}.${encode(claims)}`;

    /** .env에는 줄바꿈이 `\n` 두 글자로 들어오기 쉽다 */
    const pem = this.config
      .getOrThrow<string>('APPLE_PRIVATE_KEY')
      .replace(/\\n/g, '\n');
    const signature = sign('sha256', Buffer.from(input), {
      key: createPrivateKey(pem),
      dsaEncoding: 'ieee-p1363',
    });
    return `${input}.${signature.toString('base64url')}`;
  }
}
