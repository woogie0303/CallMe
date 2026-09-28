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
app/          리텔링 · 질문 · 촬영 같은, 탭 밖에서 열리는 화면들
widgets/      화면 한 덩어리
entities/     책 · 표현 · 문장 · 리텔링 — 도메인별 api(서버 훅) / model / ui
shared/       토큰 · 타입 램프 · 아이콘 · API 클라이언트 · 조각 UI
```

리텔링은 탭이 아니다. 옮겨 적는 일에는 늘 책과 챕터가 딸려 있어서 책 화면
안에서 연다. 퀴즈는 MVP에서 뺐다 — 만들다 만 게 아니라 이번 출시엔 안 낸다는
결정이다.

## 서랍은 문장의 목록이다 (ADR-0004)

**문장이 주인이고 표현은 그 안의 밑줄이다.** 어휘 항목이 사라진 것이 아니라
입구가 바뀌었다 — 밑줄을 누르면 그 표현이 만난 모든 문장(`widgets/item-detail`)이
열리고, 재회가 보이는 자리는 예전처럼 거기다.

- 목록의 원천은 둘인데 겹치지 않는다: `GET /asks?limit=200`(물어본 문장, 번역과
  책이 붙어서 온다)와 `GET /sentences?liked=true`(그냥 담아둔 문장, **책이 안
  붙어 와서** `/books`로 따로 맞춘다). 합치는 규칙은 `entities/sentence/lib/feed.ts`.
- 밑줄은 담은 항목에서만 온다(`item.encounters[].surface`). 물어볼 때 나온 후보
  가운데 담지 않은 것은 내 것이 아니라 그리지 않는다.
- `surface`는 모델이 물어볼 때만 준다. 사전이 없어서(ADR-0002) 나중에 되살릴
  방법이 없고, 그래서 **물어본 적 없는 문장에는 밑줄이 없다.**

## 촬영은 한 화면에서 끝난다

찍은 쪽 위에서 문장을 짚으면 시트가 올라온다(`widgets/capture`). 화면을 옮기지
않기 때문에 **한 쪽에서 문장을 여러 개 연달아** 물을 수 있다 — 예전에는 질문
화면으로 `replace`해서 사진이 사라졌고, 한 장에 문장 하나가 끝이었다.

- 인식기가 좌표를 주면 사진 위에 얹고, 아니면 읽어낸 글을 조판해 보여준다.
  갈아끼울 자리는 `shared/ocr/text-extractor.ts`의 `readLines` 하나다.
- 서버는 줄을 이어 문장으로 돌려주지만 **어느 줄이 어느 문장이 됐는지는 알려주지
  않는다.** 사진 위에 얹으려면 `shared/ocr/align.ts`가 그 사이를 잇는다.

## 지켜야 할 것

- **색과 타이포는 `shared/config`에서만 온다.** 여기가 원본이다 — 웹
  (`apps/web/src/app/globals.css`)과 맞추려 들지 않는다. 두 앱을 잇는 코드가
  없어서(교차 import 0) 맞춰둬도 어긋난 것을 알려주는 것이 없고, 실제로 이미
  어긋나 있었다. 화면에서 새 색을 만들지 않는 규칙은 그대로다.
- **세리프는 책에서 온 영어에만.** 원문·표현·인용은 `<Quote>`, 앱이 하는 말은
  전부 `<AppText>`. 화면에서 react-native의 `<Text>`를 직접 쓰지 않는 이유다.
- **책등 색이 출처를 대신한다.** `entities/book`의 `spine`은 그라디언트 두 색이고,
  `BookCover` / `BookSpine`이 그걸 물려받는다. 새 카드를 만들 때도 이 규칙을 지킨다.
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
  누르면 아무 일도 없는 자리는 버튼으로 그리지 않는다(광고 자리가 그랬다).

## 개발 빌드 (네이티브 모듈이 필요한 것 전부)

소셜 로그인 SDK 셋과 OCR은 네이티브 모듈이라 **Expo Go에서는 영영 안 돈다.**
`npx expo run:ios`로 개발 빌드를 만들어야 한다. 그 길에서 걸린 것 셋:

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

## 아직 안 된 것

**사진 위에서 문장 짚기는 인식기를 갈아끼워야 돈다.** 지금의
`expo-text-extractor`는 글자만 주고 좌표를 주지 않아서(`string[]`), 화면은
읽어낸 글을 조판하는 쪽으로 물러나 있다. 좌표를 주는 인식기
(`@react-native-ml-kit/text-recognition`의 `blocks[].lines[].frame`)로 바꾸면
`readLines`가 `located: true`로 돌려주고 오버레이가 저절로 올라온다.

바꾸기 전에 확인할 것: 그 패키지는 RN 0.60~1.0을 peer로 걸고 있지만 마지막
배포가 2025-09고, 이 앱은 RN 0.86(신아키텍처 기본 켜짐)이다. **신아키텍처에서
도는지 실기기에서 확인하고 넣어야 한다.**

## 현재 상태

목업이 하나도 없다 — 로그인부터 리텔링까지 모든 화면이 백엔드에서 온 것을
그린다. 자세한 것과 아직 검증 안 된 것(소셜 로그인·모델 호출·실기기)은 루트
`CLAUDE.md`를 본다 — 두 곳에 같은 걸 적어두면 한쪽이 먼저 낡는다.
