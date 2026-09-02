import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reader, type ProviderName, type ReaderDocument } from '../readers/reader.schema';
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

  async signIn(provider: ProviderName, dto: ExchangeCodeDto): Promise<SignInResult> {
    const profile = await PROVIDERS[provider].exchange(dto, this.configFor(provider));
    const reader = await this.findOrCreate(provider, profile);
    const issued = await this.tokens.issue(reader.id as string);

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

    return { clientId, clientSecret: this.config.get<string>(`${key}_CLIENT_SECRET`) };
  }
}

export function toView(reader: ReaderDocument): ReaderView {
  return {
    id: reader.id as string,
    nickname: reader.nickname,
    email: reader.email,
    profileImage: reader.profileImage,
    level: reader.level,
    booksFinished: reader.booksFinished,
    providers: reader.accounts.map((account) => account.provider),
  };
}
