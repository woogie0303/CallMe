# Reread — 모바일

Expo SDK 57 / expo-router. 처음 여섯 화면은 claude.ai/design 프로젝트
`055dea1a-400b-4b8a-854e-f4ced05a8c70`의 `Reread.dc.html`에서 왔지만, 서랍과
촬영은 그 뒤 문장 중심으로 다시 지었다(ADR-0004) — 그 둘은 디자인 문서가 아니라
아래의 규칙이 원본이다.

> Expo는 자주 바뀐다. 코드를 쓰기 전에
> https://docs.expo.dev/versions/v57.0.0/ 의 해당 버전 문서를 확인한다.

## 구조

웹(`apps/web`)과 같은 FSD를 따른다 — `app / widgets / entities / shared`.
의존 방향은 언제나 아래로만 흐른다. `src/app` 아래 파일은 전부 라우트가 되므로
화면이 아닌 코드는 절대 여기 두지 않는다.

```
app/(tabs)/   홈 · 서랍 · 마이           (탭 바는 widgets/app-tab-bar가 직접 그린다)
app/          질문 · 촬영 · 문장 같은, 탭 밖에서 열리는 화면들
widgets/      화면 한 덩어리
entities/     책 · 표현 · 문장 · 읽기 기록 — 도메인별 api(서버 훅) / model / ui
shared/       토큰 · 타입 램프 · 아이콘 · API 클라이언트 · 조각 UI
```

리텔링(챕터를 제 말로 옮겨 적기)은 걷어냈다. 대신 문장 화면 아래에 **내 생각**을
스레드처럼 한 줄씩 단다(`widgets/sentence-thoughts`) — 쓰는 부담이 한 줄이면
족하고, 무엇에 대한 생각인지(그 문장) 늘 위에 붙어 있다. 퀴즈는 MVP에서 뺐다 —
만들다 만 게 아니라 이번 출시엔 안 낸다는 결정이다.

## 서랍은 문장의 목록이다 (ADR-0004)

**문장이 주인이고 표현은 그 안의 밑줄이다.** 어휘 항목이 사라진 것이 아니라
입구가 바뀌었다.

- **목록은 훑어보는 자리다.** 줄에는 문장과 밑줄, 표지, 'N번 만남'만 서고
  한국어도 상태 라벨도 없다. 누르면 문장 화면(`app/sentence/[id]`)으로 간다.
- **갈래는 셋이고 '전체'는 없다.** 마음에 들었던 문장(묻지 않고 담은 문장 + 하트)·
  담은 표현(표현을 하나라도 담음)·다시 만난 표현(두 번 넘게 만난 밑줄이 있음). 카드가
  상태를 말하지 않는 대신 갈래 이름이 말한다. 모양은 책 화면의 갈래와 같은 `SectionSwitch`다.
  **'마음에 들었던 문장'은 서버의 `liked=true`와 같은 규칙이어야 한다** — 책 화면은
  서버가, 서랍은 `DRAWER_MATCH`가 가르는데, 한때 서랍만 '밑줄 없음'으로 갈라서
  물어놓고 표현을 안 고른 문장이 서랍에선 마음에 든 문장, 책에선 아무 데도 없었다.
- **할 일이 남은 문장은 목록에 세우지 않는다.** 둘이다 — 답을 기다리는 문장
  (`app/pending`)과, 답은 왔는데 표현을 하나도 안 고른 문장(`app/unpicked`). 서랍 위
  한 줄씩이 알리고, 누르면 목록이 열린다. 목록에서 문장을 누르면 문장 화면으로 들어가
  표현을 고르고(기다리는 문장은 다시 물어서 답이 오면), 필요 없는 문장은 휴지통으로
  지운다. 표현을 하나라도 담으면 '담은 표현'으로 간다. 가르는 일은 `useSentenceFeed`
  한 곳이 한다 — 머리의 "문장 N개"도 목록에 선 것만 센다.
