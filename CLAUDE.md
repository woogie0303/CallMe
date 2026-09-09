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

웹과 모바일은 화면이 다 있고 데이터는 전부 목업이다
(`apps/*/src/entities/*/model/mock.ts`). 아직 API를 부르지 않는다.

백엔드는 몽고(Mongoose)와 소셜 로그인, 책·문장·어휘 항목 CRUD, 그리고 문장을
통째로 묻는 질문까지 있다(`apps/backend/AGENTS.md`). 로그인은 카카오·네이버·구글
셋뿐이고 비밀번호는 맡지 않는다. 퀴즈와 리텔링은 아직 없다.

소셜 로그인은 실제 제공자와 한 번도 통신해 본 적이 없고, 질문도 실제 모델을
불러본 적이 없다 — 둘 다 자격 증명이 있어야 검증된다.
