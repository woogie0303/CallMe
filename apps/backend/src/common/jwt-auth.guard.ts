import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

/** 액세스 토큰이 실어 나르는 것은 독자 한 명뿐이다. */
export type AccessPayload = { sub: string };

export type AuthedRequest = Request & { readerId?: string };

/**
 * Authorization: Bearer <액세스 토큰>을 검사한다.
 *
 * 토큰이 말하는 것은 '누구인가' 하나뿐이고, '무엇을 볼 수 있는가'는 검사하지
 * 않는다 — 소유 검사는 서비스가 readerId로 걸러서 한다. 가드가 둘 다 하려
 * 들면 어느 쪽도 믿을 수 없게 된다.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const header = request.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('로그인이 필요해요.');
    }

    try {
      const payload = await this.jwt.verifyAsync<AccessPayload>(token);
      request.readerId = payload.sub;
      return true;
    } catch {
      throw new UnauthorizedException('로그인이 만료됐어요. 다시 로그인해 주세요.');
    }
  }
}
