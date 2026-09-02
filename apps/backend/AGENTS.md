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

## 길

로그인 셋을 뺀 나머지는 전부 `Authorization: Bearer <액세스 토큰>`이 필요하다.

```
POST   /api/auth/:provider        kakao | naver | google — 인가 코드를 넘기면 토큰 두 장
POST   /api/auth/refresh          리프레시 회전
POST   /api/auth/logout           그 리프레시 하나만 폐기
GET    /api/auth/me               지금 로그인한 독자

GET    /api/readers/me            프로필
PATCH  /api/readers/me            레벨 · 닉네임 · 끝낸 권수

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

POST   /api/items                 담기 — 이미 있으면 재회로 돌아온다
GET    /api/items ?status= &reencountered=
GET    /api/items/:id             만난 문장과 그 책까지 이어서
PATCH  /api/items/:id             뜻 · 상태 · 헷갈리는 짝
POST   /api/items/:id/encounters
DELETE /api/items/:id/encounters/:sentenceId
DELETE /api/items/:id
```

`POST /api/items`의 답에 `reencountered`와 `gapDays`가 실린다. 며칠을 "2개월 만에"
같은 말로 옮기는 일은 앱이 한다 — 서버는 사실만 준다.

## 아직 없는 것

AI 연동(ADR-0001의 ask), 대기 중인 질문과 월 할당량, 퀴즈·리텔링. 클라이언트는
아직 목업으로 그려져 있고 이 API를 부르지 않는다.
