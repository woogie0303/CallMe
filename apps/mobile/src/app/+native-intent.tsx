/**
 * 앱으로 들어온 주소가 화면 라우터에 닿기 **전에** 거르는 자리(expo-router의
 * `+native-intent`).
 *
 * 소셜 로그인은 끝나면 제공자가 주소로 앱을 연다. 그 주소는 AppDelegate가 받아
 * 카카오·네이버·구글 SDK에 넘기고, 로그인은 거기서 끝난다. 그런데 Expo는 SDK가
 * "처리했다"고 알리지 않은 주소를 **화면 라우터에도 한 번 더** 넘긴다
 * (`expo/ios/AppDelegates/SceneEventForwarder.swift`). 라우터는 그 주소에 맞는 화면이
 * 없으니 "Unmatched Route"를 띄운다 — 로그인은 이미 된 채로.
 *
 * 그래서 로그인 콜백 주소는 여기서 버린다. `null`을 돌려주면 라우터는 아무 데로도
 * 가지 않는다 — 앱이 켜져 있으면 지금 화면 그대로, 꺼져 있다가 이 주소로 켜졌으면
 * 처음 화면으로. 로그인이 끝나 세션이 바뀌면 화면은 `_layout`의 문(Gate)이 옮긴다.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string | null {
  return isSignInCallback(path) ? null : path;
}

function isSignInCallback(path: string): boolean {
  const scheme = path.match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase() ?? '';
  return (
    /** 카카오 — `kakao{네이티브 앱 키}://oauth?…`. 카카오톡이 앱의 일반 스킴으로도
        한 번 더 연다: `reread://oauth?code=…` */
    scheme.startsWith('kakao') ||
    /^[a-z][a-z0-9+.-]*:\/\/oauth(\/|\?|$)/i.test(path) ||
    /** 네이버 — `{번들 id}://thirdPartyLoginResult?…` */
    path.includes('thirdPartyLoginResult') ||
    /** 구글 — `com.googleusercontent.apps.{클라이언트}:/…` */
    scheme.startsWith('com.googleusercontent.apps.')
  );
}
