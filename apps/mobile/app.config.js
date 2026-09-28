/**
 * `app.json` 위에 얹는 동적 설정.
 *
 * 소셜 로그인 네이티브 SDK는 빌드할 때 키가 필요하다 — 앱이 켜진 뒤에 넣을 수
 * 없어서 플러그인 옵션으로 들어가야 하고, 그래서 정적 JSON으로는 값을 env에서
 * 가져올 수가 없다. 이 파일이 그 자리다.
 *
 * 여기 들어가는 값은 전부 **앱 번들에 박히는 공개 값**이다(네이티브 앱 키,
 * client id). 시크릿은 서버에만 둔다 — 번들은 뜯어볼 수 있다.
 */
const { createRunOncePlugin } = require('expo/config-plugins');

const KAKAO_NATIVE_APP_KEY = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
/**
 * Apple 로그인 권한(`com.apple.developer.applesignin`)은 **유료 개발자 계정**에서만
 * 켤 수 있다. 무료 개인 팀으로 지으면서 이 권한을 넣으면 프로비저닝이 실패해 빌드가
 * 멈춘다. 그래서 켜도 되는 빌드에서만 `true`로 둔다 — 앱 코드(`shared/session/oauth.ts`)도
 * 같은 값을 보고 버튼을 살린다.
 */
const APPLE_SIGN_IN = process.env.EXPO_PUBLIC_APPLE_SIGN_IN === 'true';

/** 구글은 client id를 거꾸로 뒤집은 것이 URL 스킴이 된다 */
const googleUrlScheme = GOOGLE_IOS_CLIENT_ID
  ? `com.googleusercontent.apps.${GOOGLE_IOS_CLIENT_ID.split('.')[0]}`
  : undefined;

module.exports = ({ config }) => {
  const bundleId = config.ios?.bundleIdentifier ?? 'com.anonymous.mobile';

  /** 키가 없는 제공자는 플러그인을 넣지 않는다 — 없는 키로 빌드하면 빌드가 깨진다 */
  const social = [];
  if (KAKAO_NATIVE_APP_KEY) {
    social.push([
      '@react-native-kakao/core',
      { nativeAppKey: KAKAO_NATIVE_APP_KEY, ios: { handleKakaoOpenUrl: true } },
    ]);
  }
  social.push(['@react-native-seoul/naver-login', { urlScheme: bundleId }]);
  if (googleUrlScheme) {
    social.push(['@react-native-google-signin/google-signin', { iosUrlScheme: googleUrlScheme }]);
  }
  /**
   * 끌 때는 **빈 플러그인을 같은 이름으로** 걸어둔다. Expo는 `expo-apple-authentication`이
   * 설치돼 있기만 하면 그 플러그인을 알아서 붙여 권한을 넣는데(prebuild-config의
   * legacy plugin), 그 플러그인은 패키지 이름으로 한 번만 돌게 돼 있다. 같은 이름으로
   * 먼저 '돌았음'을 남겨두면 자동으로 붙는 쪽이 건너뛴다 — 설정에서 빼는 것만으로는
   * 막히지 않는다.
   */
  social.push(
    APPLE_SIGN_IN
      ? 'expo-apple-authentication'
      : createRunOncePlugin((c) => c, 'expo-apple-authentication'),
  );

  return {
    ...config,
    ios: { ...config.ios, usesAppleSignIn: APPLE_SIGN_IN },
    plugins: [
      /** 자동으로 붙은 이름만 있는 항목을 걷어내고, 옵션을 채운 것으로 바꾼다 */
      ...(config.plugins ?? []).filter((p) => {
        const name = Array.isArray(p) ? p[0] : p;
        return !String(name).startsWith('@react-native-');
      }),
      ...social,
    ],
  };
};
