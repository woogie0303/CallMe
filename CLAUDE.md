CallMe — 코드베이스 안내. 제품 이름은 **Reread**다.

원서를 읽다 모르는 표현을 만나면 메모하거나 페이지를 찍어 담아두고, 나중에
리텔링과 빈칸 퀴즈로 다시 꺼내 본다. **내가 예전에 뭘 헷갈려 했는지 기억하고
다시 이어주는 것**이 제품이다 — 단어장이 아니다.

## 구조

`apps/web`(Next.js 16, App Router), `apps/backend`(NestJS 11), `apps/mobile`(Expo 57).
pnpm 워크스페이스 + Turborepo.

웹은 FSD를 따른다 — `app / widgets / entities / shared`, 각 슬라이스는
`ui / model / lib` 세그먼트로 나뉜다. 의존 방향은 언제나 아래로만 흐른다.

## 디자인 규칙

화면은 claude.ai/design 프로젝트 `055dea1a-400b-4b8a-854e-f4ced05a8c70`의
`Reread 앱.dc.html`(모바일 6개 화면)에서 왔다. 다음 세 가지는 화면을 건드리기 전에
알고 있어야 한다.

- **색과 타이포는 새로 만들지 않는다.** Wanted Design System 토큰을
  `apps/web/src/app/globals.css`에 그대로 옮겨뒀다. 인라인 `style` 대신
  `bg-(--surface-ink)` 같은 CSS 변수 유틸리티를 쓴다. 타입 램프는 `.wds-*` 클래스다.
- **세리프는 책에서 온 영어에만 쓴다.** 원문 문장·표현·인용은 `.quote`(Iowan Old
  Style), 앱이 하는 말은 전부 Pretendard. 이 구분이 무너지면 화면이 평범해진다.
- **웹의 몫은 대조(對照)다.** 모바일이 위아래로 쌓을 수밖에 없던 두 가지를 —
  내가 말한 문장과 고친 문장, 지금 표현과 예전에 헷갈린 표현 — 폭이 있는 화면에서는
  가운데 헤어라인을 두고 나란히 놓는다. 지금 보는 쪽만 파랗다.
  (`widgets/expression-drawer/ui/expression-contrast.tsx`가 원형이다.)

책마다 그라디언트 **책등 색**이 있다(`entities/book/model/mock.ts`의 `spine`).
문장·표현 카드 왼쪽 4px 엣지가 그 색을 물려받아, 라벨 없이도 출처를 알려준다.
새 카드를 만들 때도 이 규칙을 지킨다.

## 현재 상태

모바일은 API에 완전히 붙어 있다 — 목업 파일이 하나도 없다. 로그인부터 리텔링까지
모든 화면이 서버에서 온 것을 그린다. 웹은 아직 목업이다
(`apps/web/src/entities/*/model/mock.ts`).

백엔드는 몽고(Mongoose)와 소셜 로그인, 책·문장·어휘 항목 CRUD, 문장을 통째로 묻는
질문, 퀴즈, 리텔링, 읽기 기록까지 있다(`apps/backend/AGENTS.md`). 로그인은
카카오·네이버·구글 셋뿐이고 비밀번호는 맡지 않는다.

아직 검증되지 않은 것이 셋이다. 소셜 로그인은 실제 제공자와, 질문·리텔링은 실제
모델과 한 번도 통신해 본 적이 없다(둘 다 자격 증명이 있어야 한다). 그리고 앱은
실기기에서 돌려본 적이 없다 — 타입체크와 export까지만 확인돼 있다.

그동안은 `POST /api/dev/login`으로 들어간다. 소셜 로그인이 도는 것을 확인하면
그 문과 `ALLOW_DEV_LOGIN`을 함께 지운다.

읽던 쪽을 찍으면 기기가 글자를 읽고(Apple Vision / ML Kit) 서버가 그 줄들을
문장으로 잇는다. 사진은 기기 밖으로 나가지 않는다. 네이티브 모듈이라 이 흐름은
개발 빌드(EAS)에서만 돈다 — Expo Go에서는 촬영 화면이 '직접 적기'로 물러난다.

책 추가는 구글 북스 API로 검색한다(원서를 검색하는 앱이라 국내 서점 API보다
적중률이 높다). 검색이 나중에 알라딘 Open API로 바뀌어도 화면은 모른다 —
`apps/backend/src/books/book-search.service.ts` 하나만 갈아 끼우면 된다.
