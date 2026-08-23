# CallMe

Turborepo + pnpm 모노레포. 제품 이름은 **Reread** — 원서를 읽다 걸린 표현을 모으고,
리텔링과 퀴즈로 다시 꺼내 보는 서비스다.

```
apps/
  web       Next.js 16 (App Router) — 복습하는 화면. 지금 작업 중.
  backend   NestJS 11 — API. 초기 설정과 /api/health 만 있다.
  mobile    Expo SDK 57 + expo-router — 초기 설정만. 화면은 아직 없다.
```

## 시작하기

```bash
pnpm install
pnpm dev            # 셋 다 띄운다
pnpm dev:web        # http://localhost:3000
pnpm dev:backend    # http://localhost:4000/api/health
pnpm dev:mobile     # expo start
```

Node 20.11 이상, pnpm 9.15.0(`packageManager`에 고정돼 있다).

`.npmrc`의 `node-linker=hoisted`는 지울 수 없다 — React Native의 Metro가
pnpm의 심볼릭 링크 구조를 해석하지 못한다.

## 웹은 어디서 왔나

화면은 claude.ai/design의 `Reread 앱` 프로젝트에서 가져왔다. 모바일 6개 화면이
1차 출처이고, 웹은 그 팔레트·타이포·부품을 그대로 쓰되 레이아웃만 데스크톱에
맞게 다시 짰다. 자세한 규칙은 [CLAUDE.md](CLAUDE.md)에 있다.

## 상태

DB·인증·크롤러·AI 연동은 아직 없다. 웹의 곡·표현 데이터는 전부 목업이다
(`apps/web/src/entities/*/model/mock.ts`).
