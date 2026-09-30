import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  Logger,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { Model } from 'mongoose';
import { Reader } from '../readers/reader.schema';
import { toView } from './auth.service';
import { TokenService } from './token.service';

export class DevLoginDto {
  /** 같은 이름이면 같은 독자로 들어온다 — 기기를 바꿔가며 시험할 때 쓴다 */
  @IsOptional()
  @IsString()
  @MinLength(1)
  nickname?: string;
}

/**
 * **개발용 문이다. 배포 전에 이 파일을 지운다.**
 *
 * 카카오·네이버·구글 앱이 등록되기 전까지는 토큰을 받을 방법이 없어서 앱을
 * 한 줄도 붙여볼 수 없다. 그래서 임시로 문을 하나 낸다 — 다만 환경 변수로
 * 명시적으로 켜야 열리고, NODE_ENV=production이면 켜져 있어도 거부한다.
 * 열려 있는 동안에는 부팅 로그가 매번 그 사실을 말한다.
 *
 * 소셜 로그인이 실제로 도는 것을 확인하는 순간 이 컨트롤러와
 * `ALLOW_DEV_LOGIN`을 함께 지운다.
 *
 * 경로가 /auth 아래가 아닌 이유는 둘이다. `POST /auth/:provider`가 /auth 아래의
 * 한 칸짜리 길을 전부 먹어서 /auth/dev가 거기 잡히고, 무엇보다 뒷문을 진짜
 * 현관과 같은 자리에 두면 지울 때 하나를 빠뜨린다.
 */
@Controller('dev')
export class DevLoginController {
  private readonly log = new Logger(DevLoginController.name);

  constructor(
    @InjectModel(Reader.name) private readonly readers: Model<Reader>,
    private readonly tokens: TokenService,
    private readonly config: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: DevLoginDto) {
    if (!DevLoginController.enabled(this.config)) {
      throw new ForbiddenException('개발용 로그인은 꺼져 있어요.');
    }

    const nickname = dto.nickname ?? '개발용 독자';
    const providerId = `dev:${nickname}`;

    const reader =
      (await this.readers.findOne({
        'accounts.provider': 'google',
        'accounts.providerId': providerId,
      })) ??
      (await this.readers.create({
        nickname,
        accounts: [{ provider: 'google', providerId, linkedAt: new Date() }],
      }));

    this.log.warn(`개발용 로그인: ${nickname}`);
    const issued = await this.tokens.issue(reader.id);

    return { ...issued, reader: toView(reader) };
  }

  /** 켜져 있어도 운영에서는 절대 열리지 않는다 */
  static enabled(config: ConfigService): boolean {
    if (config.get('NODE_ENV') === 'production') return false;
    return config.get('ALLOW_DEV_LOGIN') === 'true';
  }
}
