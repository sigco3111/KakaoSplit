# KakaoSplit: Copilot Instructions

## 프로젝트 개요
이 프로젝트는 카카오톡 대화 CSV 파일을 날짜별로 분류하여 파일로 저장하고, ZIP으로 압축하여 다운로드할 수 있는 웹앱입니다.

## 주요 구조 및 데이터 흐름
- **입력:** 사용자가 CSV 파일 업로드
- **파싱:** 날짜별로 메시지 분류 및 파일 생성 (메모리 기반)
- **다운로드:** 개별 파일 또는 ZIP 압축 파일로 다운로드
- **설정:** 저장 경로 등은 설정화면에서 입력, 로컬스토리지에 저장

## 개발 워크플로우
- 프론트엔드: React/Next.js 사용
- 백엔드: Node.js(Express) 또는 Python(Flask/FastAPI)로 파일 파싱
- 파일 파싱: csv-parse(JS) 활용
- 파일 압축: JSZip 라이브러리 사용

## 통합 및 패턴
- 모든 파일 처리는 서버리스 환경에서 `/tmp` 디렉터리 사용
- Vercel 환경에서는 메모리 기반 파일 처리 후 클라이언트 다운로드
- 설정값(저장 경로 등)은 반드시 로컬스토리지에서 읽고, 없으면 입력받아 저장
- 파일 생성 및 다운로드 실패 시 상세 에러 메시지 제공
- 모든 프롬프트 입력/처리 시 AI agent는 반드시 sequential-thinking 및 serena MCP(Model Context Protocol)를 활용해야 함.

## 예외 처리 및 확장
- CSV 형식 오류, 파일 처리 실패, 설정 정보 누락 등은 UI에서 안내
- 향후 다른 메신저 지원, 대화 분석 기능, 모바일 앱 등 확장 예정

## 참고 파일
- `PRD.md`: 전체 요구사항 및 기능 흐름 명세
- `/app/api/upload/route.ts`: CSV 파싱 및 파일 생성
- `/app/api/download/route.ts`: 파일 다운로드
- `/app/page.tsx`: 메인 UI
- `.github/copilot-instructions.md`: AI 개발 가이드

## 예시
```js
// 날짜별 파일 생성 예시 (메모리)
processedFiles = [
  {name: 'chat_2025-09-04.md', content: '...', size: 1024},
  {name: 'chat_2025-09-05.md', content: '...', size: 2048}
]
```

---
이 가이드에 불명확하거나 누락된 부분이 있으면 반드시 사용자에게 피드백을 요청하세요.