- **문장 화면이 뜻·표현·재회를 보인다.** 뜻은 거기서도 눌러야 열린다. 담은 표현마다
  다른 책에서도 만났는지가 서고(몇 번인지는 표현 화면이 말한다), 누르면 그 표현이 만난 모든
  문장(`widgets/item-detail`)이 열린다. 물을 때 짚어준 후보 중 담지 않은 것도
  거기서 담을 수 있다 — 이미 서랍에 있는 표현이면 담는 순간이 재회다.
- 문장 화면은 목록 캐시에 기대지 않는다. `GET /sentences/:id`와
  `GET /asks?sentenceId=`로 스스로 불러오고, 한 줄로 합치는 규칙은 목록과 같은
  `buildFeed`를 쓴다.

- 목록의 원천은 둘인데 겹치지 않는다: `GET /asks?limit=200`(물어본 문장, 번역과
  책이 붙어서 온다)와 `GET /sentences?liked=true`(그냥 담아둔 문장, **책이 안
  붙어 와서** `/books`로 따로 맞춘다). 합치는 규칙은 `entities/sentence/lib/feed.ts`.
- 밑줄은 담은 항목에서만 온다(`item.encounters[].surface`). 물어볼 때 나온 후보
  가운데 담지 않은 것은 내 것이 아니라 밑줄로 그리지 않는다(문장 화면에서 따로 보인다).
- `surface`는 모델이 물어볼 때만 준다. 사전이 없어서(ADR-0002) 나중에 되살릴
  방법이 없고, 그래서 **물어본 적 없는 문장에는 밑줄이 없다.**

## 촬영: 짚고, 고르면 그 문장이 사는 곳으로 간다

찍은 쪽 위에서 문장을 짚으면 시트가 올라와 **물을지, 그냥 마음에 든 문장인지**만
고른다(`widgets/capture`). 고르는 순간 그 문장이 사는 곳으로 간다.

- 물어서 답이 왔으면 → 문장 화면(`app/sentence/[id]`), 뜻을 편 채로
- 답을 못 받았으면(질문 소진·연결 실패) → 기다리는 문장(`app/pending`)
- 그냥 담았으면 → 그 책의 '마음에 들었던 문장' 갈래(`app/book/[id]?tab=liked`)

손으로 적어 묻는 질문 모달(`app/ask`)도 같은 길로 간다. 한동안 답을 시트 안에서
받고 담은 뒤 사진으로 돌아와 다음 문장을 짚게 했는데, 방금 담은 것이 어디 갔는지
보이지 않았다.

- 인식기가 좌표를 주면 사진 위에 얹는다. 좌표가 없으면 사진으로 고르지 못한다.
  갈아끼울 자리는 `shared/ocr/text-extractor.ts`의 `readLines` 하나다.
- 좌표는 앱 안의 로컬 모듈 `modules/page-reader`(Apple Vision)가 준다. 글자만 넘기고
  좌표를 버리는 `expo-text-extractor`는 걷어냈다 — 좌표 없이는 짚을 수 없어서
  물러날 자리로도 쓸모가 없었다.
- 좌표는 **화면에 보이는 방향(EXIF 적용 후)의 픽셀**이다. 카메라가 알려주는
  크기는 방향 적용 전일 수 있어서, 사진을 놓을 때는 인식기가 함께 준
  `width`/`height`를 쓴다.
- **서버에 줄을 보내 문장으로 잇는 길(`/asks/split`)은 걷어냈다.** 짚는 사람이 어디서
  막혔는지 알고 있고, 문장 경계는 `shared/ocr/selection.ts`가 마침표로 넓힌다.
- **이 앱은 iOS만 낸다.** 안드로이드 설정·코드는 걷어냈다(`app.json`의 android, AdMob
  안드로이드 ID, 알림 채널, `expo-text-extractor`). 안드로이드를 내는 날에는 OCR이
  제일 큰 일이다 — `modules/page-reader`와 같은 모양으로 ML Kit(`TextRecognition`의
  `Text.TextBlock.lines[].elements[].boundingBox`) 쪽을 채워야 사진으로 짚는다.

## 지켜야 할 것

- **예외는 소셜 로그인 버튼 하나다.** 카카오 노랑·네이버 초록·구글 네 색·Apple
  검정은 우리가 고르는 색이 아니라 각 회사 가이드가 정한 값이라
  `shared/ui/brand-logo.tsx`에만 따로 둔다. 종이색에 맞춘다고 바꾸지 않는다.
