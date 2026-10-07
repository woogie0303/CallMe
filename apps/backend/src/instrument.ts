import * as Sentry from '@sentry/nestjs';

/**
 * 오류 수집(Sentry). **다른 어떤 import보다 먼저** 불려야 한다(`main.ts` 맨 위) — 나중에
 * 켜면 그 전에 불러온 모듈의 오류를 잡지 못한다.
 *
 * `SENTRY_DSN`이 없으면 꺼진 채로 돈다. 요청 본문(독자의 문장·메모)은 싣지 않는다.
 */
const dsn = process.env.SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.NODE_ENV ?? 'development',
  tracesSampleRate: 0,
  /** 요청 본문은 보내지 않는다 — 책에서 옮겨 적은 글과 독자의 생각이 들어 있다 */
  beforeSend(event) {
    if (event.request) delete event.request.data;
    return event;
  },
});
