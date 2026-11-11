# 시간의 서가 — 대한민국 근대사 아카이브

대한민국 근대사의 주요 장면을 사진과 해설로 살펴볼 수 있는 한국어 아카이브입니다. 사이트는 Cloudflare Workers에서 제공하며, 계정·댓글용 데이터베이스는 Cloudflare D1에 마련되어 있습니다.

## 배포 주소

**실제 서비스 중인 웹사이트:** [https://history-archive.jjh103.workers.dev](https://history-archive.jjh103.workers.dev)

**소스 코드:** [https://github.com/Gabriel-Jeong/history-archive](https://github.com/Gabriel-Jeong/history-archive)

Cloudflare Worker의 이름은 `history-archive`이며, D1 데이터베이스의 이름은 `history-archive-db`입니다. Worker와 D1은 Cloudflare 계정에 배포되어 있습니다. 홈페이지에서는 주요 사건을 검색하고 시대별로 분류할 수 있습니다.

## 주요 기능

아카이브에는 1894년 동학농민운동부터 1987년 6월 민주항쟁까지 여섯 가지 주요 사건이 담겨 있습니다. 각 사건의 사진, 연도, 개요와 상세 해설을 살펴볼 수 있습니다.

개항기·일제강점기·해방과 전쟁·민주화로 사건을 필터링하고, 검색창에서 사건명과 연도를 검색할 수 있습니다. 화면 구성은 데스크톱과 모바일에 대응합니다.

사진은 Unsplash에서 불러오고, 글꼴은 Google Fonts를 사용하므로 이미지와 글꼴을 보려면 인터넷 연결이 필요합니다. 실제 서비스에 적용하기 전에는 사진의 사용 권리와 사건별 출처를 확인해야 합니다.

## 로그인과 댓글의 현재 상태

**현재 공개 사이트에서는 로그인·회원가입·댓글 작성 기능을 사용할 수 없습니다.** 안전한 로그인과 관리자 최초 등록 절차를 검증하지 못해 회원가입 API를 비활성화했으며, 해당 API는 `503 Service Unavailable`을 반환합니다.

D1에는 향후 사용할 사용자·세션·댓글 테이블이 준비되어 있고, 사건별 댓글을 조회하는 API도 배포되어 있습니다. 그러나 댓글을 작성하거나 로그인을 통한 세션을 만드는 기능은 운영 환경에서 검증을 완료하지 않았습니다. 따라서 댓글 작성과 관리자 계정 등록이 가능하다고 전제해서는 안 됩니다.

관리자 통계 API는 사용자의 역할을 데이터베이스에서 확인하도록 구성되어 있습니다. 인증되지 않은 접근은 `401 Unauthorized`로 거부됩니다. 다만 공개된 기존 `app.js`에는 첫 화면 데모에 쓰는 `viewer`·`admin` 계정과 브라우저 `localStorage` 댓글 코드가 아직 남아 있습니다. 이 계정은 서버 계정이나 운영 관리자 권한이 아니며, 비밀번호는 공개된 데모 정보이므로 실서비스에서 사용하면 안 됩니다. 이는 예전 화면 코드가 정리되지 않은 상태이며, 서버 연동 처리와의 중복 문제는 GitHub [이슈 #1](https://github.com/Gabriel-Jeong/history-archive/issues/1)에 정리되어 있습니다.

## 실행 및 개발

정적 페이지를 확인하려면 프로젝트의 `index.html`을 브라우저에서 엽니다. 로컬 웹 서버를 사용하려면 프로젝트 폴더에서 다음 명령을 실행한 뒤 `http://localhost:8000`에 접속합니다.

```powershell
python -m http.server 8000
```

Cloudflare Worker를 개발하거나 배포하려면 Node.js 22 이상과 Wrangler 4가 필요합니다. Wrangler로 Cloudflare 계정에 로그인한 뒤 프로젝트 폴더에서 `wrangler dev`를 실행해 개발 서버를 시작하고, `wrangler deploy`로 Worker와 정적 사이트를 배포합니다. `wrangler.jsonc`는 Worker와 정적 파일 경로, D1 바인딩을 지정합니다. 실제 사이트의 `workers.dev` 배포 주소는 이 README 위쪽에서 확인할 수 있습니다.

## D1 데이터베이스

저장소의 `migrations/0001_initial_schema.sql`에는 사용자 계정, 로그인 세션, 사건 댓글 테이블과 검색용 인덱스가 정의되어 있습니다. 로컬 개발 데이터베이스에 마이그레이션을 적용하려면 다음 명령을 실행합니다.

```powershell
wrangler d1 migrations apply history-archive-db --local
```

운영 데이터베이스에 마이그레이션을 적용할 때는 `--local` 대신 `--remote`를 지정합니다.

```powershell
wrangler d1 migrations apply history-archive-db --remote
```

## GitHub에 변경 사항 반영하기

프로젝트의 GitHub 원격 저장소는 `https://github.com/Gabriel-Jeong/history-archive.git`입니다. README를 포함해 변경한 파일을 검토하고, 커밋한 뒤 `main` 브랜치에 푸시합니다.

```powershell
git add README.md
git commit -m "Clarify project and Cloudflare deployment documentation"
git push origin main
```

## 보안 및 운영상 주의

`.dev.vars`, Wrangler 인증 파일, 로컬 개발용 데이터베이스 파일과 실제 비밀 값은 Git에 올리지 않습니다. 계정 인증을 개발할 때는 비밀번호 해시와 서버가 검증하는 세션을 구성하고, 댓글 작성과 관리자 권한을 Worker에서 확인해야 합니다. 회원가입을 다시 열기 전에는 로그인·로그아웃·관리자 권한·댓글 저장 및 권한 검사를 실제로 시험해야 합니다.

공개 서비스로 운영하기 전에는 비밀번호 재설정과 사용자 동의·개인정보 안내, 스팸 방지·요청 제한도 검토해야 합니다. 역사 사진과 해설에는 적절한 출처 및 사용 권리를 확인해야 합니다.