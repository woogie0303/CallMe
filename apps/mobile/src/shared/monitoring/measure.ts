import { Measure, MeasureConfig } from '@measuresh/react-native';

/**
 * 오류·성능 수집(Measure, measure.sh). iOS는 설정 플러그인(`app.config.js`)이 네이티브 쪽을
 * 켜고, 여기서는 JS 쪽을 한 번 시작한다. 충돌 보고서와 화면 흐름이 대시보드에 모인다.
 *
 * **개발 중에는 켜지 않는다** — Metro 화면이 이미 오류를 보여주고, 개발 세션이 대시보드에
 * 섞이면 실제 독자의 통계를 흐린다.
 *
 * 수집이 실패해도 앱은 멈추지 않는다. 오류를 모으는 일이 오류의 원인이 되면 안 된다.
 */
export function initMonitoring(): void {
  if (__DEV__) return;
  Measure.init({ config: new MeasureConfig({}) }).catch(() => undefined);
}

/**
 * 잡아서 처리한 오류도 남긴다. 화면이 '묻지 못했어요'를 띄우고 넘어가면 왜 못 물었는지가
 * 어디에도 남지 않는다 — 몇 분씩 도는 로딩의 원인을 찾을 수 없었던 이유다.
 */
export function reportError(
  error: unknown,
  where: string,
  extra?: Record<string, string | number | boolean>,
): void {
  if (__DEV__) return;
  Measure.trackError({ error, attributes: { where, ...extra } }).catch(
    () => undefined,
  );
}
