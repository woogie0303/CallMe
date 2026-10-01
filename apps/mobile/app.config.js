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
    ],
  };
};
