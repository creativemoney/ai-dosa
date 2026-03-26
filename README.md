# AI 최강도사 — 배포 가이드

## 구조 요약
```
ai-dosa/
├── app/
│   ├── api/chat/route.js  ← Claude API 스트리밍 (서버)
│   ├── globals.css         ← 스타일
│   ├── layout.js           ← 레이아웃
│   └── page.js             ← 메인 화면 (입력폼 + 사주 + 채팅)
├── lib/
│   └── saju.js             ← 사주 계산 엔진 (24절기)
├── .env.example            ← API 키 설정 예시
├── next.config.js
├── package.json
└── README.md
```

## 배포 방법 (3단계)

### 1단계: GitHub에 올리기
1. https://github.com 접속 → 우측 상단 "+" → "New repository"
2. Repository name: `ai-dosa`
3. "Create repository" 클릭
4. 이 폴더의 파일들을 모두 드래그앤드롭으로 업로드
5. "Commit changes" 클릭

### 2단계: Vercel에 연결하기
1. https://vercel.com 접속 → GitHub 계정으로 로그인
2. "Add New Project" 클릭
3. GitHub에서 방금 만든 `ai-dosa` 저장소 선택 → "Import"
4. **Environment Variables** 섹션에서:
   - Name: `ANTHROPIC_API_KEY`
   - Value: (Anthropic API 키 입력)
5. "Deploy" 클릭 → 1~2분 후 완료!

### 3단계: 테스트
- Vercel이 제공하는 URL (예: ai-dosa.vercel.app)로 접속
- 생년월일 입력 → 사주 + 성격 즉시 표시 확인
- 도사에게 질문 → 1~3초 내 스트리밍 답변 확인

## API 키 발급
1. https://console.anthropic.com 접속
2. API Keys → "Create Key"
3. 복사해서 Vercel Environment Variables에 입력

## 수정이 필요할 때
이 채팅에서 클라라에게 "여기 수정해줘"라고 말하면 수정된 파일을 드립니다.
수정된 파일을 GitHub에 올리면 Vercel이 자동으로 재배포합니다.

## 기술 스택
- Next.js 14 (App Router)
- Vercel Edge Functions (서버)
- Claude Haiku 4.5 (빠른 응답)
- 24절기 기반 만세력 계산 엔진
