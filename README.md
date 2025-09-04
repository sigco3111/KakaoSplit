# Kakao Notion Webapp (Vercel Serverless)

이 프로젝트는 카카오톡 대화 CSV 파일을 날짜별로 분류하여, 지정한 폴더(날짜 또는 전체 output)를 Notion 페이지에 자동 등록하는 서버리스 웹앱입니다.

## 주요 기능
- CSV 파일 업로드 및 날짜별 분류
- 날짜별 폴더/파일 생성 및 관리
- 폴더 선택 후 Notion 페이지 자동 등록
- Notion API 토큰/DB/페이지 ID 설정 (로컬스토리지 저장)
- Vercel Serverless Functions 기반 백엔드

## 폴더 구조
```
/ (프로젝트 루트)
  ├── /frontend      # Next.js 기반 프론트엔드
  ├── /backend       # Vercel 서버리스 함수 예시 (참고용)
  ├── /output        # 날짜별 chat.txt 파일 생성 위치 (외부 스토리지 권장)
  ├── PRD.md         # 요구사항 정의서
  ├── checklist.md   # 개발 체크리스트
  └── README.md      # 프로젝트 설명
```

## 개발/배포
- Vercel에 프로젝트를 연결하여 자동 배포
- 프론트엔드: Next.js, 파일 업로드/설정/알림 UI
- 백엔드: `/api/upload`, `/api/notion-register` 등 서버리스 함수로 구현
- vercel --prod 명령어로 배포.

## 참고
- PRD.md: 상세 요구사항 및 기능 흐름
- checklist.md: 단계별 개발 체크리스트
- .github/copilot-instructions.md: AI 개발 가이드

---
문의 및 추가 요청은 이슈로 남겨주세요.
