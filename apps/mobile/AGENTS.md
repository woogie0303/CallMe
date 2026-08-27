# Reread — 모바일

Expo SDK 57 / expo-router. 화면 여섯 개는 claude.ai/design 프로젝트
`055dea1a-400b-4b8a-854e-f4ced05a8c70`의 `Reread.dc.html`에서 왔다.

> Expo는 자주 바뀐다. 코드를 쓰기 전에
> https://docs.expo.dev/versions/v57.0.0/ 의 해당 버전 문서를 확인한다.

## 구조

웹(`apps/web`)과 같은 FSD를 따른다 — `app / widgets / entities / shared`.
의존 방향은 언제나 아래로만 흐른다. `src/app` 아래 파일은 전부 라우트가 되므로
화면이 아닌 코드는 절대 여기 두지 않는다.

```
app/(tabs)/   홈 · 리텔링 · 퀴즈 · 마이   (탭 바는 widgets/app-tab-bar가 직접 그린다)
app/book-confirm · memo · capture         홈에서 열리는 흐름
widgets/      화면 한 덩어리
entities/     책 · 표현 · 문장 · 메모 · 퀴즈 · 리텔링 (전부 목업)
shared/       토큰 · 타입 램프 · 아이콘 · 조각 UI
```

## 지켜야 할 것

- **색과 타이포는 `shared/config`에서만 온다.** 값은 웹의
  `apps/web/src/app/globals.css`와 한 벌이다 — Wanted Design System 토큰을
  그대로 옮긴 것이고, 화면에서 새 색을 만들지 않는다.
- **세리프는 책에서 온 영어에만.** 원문·표현·인용은 `<Quote>`, 앱이 하는 말은
  전부 `<AppText>`. 화면에서 react-native의 `<Text>`를 직접 쓰지 않는 이유다.
- **책등 색이 출처를 대신한다.** `entities/book`의 `spine`은 그라디언트 두 색이고,
  `BookCover` / `BookSpine`이 그걸 물려받는다. 새 카드를 만들 때도 이 규칙을 지킨다.
- **아이콘은 디자인에서 가져온다.** `shared/ui/icon.tsx`가 디자인 문서의
  `icons/*.svg`를 그대로 옮겨둔 것이다. 없는 아이콘은 디자인에서 먼저 그린다.
- **라이트 한 벌뿐이다.** 여섯 화면 모두 흰 바탕 위 잉크·파랑의 대비를 쓴다.

## 현재 상태

프로토타입 UI만 있다. DB·인증·AI·녹음·카메라 연동은 없고 데이터는 전부
`entities/*/model/mock.ts`다. `마이` 탭은 디자인에 화면이 아직 없어
목업 세 줄만 놓아뒀다.
