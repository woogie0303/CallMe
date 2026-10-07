import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { createHash, randomBytes } from 'node:crypto';
import { Model, Types } from 'mongoose';
import { RefreshToken } from './schemas/refresh-token.schema';

export type IssuedTokens = {
  accessToken: string;
  refreshToken: string;
  /** 액세스 토큰이 몇 초 뒤에 만료되는지 */
  expiresIn: number;
};

/**
 * 토큰 두 장을 만들고 돌리는 곳.
 *
 * 액세스는 짧게 살고 서명만으로 검사한다. 리프레시는 길게 살지만 DB에 해시로
 * 남겨 언제든 끊을 수 있게 한다 — 서명만으로 검사하는 긴 토큰은 로그아웃해도
 * 만료 전까지 살아 있고, 그건 로그아웃이라고 부를 수 없다.
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectModel(RefreshToken.name)
    private readonly tokens: Model<RefreshToken>,
  ) {}

  async issue(readerId: string): Promise<IssuedTokens> {
    const accessToken = await this.jwt.signAsync({ sub: readerId });
    const refreshToken = randomBytes(48).toString('base64url');

    await this.tokens.create({
      readerId: new Types.ObjectId(readerId),
      tokenHash: hash(refreshToken),
      expiresAt: new Date(Date.now() + this.refreshTtlMs()),
    });

    return { accessToken, refreshToken, expiresIn: this.accessTtlSeconds() };
  }

  /**
   * 쓴 토큰은 그 자리에서 폐기하고 새 것을 내준다. 폐기된 토큰이 다시 오면
   * 누군가 훔쳐 쓰고 있다는 뜻이라, 그 독자의 세션을 전부 끊는다.
   */
  async rotate(refreshToken: string): Promise<IssuedTokens> {
    const found = await this.tokens.findOne({ tokenHash: hash(refreshToken) });

    if (!found || found.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('다시 로그인해 주세요.');
    }

    if (found.revokedAt) {
      await this.tokens.updateMany(
        { readerId: found.readerId, revokedAt: { $exists: false } },
        { $set: { revokedAt: new Date() } },
      );
      throw new UnauthorizedException('다시 로그인해 주세요.');
    }

    found.revokedAt = new Date();
    await found.save();

    return this.issue(found.readerId.toString());
  }

  async revoke(refreshToken: string): Promise<void> {
    await this.tokens.updateOne(
      { tokenHash: hash(refreshToken), revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } },
    );
  }

  private accessTtlSeconds(): number {
    return Number(this.config.get('ACCESS_TOKEN_TTL_SECONDS') ?? 60 * 15);
  }

  private refreshTtlMs(): number {
    const days = Number(this.config.get('REFRESH_TOKEN_TTL_DAYS') ?? 30);
    return days * 24 * 60 * 60 * 1000;
  }
}

/** 원문은 남기지 않는다 — 대조에 필요한 건 해시뿐이다 */
function hash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
