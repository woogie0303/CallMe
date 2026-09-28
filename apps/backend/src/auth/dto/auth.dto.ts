import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

/** 동의 화면에서 받아온 인가 코드를 넘겨준다. 토큰 교환은 서버가 한다. */
export class ExchangeCodeDto {
  @IsString()
  @MinLength(1)
  code!: string;

  /**
   * 네이티브 앱의 돌아올 주소는 http(s)가 아니다.
   *
   * `@IsUrl`로 막아두면 앱이 보내는 `reread://oauth`가 제공자에 닿기도 전에
   * 400으로 떨어진다. 구글 iOS 클라이언트는 `com.googleusercontent.apps.…:/`
   * 꼴이고, Expo 프록시를 쓰면 https가 되기도 한다 — 모양이 하나가 아니다.
   *
   * 그래서 스킴이 붙어 있는지만 본다. 이 값이 실제로 허락된 주소인지는
   * **제공자가 판단한다** — 콘솔에 등록해 둔 것과 글자 하나까지 맞아야 하고,
   * 그 확인을 우리가 대신할 수도, 대신해서도 안 된다.
   */
  @Matches(/^[a-z][a-z0-9+.-]*:\/\/?[^\s]+$/i, {
    message: 'redirectUri는 스킴이 붙은 주소여야 해요 (예: reread://oauth).',
  })
  redirectUri!: string;

  /** PKCE를 쓴 클라이언트만 */
  @IsOptional()
  @IsString()
  codeVerifier?: string;

  /** 네이버가 요구한다 */
  @IsOptional()
  @IsString()
  state?: string;
}

export class RefreshDto {
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}
