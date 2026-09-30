import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

/**
 * 들어오는 길이 둘이다.
 *
 * - **인가 코드**(`code` + `redirectUri`) — 브라우저 동의 화면을 거친 경우.
 *   서버가 토큰으로 바꾼다.
 * - **토큰**(`idToken` 또는 `accessToken`) — 앱의 네이티브 SDK가 이미 받아온 경우.
 *   서버는 바꾸지 않고 **누구에게 발급된 것인지 대조**한다.
 *
 * 둘 중 하나는 반드시 와야 한다. 셋 다 비어 있으면 무엇을 하려는 요청인지
 * 알 수 없다.
 */
export class ExchangeCodeDto {
  /** 네이티브 SDK가 준 서명된 토큰 — 가능한 제공자에서는 이쪽이 안전하다 */
  @IsOptional()
  @IsString()
  @MinLength(1)
  idToken?: string;

  /** idToken을 주지 않는 제공자(네이버)용 */
  @IsOptional()
  @IsString()
  @MinLength(1)
  accessToken?: string;

  /**
   * 앱이 따로 알고 있는 이름 — Apple만 쓴다. Apple은 이름을 토큰에 넣지 않고
   * 처음 로그인할 때 앱에만 한 번 알려준다.
   */
  @IsOptional()
  @IsString()
  @MaxLength(40, { message: '이름은 40자까지만 받아요.' })
  nickname?: string;

  @ValidateIf((dto: ExchangeCodeDto) => !dto.idToken && !dto.accessToken)
  @IsString()
  @MinLength(1)
  code?: string;

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
  @ValidateIf((dto: ExchangeCodeDto) => !dto.idToken && !dto.accessToken)
  @Matches(/^[a-z][a-z0-9+.-]*:\/\/?[^\s]+$/i, {
    message: 'redirectUri는 스킴이 붙은 주소여야 해요 (예: reread://oauth).',
  })
  redirectUri?: string;

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