- **색과 타이포는 `shared/config`에서만 온다.** 여기가 원본이다 — 웹
  (`apps/web/src/app/globals.css`)과 맞추려 들지 않는다. 두 앱을 잇는 코드가
  없어서(교차 import 0) 맞춰둬도 어긋난 것을 알려주는 것이 없고, 실제로 이미
  어긋나 있었다. 화면에서 새 색을 만들지 않는 규칙은 그대로다.
- **세리프는 책에서 온 영어에만.** 원문·표현·인용은 `<Quote>`, 앱이 하는 말은
  전부 `<AppText>`. 화면에서 react-native의 `<Text>`를 직접 쓰지 않는 이유다.
- **출처는 책 표지로 보인다.** 목록 카드는 왼쪽에 `CoverThumb`(36×52)을 세운다 —
  카드마다 크기가 같아야 목록을 넘길 때 표지 줄이 흔들리지 않는다. 표지가 없는
  책(직접 적은 책, 표지 없는 검색 결과)은 `BookCover`가 `spine`(그라디언트 두 색)으로
  채운다. 예전의 4px 책등 색 띠는 표지가 들어오기 전의 대안이라 걷어냈다 — 색으로는
  어느 책인지 기억해야 알 수 있고, 표지는 보면 안다.
- **아이콘은 디자인에서 가져온다.** `shared/ui/icon.tsx`가 디자인 문서의
  `icons/*.svg`를 그대로 옮겨둔 것이다. 없는 아이콘은 디자인에서 먼저 그린다.
- **라이트 한 벌뿐이다.** 모든 화면이 **종이색** 바탕 위 먹·잉크블루의 대비를
  쓴다. 흰 바탕이 아니다 — 읽는 동안 곁에 두는 앱이라 순백은 차가웠다.
- **정보를 지닌 글은 4.5:1을 넘는다.** `text.assistive`는 아이콘·자리표시자·
  스피너 전용이고 혼자 뜻을 지니면 안 된다. 한때 오류 문구가 여기 얹혀 있어서
  1.83:1이었다.
- **화면 좌우 여백은 `gutter` 하나다.** 숫자를 직접 적지 않는다 — 한때 헤더는
  24, 본문은 화면마다 20이나 24였고, 뒤로가기 화살표가 그 아래 글보다 4px 밖에
  서 있었다. 화면 끝까지 흘러야 하는 줄(`reading-shelf`)은 `-gutter`로 걷어내고
  제 여백을 다시 준다.
- **못 누르는 버튼은 `disabled`로 말한다.** `variant`를 subtle로 바꿔 말하지
  않는다 — 그러면 '아직 안 됨'이 '누를 수 있는 다른 선택'처럼 보인다. 도는
  중이면 `loading`을 쓴다. 글자만 '저장하는 중…'으로 바꿔두면 두 번 눌린다.
  누르면 아무 일도 없는 자리는 버튼으로 그리지 않는다(광고 자리가 그랬다 — 지금은 붙었다).

## 개발 빌드 (네이티브 모듈이 필요한 것 전부)

Apple 로그인·OCR·광고는 네이티브 모듈이라 **Expo Go에서는 영영 안 돈다** — 광고 SDK를 맨 위에서
import해서 앱이 켜지는 순간 죽는다. Expo Go는 쓰지 않고 `npx expo run:ios`로 만든 개발 빌드를
쓴다. (카카오·네이버·구글 로그인 자체는 브라우저 방식이라 네이티브 모듈이 아니다.) 그 길에서
걸린 것 셋:

- **Xcode 26 이상이어야 한다.** Expo 57의 `expo-modules-jsi`와
  `@expo/expo-modules-macros-plugin`이 `swift-tools-version: 6.2`를 요구한다.
  Xcode 16.4(Swift 6.1)에서는 `package 'apple' is using Swift tools version
6.2.0`으로 패키지 해석 단계에서 죽는다.
- **Xcode 27로 지으면 scene 생명주기를 켜야 한다.** iOS 27 SDK로 지은 앱은
  UIKit scene 생명주기가 없으면 뜨지 않는다. `expo@57.0.23+`와
  `expo-build-properties`의 `ios.enableSceneSupport`가 그 스위치고, 바꾼 뒤에는
  `npx expo prebuild --clean`을 다시 돌려야 한다.
