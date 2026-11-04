# 시간의 서가 — 대한민국 근대사 아카이브

주요 사건의 기록과 사진을 살펴보고 댓글을 남기는 반응형 한국어 웹사이트입니다. 외부 패키지를 설치하지 않는 정적 사이트여서 `index.html`을 직접 열거나 정적 웹 호스팅에 배포할 수 있습니다.

## 실행하기

- `index.html`을 브라우저에서 엽니다.
- 또는 프로젝트 디렉터리에서 `python -m http.server 8000`을 실행한 뒤 `http://localhost:8000`을 엽니다.
- GitHub Pages, Cloudflare Pages, Netlify, Vercel 정적 배포, S3 정적 웹사이트 등 웹 정적 파일 호스팅에 프로젝트 내용을 배포할 수 있습니다. 빌드 단계나 패키지 설치는 필요하지 않습니다.

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
- 사건별 댓글 목록, 로그인·회원가입 데모, 세션 내 계정 및 관리자 화면
- 반응형 한국어 레이아웃 및 접근성 기본 지원

## 시연 계정

- 일반 회원: 아이디 `viewer`, 비밀번호 `history123`
- 관리자: 아이디 `admin`, 비밀번호 `admin1234`
- 그 외 아이디는 회원가입 화면에서 시연용 계정을 만들 수 있습니다.

## 중요: 운영 환경에 배포하기 전에

이 프로젝트는 서버/API가 준비되지 않은 초기 화면 프로토타입입니다. 계정, 비밀번호, 관리자 여부가 `app.js`에 있는 프런트엔드 데모 코드에만 존재합니다. 따라서 브라우저 개발자 도구나 내려받은 파일을 보면 인증정보가 공개되며, 관리자 페이지는 화면 시연일 뿐 보안 경계가 **아닙니다**. 회원가입 데이터와 댓글은 해당 브라우저의 `localStorage`에만 저장되어 다른 사람·기기와 공유되지 않으며, 서버에 영구 저장되지 않습니다. 운영용 실서비스 인증 또는 민감정보를 이 코드에 입력하거나, 이 구현을 실제 관리자 권한 보호 용도로 사용하지 마세요.

실제 서비스로 전환할 때는 백엔드와 데이터베이스를 연결하고, 비밀번호는 서버에서 안전하게 해시하여 저장하며, 로그인 세션은 안전한 `HttpOnly`, `Secure`, `SameSite` 쿠키로 관리해야 합니다. 인증·인가를 API 및 관리자 페이지 **양쪽**에서 서버가 확인하고, 서버 저장 댓글에 XSS·스팸 방지, 입력 검증, 요청 위조 방지, 요청 제한을 적용하세요. 기본 시연 계정과 프런트엔드 내 인증 구현도 제거하고, 이미지 사용 권리와 캡션·사건별 출처를 검토해 실제 서비스에 맞는 사진과 출처를 추가하세요. 현재 사진은 외부 Unsplash 이미지 URL이며 인터넷 연결이 필요합니다.