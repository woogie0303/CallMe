# Reread — 백엔드

NestJS 11 / MongoDB(Mongoose). 도메인 낱말은 루트 `CONTEXT.md`가 정한 것을 그대로
쓴다 — Reader·Book·Sentence·Lexical Item·Encounter·Re-encounter. 코드에서 Word나
단어장 같은 말을 새로 만들지 않는다.

## 띄우기

```bash
docker compose up -d          # 로컬 몽고 하나 (27017)
cp .env.example .env          # 값을 채운다
pnpm --filter backend dev     # http://localhost:4000/api
```

몽고가 없으면 `mongod --dbpath <경로>`로 띄워도 된다. 스키마 마이그레이션은
없다 — 인덱스는 Mongoose가 부팅할 때 만든다.

## 구조

```
src/
  common/     가드 · 현재 독자 데코레이터 · ObjectId 파이프
  auth/       소셜 로그인 · 토큰 두 장   (oauth/ 안에 제공자 셋)
  readers/    독자와 레벨
  books/      내 책과 진도
  sentences/  책에서 옮겨 적은 줄
  items/      어휘 항목과 만남 — 재회가 일어나는 곳
  asks/       문장을 통째로 묻는 일 (anthropic/ 안에 모델 호출 하나)
  retells/    챕터를 제 말로 옮겨 적은 것과 고쳐준 문장
  reading/    하루에 몇 쪽 읽었는지 — 진도가 앞으로 갈 때 저절로 쌓인다
```

## 지켜야 할 것

- **소유는 언제나 readerId로 거른다.** 가드는 '누구인가'만 확인하고, '무엇을 볼
  수 있는가'는 서비스가 `{ _id, readerId }`로 함께 찾아서 답한다. 남의 문서는
  403이 아니라 404다 — 있다는 사실 자체를 알려줄 이유가 없다.
- **재회는 유일 인덱스가 만든다.** `lexical_items`의 `(readerId, term)`이 유일하고,
  같은 표현을 또 담으면 문서를 만드는 대신 `encounters`에 문장을 하나 더 붙인다.
  이 규칙을 우회하는 저장 경로를 만들지 않는다.
- **문장에 '좋아서 담았음'을 적지 않는다.** 어휘 항목이 딸렸는지는 만남 쪽에
  물어본다(`GET /sentences?liked=true`). 같은 사실을 두 군데 적으면 어긋난다.
- **로그인은 카카오·네이버·구글 셋뿐이다.** 비밀번호를 맡지 않는다. 이메일이
  같다고 다른 제공자 계정을 자동으로 합치지 않는다 — 남의 계정을 넘겨받는 길이 된다.
- **리프레시 토큰은 해시로만 저장하고 쓰면 회전시킨다.** 폐기된 토큰이 다시 오면
  그 독자의 세션을 전부 끊는다.
- **묻는 단위는 언제나 문장 하나다**(ADR-0001). 낱말이나 표제형을 받는 길을 만들지
  않는다 — 문장이 없으면 그 문장에서의 뜻을 고를 수 없다.
- **담는 일은 실패하지 않는다**(ADR-0003). 질문을 다 썼든 모델이 답하지 않든 문장은
  먼저 저장되고, 답 없는 질문은 pending으로 기다린다. 이건 오류가 아니라 상태다.
- **월 할당량은 세기만 한다.** 남은 횟수를 어딘가에 적어두고 매달 0으로 되돌리지
  않는다. 이번 달에 답을 받은 질문을 셀 뿐이라, 되돌리다 실패할 일이 없다.
- **읽은 양을 따로 적게 하지 않는다.** 진도를 옮기면 그 차이가 그날 읽은 양이다.
  읽고 나서 한 번 더 적게 만들면 아무도 적지 않는다.
- **프롬프트의 붙박이 부분만 캐시에 올린다.** 레벨·책·문장처럼 요청마다 달라지는
  것은 system이 아니라 user 메시지에 싣는다 — 캐시는 앞에서 한 글자만 달라도 깨진다.

## 길

로그인 셋을 뺀 나머지는 전부 `Authorization: Bearer <액세스 토큰>`이 필요하다.

