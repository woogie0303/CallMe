import { IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

/** 동의 화면에서 받아온 인가 코드를 넘겨준다. 토큰 교환은 서버가 한다. */
export class ExchangeCodeDto {
  @IsString()
  @MinLength(1)
  code!: string;

  @IsUrl({ require_tld: false, protocols: ['http', 'https'] })
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
