
# KakaoTalk → Notion 자동 등록 웹앱

카카오톡 대화 CSV 파일을 날짜별로 분류하여 output 폴더에 저장하고, 지정한 폴더(날짜 또는 전체)를 Notion 페이지/DB에 자동 등록하는 웹앱입니다.

## 주요 기능
- CSV 파일 업로드 → 날짜별로 분류하여 output/2025-09-04.md 등으로 저장
- output 폴더/날짜 폴더 선택 → 해당 파일을 Notion에 등록
- Notion API 토큰, DB ID 등 설정값은 UI에서 입력, 로컬스토리지에 저장
- 모든 UI 한글화
- Vercel 배포 지원 (App Router 기반)

## 폴더 구조 (2025-09 기준)
```
webapp/
	app/           # Next.js App Router 기반 메인 UI 및 API
	output/        # 날짜별로 생성되는 대화 파일 (ex. 2025-09-04.md)
	public/        # 정적 파일
	__tests__/     # 주요 테스트 코드
	...
```

## 주요 파일 설명
- app/page.tsx: 메인 UI, 한글화, 폴더 선택, Notion 설정, 연결 테스트
- app/api/upload/route.ts: CSV 업로드 및 날짜별 파일 생성
- app/api/get-files/route.ts: output 폴더 파일 목록 조회
- app/api/notion-register/route.ts: Notion 페이지 등록 API (DB ID 자동 정규화)
- app/api/test-notion/route.ts: Notion DB 연결 테스트 API

## 사용법
1. CSV 파일 업로드 → output 폴더에 날짜별 파일 생성
2. Notion 설정(토큰, DB ID) 입력 → 연결 테스트
3. output 폴더 또는 날짜 폴더 선택 후 Notion 등록

## 주의사항
- Notion DB ID는 하이픈 포함/미포함 모두 입력 가능 (자동 정규화)
- Integration 권한 및 DB 공유 필수
- Vercel 배포 시 App Router 구조만 지원

## 개발/배포
```bash
cd webapp
npm install
npm run dev
```

## 참고
- PRD.md: 상세 요구사항 및 기능 흐름
- checklist.md: 개발 체크리스트
- .github/copilot-instructions.md: AI 개발 가이드

문의: sigco3111@gmail.com
