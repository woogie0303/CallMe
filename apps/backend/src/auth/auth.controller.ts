import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseEnumPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentReader } from '../common/current-reader.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { PROVIDERS as PROVIDER_NAMES, type ProviderName } from '../readers/reader.schema';
import { AuthService } from './auth.service';
import { ExchangeCodeDto, RefreshDto } from './dto/auth.dto';
import { TokenService } from './token.service';

const ProviderEnum = Object.fromEntries(PROVIDER_NAMES.map((p) => [p, p])) as Record<
  ProviderName,
  ProviderName
>;

/**
 * 회원가입과 로그인이 같은 문 하나로 들어온다. 처음 온 소셜 계정이면 독자를
 * 만들고, 아니면 있던 독자로 이어준다 — 읽는 사람에게 '가입'이라는 단계를
 * 따로 만들 이유가 없다.
 *
 * refresh·logout이 :provider보다 먼저 선언돼 있어야 한다. 나중에 두면
 * /auth/refresh가 provider 이름으로 잡힌다.
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly tokens: TokenService,
  ) {}

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto) {
    return this.tokens.rotate(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Body() dto: RefreshDto): Promise<void> {
    await this.tokens.revoke(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentReader() readerId: string) {
    return this.auth.me(readerId);
  }

  @Post(':provider')
  @HttpCode(200)
  signIn(
    @Param('provider', new ParseEnumPipe(ProviderEnum)) provider: ProviderName,
    @Body() dto: ExchangeCodeDto,
  ) {
    return this.auth.signIn(provider, dto);
  }
}