```
POST   /api/auth/:provider        kakao | naver | google — 인가 코드를 넘기면 토큰 두 장
POST   /api/auth/refresh          리프레시 회전
POST   /api/auth/logout           그 리프레시 하나만 폐기
GET    /api/auth/me               지금 로그인한 독자

GET    /api/readers/me            프로필
PATCH  /api/readers/me            레벨 · 닉네임 · 끝낸 권수

GET    /api/books/search ?q=       책 검색(구글 북스) — :id보다 먼저 선언돼 있어야 한다
GET    /api/books ?finished=      내 책장
POST   /api/books
GET    /api/books/:id
PATCH  /api/books/:id             진도 · 다 읽은 날
DELETE /api/books/:id             문장까지 함께 지운다

GET    /api/sentences ?bookId= &liked=
POST   /api/sentences
GET    /api/sentences/:id
PATCH  /api/sentences/:id
DELETE /api/sentences/:id

GET    /api/asks/quota            이번 달 남은 질문
POST   /api/asks/split            찍은 쪽에서 읽어낸 줄들을 문장으로 잇는다 — 질문 횟수를 쓰지 않는다
POST   /api/asks                  문장을 통째로 묻는다 — 문장은 먼저 저장된다
GET    /api/asks ?status= &limit= status=pending이 '기다리는 문장'
GET    /api/asks/:id
POST   /api/asks/:id/resolve      기다리던 질문을 다시 물어본다
DELETE /api/asks/:id              질문만 지운다. 문장은 남는다

GET    /api/reading/week          이레치 날짜와 쪽수 · 읽은 날 · 연속 일수

GET    /api/retells/quota          질문과 따로 센다
POST   /api/retells                옮겨 적은 글은 답을 못 받아도 남는다
GET    /api/retells ?bookId=
GET    /api/retells/:id
POST   /api/retells/:id/resolve
DELETE /api/retells/:id

POST   /api/items                 담기 — 이미 있으면 재회로 돌아온다
GET    /api/items ?status= &reencountered= &bookId=
GET    /api/items/:id             만난 문장과 그 책까지 이어서
PATCH  /api/items/:id             뜻 · 상태 · 헷갈리는 짝
POST   /api/items/:id/encounters
DELETE /api/items/:id/encounters/:sentenceId
DELETE /api/items/:id
```

`POST /api/items`의 답에 `reencountered`와 `gapDays`가 실린다. 며칠을 "2개월 만에"
같은 말로 옮기는 일은 앱이 한다 — 서버는 사실만 준다.

`POST /api/asks`의 답에는 문장과 책이 함께 실린다. 후보 중 이미 서랍에 있는 것에는
`existingItemId`가 붙어 오고, 그걸 `POST /api/items`로 담는 순간이 재회다.

목록 응답(`GET /api/items`)은 항목마다 건너온 책들과 가장 최근 문장을 함께 싣는다.
클라이언트가 줄마다 다시 물어보게 두면 스무 줄짜리 서랍이 스물한 번을 부른다.
같은 이유로 질문의 후보에는 이미 서랍에 있는 표현의 재회 정보가 붙어 온다.

## 개발용 문

`POST /api/dev/login`은 소셜 로그인 앱이 등록되기 전까지만 여는 임시 문이다.
`ALLOW_DEV_LOGIN=true`일 때만 열리고 `NODE_ENV=production`이면 거부하며, 열려
있는 동안 부팅 로그가 매번 그 사실을 말한다. 검증이 끝나면
`src/auth/dev-login.controller.ts`와 환경 변수를 함께 지운다.

## 아직 없는 것

퀴즈는 MVP에서 뺀다는 결정으로 걷어냈다 — 아직 안 만든 게 아니라 이번 출시엔
안 낸다는 뜻이다. LexicalItem에 있던 review(streak·wrongCount) 서브스키마도
그 퀴즈만 읽고 쓰던 값이라 함께 지웠다.

소셜 로그인 셋과 모델 호출은 실제로 통신해 본 적이 없다 — 둘 다 자격 증명이
있어야 검증된다.
