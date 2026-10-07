# reread.cloud — 홈페이지와 개인정보 처리방침

정적 페이지 두 장이다. 앱 서버(`api.reread.cloud`, Render)와는 따로 산다.

| 주소 | 파일 |
|---|---|
| `https://reread.cloud/` | `index.html` |
| `https://reread.cloud/privacy` | `docs/privacy-policy.md` → `build.mjs`가 `privacy/index.html`을 만든다 |

**방침을 고칠 때는 `docs/privacy-policy.md`만 고친다.** 미리 보려면 `node site/build.mjs`로 만들고
`site/`를 아무 정적 서버로 연다(`python3 -m http.server -d site`). 만든 `site/privacy/`는 git에
넣지 않는다 — 배포 워크플로(`.github/workflows/pages.yml`)가 올리기 전에 같은 일을 한다.

## 배포 (처음 한 번)

1. GitHub 저장소 → Settings → Pages → **Source: GitHub Actions**
2. 같은 화면의 **Custom domain**에 `reread.cloud` 입력 → Enforce HTTPS
3. 가비아 DNS에 GitHub가 안내하는 값을 넣는다. 루트(`@`)는 A 레코드(안내에 나오는 IP), `www`는
   CNAME(`woogie0303.github.io.`). 값은 GitHub Pages 문서를 따른다.
4. 워크플로는 **`main`에 push될 때** 돈다. 작업 브랜치에서 올리려면 Settings → Environments →
   `github-pages`에서 배포를 허용할 브랜치에 그 브랜치를 더하고, Actions에서 Pages를 직접 실행한다.

## Google 브랜딩 인증

- Google Search Console에서 `reread.cloud`를 **도메인**으로 등록하고 DNS TXT로 소유를 인증한다.
- Google Auth Platform → 브랜딩: 승인된 도메인 `reread.cloud`, 홈페이지 `https://reread.cloud`,
  개인정보처리방침 `https://reread.cloud/privacy`.
- 홈페이지 본문에 방침 링크가 있어야 한다(`index.html`의 머리와 본문, 바닥에 있다).
