# 시간의 서가 — 대한민국 근대사 아카이브

주요 사건의 기록과 사진을 살펴볼 수 있는 Cloudflare Workers 웹사이트입니다. 공개 홈페이지와 Cloudflare D1을 배포했으며, 회원가입·로그인·댓글 작성·관리자 최초 등록은 아직 이용할 수 없습니다.

## 실제 배포 사이트

- 사이트: <https://history-archive.jjh103.workers.dev>
- 소스: <https://github.com/Gabriel-Jeong/history-archive>
- Cloudflare Worker: `history-archive`
- Cloudflare D1 (APAC): `history-archive-db`

관리자 API는 Worker 서버가 D1 사용자 역할을 확인하고, 인증되지 않은 요청은 HTTP 401로 거부합니다. 시연용 관리자 계정과 비밀번호는 공개 저장소나 사이트에 넣지 않습니다.

## 실행하기

- `index.html`을 브라우저에서 엽니다.
- 또는 프로젝트 디렉터리에서 `python -m http.server 8000`을 실행한 뒤 `http://localhost:8000`을 엽니다.
- Cloudflare Worker/D1 배포는 아래 개발 및 Cloudflare 배포 안내를 참고하세요.

## Git과 GitHub에 올리기

추천 GitHub 저장소 이름은 `korean-modern-history-archive`입니다. Git 설치 후 프로젝트 디렉터리에서 PowerShell을 열고, GitHub에 먼저 **Public** 저장소를 생성한 다음 아래 명령을 실행합니다. `YOUR-GITHUB-USERNAME`을 본인 GitHub 아이디로 바꾸세요.

```powershell
git add .
git commit -m "Build Korean modern history archive website"
git branch -M main
git remote add origin https://github.com/YOUR-GITHUB-USERNAME/korean-modern-history-archive.git
git push -u origin main
```

이후 변경 사항은 `git add .`, `git commit -m "변경 내용"`, `git push` 순서로 업로드합니다. GitHub 인증이 필요하면 GitHub Desktop이나 GitHub CLI(`gh auth login`)를 사용하세요. 저장소를 Public으로 공개하면 GitHub Pages에서도 정적 사이트로 배포할 수 있습니다.

## 구현된 기능

- 동학농민운동부터 6월 민주항쟁까지 근대사 주요 사건 6건의 사진, 날짜, 요약과 상세 해설
- 개항기·일제강점기·해방과 전쟁·민주화 시대별 필터와 사건 제목·연도 검색 (검색 단축키 `/`)
- D1 운영 데이터베이스와 사건별 댓글 조회 API
- 비로그인 사용자 및 관리자가 아닌 계정의 관리자 API 차단
- 반응형 한국어 레이아웃 및 접근성 기본 지원

### 로그인·회원가입 미완료

운영 Worker의 신규 회원가입은 안전한 인증 검증을 마칠 때까지 비활성화되어 HTTP 503을 반환합니다. 사용자가 계정을 만들거나 로그인하여 실제 댓글을 등록할 수 없습니다. 최초 관리자 등록도 구성되지 않았습니다. 관리자 통계 API는 사용자 D1 역할을 확인하며 인증되지 않은 요청은 HTTP 401로 차단됩니다. 현재 공개 배포는 역사 해설·검색·사진 감상만 지원합니다.

## 개발 및 Cloudflare 배포

Wrangler 4, Node.js 22 이상이 필요합니다. 개발용 D1을 초기화할 때는 `wrangler d1 migrations apply history-archive-db --local`을 사용합니다. 운영 D1에는 `wrangler d1 migrations apply history-archive-db --remote`를 적용합니다. Worker 배포는 `wrangler deploy`를 실행합니다. `.dev.vars`, Cloudflare 인증 파일과 로컬 D1 파일은 Git에서 제외합니다.

관리자 설정 후 초기화 키를 제거·회전하고 테스트 계정이 없는지 확인하세요. 운영 시 로그인 요청 속도 제한, 입력 스팸 방지, 적절한 CAPTCHA/봇 방지, 이용 약관·개인정보 처리 안내를 추가하고, 사진 사용권·사건 출처를 검토하세요. 이미지와 글꼴은 외부 Unsplash 및 Google Fonts URL을 사용하므로 인터넷 연결이 필요합니다.