- **`patches/expo-modules-jsi.patch`는 지우면 안 된다.** 이 저장소가
  `~/Desktop` 아래 있고 iCloud가 데스크톱을 동기화하는데, iCloud의 file
  provider가 `.framework` 디렉터리에 번들 비트(`com.apple.FinderInfo`)를
  붙인다. codesign은 FinderInfo가 붙은 것을 서명하지 못해
  (`resource fork, Finder information, or similar detritus not allowed`)
  ExpoModulesJSI xcframework를 짓는 단계에서 빌드가 죽는다. 미리 `xattr -c`로
  지워도 빌드 도중에 다시 붙는다. 패치는 그 중간 프레임워크의 서명을 끄는
  것뿐이고(`CODE_SIGNING_ALLOWED=NO`), 앱 자체 서명에는 손대지 않는다 —
  임베드된 프레임워크는 어차피 앱을 서명할 때 다시 서명된다.
  저장소를 iCloud 밖으로 옮기면 패치는 필요 없어진다.

## Apple 로그인은 스위치로 켠다

`EXPO_PUBLIC_APPLE_SIGN_IN=true`일 때만 Apple 로그인 권한
(`com.apple.developer.applesignin`)이 들어간다. 이 권한은 **유료 개발자 계정**에서만
켤 수 있어서, 무료 개인 팀으로 지으면서 켜면 프로비저닝에서 빌드가 멈춘다. 꺼져
있으면 버튼은 흐리게 남는다.

`app.config.js`에서 플러그인을 빼는 것만으로는 꺼지지 않는다 — Expo가 설치된
`expo-apple-authentication`의 플러그인을 알아서 붙여 권한을 넣기 때문이다. 그래서
끌 때는 같은 이름의 빈 플러그인을 먼저 걸어 그 자동 적용을 건너뛰게 한다. 권한이
실제로 빠졌는지는 `npx expo config --type introspect`로 확인한다.

앱스토어에 낼 때는 켜야 한다 — 다른 소셜 로그인을 내면 Apple 로그인도 함께 내야
한다(심사 지침 4.8).

## 광고 (AdMob)

두 군데에만 선다 — **사진으로 묻는 버튼을 누른 순간**(전면, 촬영이 열리기 전에 한 번)과
**이번 달 질문을 다 쓴 뒤 기다리는 문장 화면**(보상형, 끝까지 보면 질문 3번). 직접 적어
묻는 길과 읽는 중에는 없다(ADR-0003). 촬영 화면을 여는 길은 `useOpenScan` 하나다.

- `shared/ads/ads.ts`가 SDK를 맨 위에서 import한다. 네이티브 모듈이라 **Expo Go에서는 앱이
  켜지는 순간 죽는다** — Expo Go는 쓰지 않는다(개발 빌드나 출시 빌드만). 광고가 안 떠도
  (못 불러옴·시간 초과·출시 ID 없음) 촬영은 열린다.
- 개발 중에는 구글 시험용 광고 단위를 쓴다(`__DEV__`) — 내 광고 단위로 개발하다 내 기기를
  누르면 계정이 정지될 수 있다. 출시 빌드는 `EXPO_PUBLIC_ADMOB_*` 환경 변수를 쓰고,
  `app.config.js`가 비어 있으면 **빌드 전에** 막는다.
- 맞춤 광고는 요청하지 않는다(`requestNonPersonalizedAdsOnly`) — 그래서 추적 허용(ATT) 창이
  없다. 맞춤 광고로 바꾸면 ATT 문구와 동의 창(UMP)이 필요하다.
- 보상은 앱이 "봤다"고 알리는 것을 서버가 믿는다(`POST /asks/quota/ad-bonus`). 하루 상한이
  손해를 막는다. 광고 네트워크의 서버 확인(SSV)은 아직 안 붙였다.
