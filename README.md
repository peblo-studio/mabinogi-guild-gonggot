# 군것질연구소

마비노기 모바일 길드 **군것질연구소** 홍보·정보 공유용 웹사이트입니다.

## 기술 스택

- [Next.js](https://nextjs.org/) (App Router)
- [Tailwind CSS](https://tailwindcss.com/) v4
- TypeScript
- Prisma (PostgreSQL)

## 폴더 구조

```
mabinogi-guild-gonggot/
├── public/                 # 정적 자산 (favicon 등)
├── src/
│   ├── app/
│   │   ├── globals.css     # 전역 스타일·토큰
│   │   ├── layout.tsx      # 루트 레이아웃·메타데이터
│   │   ├── page.tsx        # 메인(랜딩) 페이지
│   │   ├── login/          # 로그인/회원가입
│   │   └── reservations/   # 주간 예약 게시판 (레이드/어비스)
│   ├── components/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   └── lib/
│       ├── site.ts         # 길드명·설명·외부 링크 설정
│       ├── auth.ts         # 쿠키 기반 세션 인증
│       └── week.ts         # 주간(월~일) 유틸
├── prisma/
│   └── schema.prisma       # 예약/유저 DB 스키마
├── next.config.ts
├── package.json
└── tsconfig.json
```

길드 소개 랜딩 페이지 + 로그인 + 주간 예약 기능으로 확장하기 쉽게 구성했습니다.

## 설정

1. `.env.example`을 복사해 `.env`를 만듭니다.
2. `.env`에서 `AUTH_SECRET`를 긴 랜덤 문자열로 설정합니다.
3. (선택) `GUILD_INVITE_CODE`를 설정하면 회원가입 시 코드 입력을 강제할 수 있습니다.
4. (선택) `ADMIN_USERNAMES`를 `아이디1,아이디2` 형태로 설정하면 해당 유저만 공지사항 작성/수정이 가능합니다.
5. `src/lib/site.ts`에서 디스코드·오픈톡 URL을 수정합니다.
6. `public/`에 파비콘 등을 넣습니다.

## DB 초기화

```bash
npm run db:push
```

PostgreSQL 스키마가 반영됩니다.

## 로컬 실행

```bash
npm install
npm run db:push
npm run dev
```

## 제공 기능

- 길드 소개 랜딩
- 로그인/회원가입 (아이디+비밀번호)
- 닉네임 변경
- 레이드 예약 코너 (주간: 월~일)
- 어비스 예약 코너 (주간: 월~일)
- 주차 이동(이전 주/다음 주)
- 본인 예약 삭제
- 커뮤니티 게시판 (공지사항/공략/자유게시판)
- 게시글 작성/수정/삭제 (권한 기반)
- 게시글 좋아요
- 댓글 작성/삭제
- 게시글 검색/페이지네이션

## Vercel 배포 (무료 티어)

1. 이 저장소를 GitHub 등에 푸시합니다.
2. [Vercel](https://vercel.com)에서 **Import** → 해당 저장소 선택.
3. 외부 PostgreSQL(Neon/Supabase/Railway 등) DB를 생성합니다.
4. Vercel 프로젝트 환경 변수에 아래를 등록합니다.
   - `AUTH_SECRET` (최소 16자 이상 랜덤 문자열)
   - `DATABASE_URL` (PostgreSQL 연결 문자열)
   - `GUILD_INVITE_CODE` (선택)
   - `ADMIN_USERNAMES` (선택, `아이디1,아이디2`)
5. Build Command를 `npm run vercel-build`로 설정합니다.
6. 로컬에서 같은 `DATABASE_URL`로 `npm run db:push`를 1회 실행해 스키마를 반영합니다.
7. Framework Preset이 **Next.js**인지 확인 후 **Deploy**합니다.
