import * as Sentry from '@sentry/react-native';

/**
 * 오류 수집(Sentry). 출시 빌드에서 DSN이 있을 때만 켜진다 — 개발 중에는 Metro 화면이
 * 이미 오류를 보여주고, DSN 없이 켜 둬도 보낼 곳이 없다.
 *
 * **독자의 글을 보내지 않는다.** `sendDefaultPii`를 끄고, 문장·메모 같은 본문은 오류에
 * 싣지 않는다(개인정보 처리방침과 맞춰야 한다). 사진은 어차피 기기 밖으로 나가지 않는다.
 */
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

export function initMonitoring(): void {
  Sentry.init({
    dsn,
    enabled: !__DEV__ && Boolean(dsn),
    sendDefaultPii: false,
    tracesSampleRate: 0,
  });
}

/**
 * 잡아서 처리한 오류도 남긴다. 화면이 '묻지 못했어요'를 띄우고 넘어가면 왜 못
 * 물었는지가 어디에도 남지 않는다 — 몇 분씩 도는 로딩의 원인을 찾을 수 없었던 이유다.
 */
export function reportError(
  error: unknown,
  where: string,
  extra?: Record<string, string | number | boolean>,
): void {
  Sentry.captureException(error, { tags: { where }, extra });
}

export { Sentry };