- 네이티브 모듈이라 이 기능을 넣은 뒤에는 개발 빌드를 다시 지어야 한다
  (`npx expo prebuild --clean` → `npx expo run:ios`).
- **AdMob 콘솔에서 해야 할 일(출시 전):** 계정 → 앱 등록(App ID) → 전면·보상형 광고 단위
  만들기 → ID를 `eas.json`의 production env에 넣는다(`EXPO_PUBLIC_ADMOB_IOS_APP_ID`,
  `EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID`, `EXPO_PUBLIC_ADMOB_REWARDED_ID`). 개인정보처리방침에
  광고 SDK가 쓰는 정보를 적고, App Store Connect의 개인정보 항목에도 맞춰 답한다.

## 첫 실행 안내

처음 온 독자에게 세 걸음(찍어서 짚기 · 문장째로 묻기 · 다시 만나면 이어주기)을 한 번 보여준다
(`widgets/onboarding`, 화면은 `app/onboarding.tsx`). 그림은 스크린샷이 아니라 **앱이 쓰는 조각
그대로**(`Quote`·`Card`·`Chip`) 조립한 것이라 색·서체가 바뀌면 안내도 같이 바뀐다.

- **책이 한 권도 없고 아직 안 본 독자에게만** 뜬다(`OnboardingRedirect`, 로그인한 뒤). 이미
  책을 담아 쓰는 독자는 이 앱을 아는 사람이라 업데이트했다고 내밀면 방해가 된다.
- **봤는지는 독자마다 적는다**(SecureStore `onboarding.seen.<독자 id>`). 기기에 하나만 적으면
  같은 기기의 새 가입자와, 계정을 지우고 다시 만든 사람이 안내를 못 본다. 건너뛴 것도 본 것으로
  적는다. 읽지 못하면 봤다고 친다 — 안내가 길을 막으면 안 된다.
- 밀어서 닫을 수 없다(`gestureEnabled: false`) — 그러면 '봤다'가 안 적힌다. 마이 탭의 '사용
  방법'에서 언제든 다시 연다.
- 한글 본문에는 `lineBreakStrategyIOS="hangul-word"`를 단다. 기본값은 '담겨/요'처럼 낱말
  가운데서 줄을 바꾼다. (`item-detail`의 재회 줄에도 같은 끊김이 있다 — 아직 안 고쳤다.)
- 개발 빌드의 톱니 버튼이 오른쪽 위 '건너뛰기'를 가린다. 출시 빌드에는 없다.

## 복습 알림은 기기 안에서 예약하는 로컬 알림이다

서버가 보내는 푸시가 **아니다.** 기기가 스스로 때를 보고 울려서 APNs 권한도, 푸시 토큰도,
서버가 독자의 기기를 알 일도 없다 — 그래서 독자가 어떤 시각을 골라도(분 단위, 앱이 직접 그린 시간 휠
`widgets/review-reminder/ui/time-wheel.tsx` — iOS 기본 선택기는 종이색 위에서 혼자 다른 앱처럼 보여서 안 쓴다) 서버 비용이나 부하가 생기지 않는다. 마이 탭에서 켜면(그 순간에
처음 알림 허락을 묻는다) 하루에 한 번, 아직 **헷갈려요**인 표현 하나를 알려준다 — 고르는 순서는 홈의 '오늘 다시 볼
문장'과 같다(`widgets/review-reminder/lib/plan.ts`).

- **이레치를 미리 예약하고 앱을 열 때마다 다시 짠다**(`useReminderSync`, 탭 레이아웃).
  반복 알림은 글이 고정이라 오늘의 표현을 말해줄 수 없어서다. 이레 넘게 앱을 안 열면
  알림도 끊기는데, 쉬는 독자에게 계속 말을 거는 것이 이 앱이 원하는 일은 아니다.
- **`app.config.js`가 `expo-notifications` 플러그인의 자동 적용을 일부러 막는다.** 그
  플러그인은 설치돼 있기만 하면 `aps-environment` 권한을 넣는데, 유료 개발자 계정이
  있어야 프로비저닝돼서 무료 팀 빌드가 Apple 로그인처럼 멈춘다. 로컬 알림에는 그 권한이
  필요 없다. **서버 푸시를 붙이는 날 그 줄을 지운다.**
