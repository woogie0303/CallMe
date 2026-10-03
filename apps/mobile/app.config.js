/**
 * `app.json` 위에 얹는 동적 설정.
 *
 * 카카오·네이버·구글은 이제 네이티브 SDK가 아니라 브라우저 동의 화면 +
 * 서버 콜백으로 로그인한다(`shared/session/oauth.ts`) — 앱 번들에 넣을 키가
 * 없다. Apple만 여전히 네이티브 권한이 필요해서, 이 파일에 남은 일은 그
 * 권한을 켤지 끌지뿐이다.
 */
const { createRunOncePlugin } = require('expo/config-plugins');

/**
 * Apple 로그인 권한(`com.apple.developer.applesignin`)은 **유료 개발자 계정**에서만
 * 켤 수 있다. 무료 개인 팀으로 지으면서 이 권한을 넣으면 프로비저닝이 실패해 빌드가
 * 멈춘다. 그래서 켜도 되는 빌드에서만 `true`로 둔다 — 앱 코드(`shared/session/oauth.ts`)도
 * 같은 값을 보고 버튼을 살린다.
 */
const APPLE_SIGN_IN = process.env.EXPO_PUBLIC_APPLE_SIGN_IN === 'true';

/**
 * 출시 빌드(`eas build --profile production`)에서 빠지면 **조용히 망가지는** 값들을
 * 빌드 시작 전에 막는다. EAS 클라우드 빌드는 gitignore된 `.env`를 못 받아서 이 값들이
 * 비어 있기 쉽고, 비어 있으면 앱은 오류 없이 이렇게 된다:
 *   - API 주소 없음 → 개발 서버 주소를 추측해 서버에 못 붙는다
 *   - Apple 로그인 꺼짐 → 다른 소셜 로그인만 있는 앱이 된다(심사 지침 4.8 반려)
 * EAS가 빌드 때 `EAS_BUILD_PROFILE`을 채워 주므로 개발 빌드와 로컬에서는 돌지 않는다.
 */
if (process.env.EAS_BUILD_PROFILE === 'production') {
  const missing = [
    ['EXPO_PUBLIC_API_URL', '서버 주소 (eas.json의 production env)'],
  ].filter(([key]) => !process.env[key]);
  if (!APPLE_SIGN_IN) {
    missing.push([
      'EXPO_PUBLIC_APPLE_SIGN_IN=true',
      'Apple 로그인 (유료 개발자 계정 필요, 심사 지침 4.8)',
    ]);
  }
  if (missing.length) {
    throw new Error(
      '출시 빌드에 필요한 값이 없어요:\n' +
        missing.map(([key, why]) => `  - ${key}: ${why}`).join('\n'),
    );
  }
}

module.exports = ({ config }) => {
  return {
    ...config,
    ios: { ...config.ios, usesAppleSignIn: APPLE_SIGN_IN },
    plugins: [
      ...(config.plugins ?? []),
      /**
       * 끌 때는 **빈 플러그인을 같은 이름으로** 걸어둔다. Expo는
       * `expo-apple-authentication`이 설치돼 있기만 하면 그 플러그인을 알아서
       * 붙여 권한을 넣는데(prebuild-config의 legacy plugin), 그 플러그인은
       * 패키지 이름으로 한 번만 돌게 돼 있다. 같은 이름으로 먼저 '돌았음'을
       * 남겨두면 자동으로 붙는 쪽이 건너뛴다 — 설정에서 빼는 것만으로는
       * 막히지 않는다.
       */
      APPLE_SIGN_IN
        ? 'expo-apple-authentication'
        : createRunOncePlugin((c) => c, 'expo-apple-authentication'),
      /**
       * 복습 알림은 **기기 안에서 예약하는 로컬 알림**이라 서버가 보내는 푸시(APNs)가
       * 필요 없다. 그런데 `expo-notifications` 플러그인은 설치돼 있기만 하면
       * `aps-environment` 권한을 무조건 넣고, 그 권한도 유료 개발자 계정이 있어야
       * 프로비저닝된다 — 무료 팀으로 지으면 위 Apple 로그인과 똑같이 빌드가 멈춘다.
       * 로컬 알림에는 그 권한이 필요 없으니 같은 방법으로 자동 적용을 건너뛴다.
       * 서버 푸시를 붙이는 날 이 줄을 지우고 플러그인을 켠다.
       */
      createRunOncePlugin((c) => c, 'expo-notifications'),
    ],
  };
};
