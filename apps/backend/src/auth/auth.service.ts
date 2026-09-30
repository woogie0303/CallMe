import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Reader,
  type ProviderName,
  type ReaderDocument,
} from '../readers/reader.schema';
import { PROVIDERS, type OAuthProfile, type ProviderConfig } from './oauth';
import type { ExchangeCodeDto } from './dto/auth.dto';
import { TokenService, type IssuedTokens } from './token.service';

export type ReaderView = {
  id: string;
  nickname: string;
  email?: string;
  profileImage?: string;
  level: string;
  booksFinished: number;
  providers: ProviderName[];
};

export type SignInResult = IssuedTokens & { reader: ReaderView };

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Reader.name) private readonly readers: Model<Reader>,
    private readonly tokens: TokenService,
    private readonly config: ConfigService,
  ) {}

  /**
   * 앱이 토큰을 들고 오면 그 토큰이 우리 앱 것인지 대조하고(`verify`), 브라우저
   * 동의 화면을 거쳐 인가 코드를 들고 오면 토큰으로 바꾼다(`exchange`).
   * 어느 쪽이든 그다음은 같다 — 프로필로 독자를 찾거나 만든다.
   */
  async signIn(
    provider: ProviderName,
    dto: ExchangeCodeDto,
  ): Promise<SignInResult> {
    const config = this.configFor(provider);
    const impl = PROVIDERS[provider];

    const profile = dto.idToken
      ? await impl.verify(
          { idToken: dto.idToken, nickname: dto.nickname },
          config,
        )
      : dto.accessToken
        ? await impl.verify(
            { accessToken: dto.accessToken, nickname: dto.nickname },
            config,
          )
        : await impl.exchange(
            {
              code: dto.code!,
              redirectUri: dto.redirectUri!,
              codeVerifier: dto.codeVerifier,
              state: dto.state,
            },
            config,
          );
    const reader = await this.findOrCreate(provider, profile);
    const issued = await this.tokens.issue(reader.id);

    return { ...issued, reader: toView(reader) };
  }

  async me(readerId: string): Promise<ReaderView> {
    const reader = await this.readers.findById(readerId);
    if (!reader) throw new NotFoundException('그 독자를 찾지 못했어요.');
    return toView(reader);
  }

  /**
   * 같은 소셜 계정으로 들어오면 늘 같은 독자다.
   *
   * 이메일이 같다고 다른 제공자의 계정을 자동으로 붙이지는 않는다 — 제공자가
   * 확인해 준 이메일이라는 보장이 없고, 남의 계정을 넘겨받는 길이 되기 때문이다.
   * 계정을 합치는 일은 로그인한 상태에서 따로 해야 한다.
   */
  private async findOrCreate(
    provider: ProviderName,
    profile: OAuthProfile,
  ): Promise<ReaderDocument> {
    const existing = await this.readers.findOne({
      'accounts.provider': provider,
      'accounts.providerId': profile.providerId,
    });

    if (existing) return existing;

    return this.readers.create({
      nickname: profile.nickname,
      email: profile.email,
      profileImage: profile.profileImage,
      accounts: [
        {
          provider,
          providerId: profile.providerId,
          email: profile.email,
          linkedAt: new Date(),
        },
      ],
    });
  }

  private configFor(provider: ProviderName): ProviderConfig {
    const key = provider.toUpperCase();
    const clientId = this.config.get<string>(`${key}_CLIENT_ID`);

    if (!clientId) {
      throw new InternalServerErrorException(
        `${key}_CLIENT_ID가 설정되지 않았어요. .env를 확인해 주세요.`,
      );
    }

    return {
      clientId,
      clientSecret: this.config.get<string>(`${key}_CLIENT_SECRET`),
      /** 앱이 네이티브 SDK로 받아온 토큰을 대조할 때 쓴다 — 카카오만 해당 */
      nativeAppKey: this.config.get<string>(`${key}_NATIVE_APP_KEY`),
      appId: this.config.get<string>(`${key}_APP_ID`),
    };
  }
}

export function toView(reader: ReaderDocument): ReaderView {
  return {
    id: reader.id,
    nickname: reader.nickname,
    email: reader.email,
    profileImage: reader.profileImage,
    level: reader.level,
    booksFinished: reader.booksFinished,
    providers: reader.accounts.map((account) => account.provider),
  };
}