- 알림을 누르면 그 표현 화면(`/item/[id]`)으로 간다(루트 레이아웃). 로그아웃·계정 삭제는
  예약과 설정을 함께 지운다(`clearReminder`) — 남의 계정으로 알림이 울리면 안 된다.
- 네이티브 모듈이라 이 기능을 넣은 뒤에는 개발 빌드를 다시 지어야 한다
  (`npx expo prebuild --clean` → `npx expo run:ios`).

## 계정 삭제

마이 탭 맨 아래의 조용한 줄이다(심사 지침 5.1.1(v)가 요구한다). 서버가 `DELETE /readers/me`로
독자의 모든 것을 지우고(`apps/backend/src/readers/account-deletion.service.ts`), 앱은 그
뒤 `signOut`과 같은 길로 기기의 토큰·캐시·알림 예약을 지운다. 서버에 이미 없는 계정이라
`/auth/logout` 호출은 실패해도 기기에서는 지워진다.

Apple로 로그인한 독자의 Apple 쪽 토큰 회수는 코드는 붙었고 Apple과 통신해 본 적은 없다(`apps/backend/AGENTS.md`).

## 릴리스 빌드

`eas.json`에 프로필이 셋 있다 — `development`(개발 클라이언트), `development-simulator`,
`production`(TestFlight·앱스토어). **`.env`는 gitignore라 EAS 클라우드 빌드가 받지 못한다.**
그래서 서버 주소 같은 공개 값은 `eas.json`의 production `env`에 있다. 이 값들이 빠진 채
출시 빌드를 지으면 앱이 오류 없이 조용히 망가지므로(서버에 못 붙거나, Apple 로그인이 빠짐)
`app.config.js`가
`EAS_BUILD_PROFILE=production`일 때 **빌드를 시작하기 전에 막는다.**

처음 한 번:

```bash
cd apps/mobile
npx eas-cli login
npx eas-cli init                      # app.json에 projectId·owner를 적는다 — 이 변경은 커밋한다
```

짓기와 올리기:

```bash
npx eas-cli build --platform ios --profile production   # 처음엔 Apple 로그인으로 인증서·프로비저닝을 만든다
npx eas-cli submit --platform ios --profile production  # App Store Connect에 앱(번들 id)을 먼저 만들어 둔다
```

빌드 전에 확인할 것: 유료 개발자 계정 · 서버의 `ALLOW_DEV_LOGIN`이 꺼져 있고 `NODE_ENV=production`
· `PUBLIC_BASE_URL`이 실제 주소 · 세 소셜 콘솔의 redirect URI.

**개인정보 처리방침은 노션에 올려 두었고**(`shared/config/legal.ts`의 `PRIVACY_POLICY_URL`) 마이 탭에서
링크로 연다. 공유 설정이 '웹에 게시'에서 풀리면 심사관이 못 열어서 반려된다. 이용약관은 아직 없다.
앱스토어 제출 때 같은 URL을 App Store Connect의 개인정보 정책 URL에 넣는다.

로컬에서 Release로 컴파일만 확인하려면 `npx expo run:ios --configuration Release`다.
`ITSAppUsesNonExemptEncryption=false`는 앱이 표준 HTTPS와 OS 암호화만 쓴다는 선언이다 —
수출 규정 질문을 매번 받지 않게 `app.json`에 넣어 뒀다. 암호화를 직접 구현하게 되면 다시 본다.

## 현재 상태

목업이 하나도 없다 — 로그인부터 읽기 기록까지 모든 화면이 백엔드에서 온 것을
그린다. 카카오·네이버·구글 로그인은 **옛 네이티브 SDK 방식으로** 실기기에서
실제 제공자와 끝까지 도는 것을 확인한 적이 있다. 브라우저 동의 화면 + 서버
콜백으로 바꾼 지금 방식은 아직 실기기에서 확인하지 않았다. 자세한 것과 아직
검증 안 된 것은 루트 `CLAUDE.md`를 본다 — 두 곳에 같은 걸 적어두면 한쪽이
먼저 낡는다.
