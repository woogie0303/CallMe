import { Controller, Get, type INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { SkipThrottle, Throttle, ThrottlerModule } from '@nestjs/throttler';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import {
  RATE_LIMIT_MESSAGE,
  RateLimitGuard,
  rateLimitOptions,
  trustProxyHops,
} from './rate-limit';

/**
 * 진짜 `@nestjs/jwt`는 이 저장소의 ts-jest 설정과 부딪힌다(`oauth-session.service.spec.ts`
 * 참고). 가드가 쓰는 것은 `verifyAsync` 하나라서 같은 모양의 가짜를 쓴다 — 'valid-A'면
 * 독자 A, 그 밖의 문자열은 서명이 틀린 토큰이다.
 */
const fakeJwt = {
  verifyAsync: (token: string) =>
    token.startsWith('valid-')
      ? Promise.resolve({ sub: token.slice('valid-'.length) })
      : Promise.reject(new Error('bad signature')),
};

@Controller('t')
class ProbeController {
  @Get('free')
  free() {
    return { ok: true };
  }

  @SkipThrottle()
  @Get('skipped')
  skipped() {
    return { ok: true };
  }

  @Throttle({ default: { limit: 2, ttl: 60_000 } })
  @Get('tight')
  tight() {
    return { ok: true };
  }
}

describe('RateLimitGuard', () => {
  let app: INestApplication;
  let server: Parameters<typeof request>[0];

  /** 한 통의 한도를 3으로 낮춰 시험한다 — 카운터가 섞이지 않게 시험마다 새로 띄운다 */
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot(rateLimitOptions({ limit: 3, ttl: 60_000 })),
      ],
      controllers: [ProbeController],
      providers: [
        { provide: APP_GUARD, useClass: RateLimitGuard },
        { provide: JwtService, useValue: fakeJwt },
      ],
    }).compile();

    const express = moduleRef.createNestApplication<NestExpressApplication>();
    express.set('trust proxy', 1);
    await express.init();
    app = express;
    server = app.getHttpServer() as Parameters<typeof request>[0];
  });

  afterEach(() => app.close());

  const hit = (path: string, opts: { ip?: string; token?: string } = {}) => {
    const req = request(server).get(path);
    if (opts.ip) req.set('X-Forwarded-For', opts.ip);
    if (opts.token) req.set('Authorization', `Bearer ${opts.token}`);
    return req;
  };

  it('같은 IP의 익명 호출은 한도를 넘으면 429와 한국어 안내를 받는다', async () => {
    for (let i = 0; i < 3; i++)
      await hit('/t/free', { ip: '1.1.1.1' }).expect(200);

    const blocked = await hit('/t/free', { ip: '1.1.1.1' }).expect(429);
    const body = blocked.body as { message: string };
    expect(body.message).toBe(RATE_LIMIT_MESSAGE);
    expect(blocked.headers['retry-after']).toBeDefined();
  });

  it('다른 IP는 다른 통이다', async () => {
    for (let i = 0; i < 3; i++)
      await hit('/t/free', { ip: '1.1.1.1' }).expect(200);
    await hit('/t/free', { ip: '1.1.1.1' }).expect(429);

    await hit('/t/free', { ip: '2.2.2.2' }).expect(200);
  });

  it('로그인한 독자는 IP를 바꿔도 같은 통이다', async () => {
    await hit('/t/free', { ip: '1.1.1.1', token: 'valid-A' }).expect(200);
    await hit('/t/free', { ip: '2.2.2.2', token: 'valid-A' }).expect(200);
    await hit('/t/free', { ip: '3.3.3.3', token: 'valid-A' }).expect(200);

    await hit('/t/free', { ip: '4.4.4.4', token: 'valid-A' }).expect(429);
  });

  it('독자가 다르면 같은 IP여도 다른 통이다 — 통신사 망 뒤의 여러 사람이 서로 막지 않는다', async () => {
    for (let i = 0; i < 3; i++)
      await hit('/t/free', { ip: '9.9.9.9', token: 'valid-A' }).expect(200);
    await hit('/t/free', { ip: '9.9.9.9', token: 'valid-A' }).expect(429);

    await hit('/t/free', { ip: '9.9.9.9', token: 'valid-B' }).expect(200);
  });

  it('서명이 틀린 토큰으로 독자를 지어내도 한도를 피하지 못한다', async () => {
    /** 검증 없이 sub를 믿으면 호출마다 새 독자를 지어내 새 통을 얻는다 */
    for (const forged of ['forged-1', 'forged-2', 'forged-3'])
      await hit('/t/free', { ip: '5.5.5.5', token: forged }).expect(200);

    await hit('/t/free', { ip: '5.5.5.5', token: 'forged-4' }).expect(429);
  });

  it('@SkipThrottle 길은 세지 않는다 — 상태 확인이 스스로 막히면 안 된다', async () => {
    for (let i = 0; i < 10; i++)
      await hit('/t/skipped', { ip: '6.6.6.6' }).expect(200);
  });

  it('@Throttle로 길마다 다른 한도를 줄 수 있다', async () => {
    await hit('/t/tight', { ip: '7.7.7.7' }).expect(200);
    await hit('/t/tight', { ip: '7.7.7.7' }).expect(200);

    await hit('/t/tight', { ip: '7.7.7.7' }).expect(429);
    /** 같은 IP여도 다른 길은 바닥 한도(3)가 따로 남아 있다 */
    await hit('/t/free', { ip: '7.7.7.7' }).expect(200);
  });
});

describe('trustProxyHops', () => {
  it('설정이 없으면 개발은 0단, 운영은 1단이다', () => {
    expect(trustProxyHops({})).toBe(0);
    expect(trustProxyHops({ NODE_ENV: 'development' })).toBe(0);
    expect(trustProxyHops({ NODE_ENV: 'production' })).toBe(1);
  });

  it('TRUST_PROXY가 있으면 운영이어도 그 값을 따른다', () => {
    expect(trustProxyHops({ NODE_ENV: 'production', TRUST_PROXY: '0' })).toBe(
      0,
    );
    expect(trustProxyHops({ NODE_ENV: 'production', TRUST_PROXY: '2' })).toBe(
      2,
    );
    expect(trustProxyHops({ TRUST_PROXY: ' 1 ' })).toBe(1);
  });

  it('빈 값은 없는 것과 같다', () => {
    expect(trustProxyHops({ NODE_ENV: 'production', TRUST_PROXY: '' })).toBe(1);
  });

  it('정수가 아닌 값은 조용히 넘기지 않고 부팅을 막는다', () => {
    expect(() => trustProxyHops({ TRUST_PROXY: 'true' })).toThrow(
      'TRUST_PROXY',
    );
    expect(() => trustProxyHops({ TRUST_PROXY: '-1' })).toThrow('TRUST_PROXY');
    expect(() => trustProxyHops({ TRUST_PROXY: '1.5' })).toThrow('TRUST_PROXY');
  });
});
