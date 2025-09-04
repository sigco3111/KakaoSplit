# Kakao Notion Webapp: Copilot Instructions

## 프로젝트 개요
이 프로젝트는 카카오톡 대화 CSV 파일을 날짜별로 분류하여 폴더/파일로 저장하고, 지정한 폴더(날짜 또는 output 전체)를 Notion 페이지에 자동 등록하는 웹앱입니다.

## 주요 구조 및 데이터 흐름
- **입력:** 사용자가 CSV 파일 업로드
- **파싱:** 날짜별로 메시지 분류 및 폴더/파일 생성 (`/output/YYYY-MM-DD/chat.txt`)
- **등록:** 폴더 선택 시 Notion API로 각 날짜별 파일을 페이지로 등록
- **설정:** Notion API 토큰, 페이지/DB ID 등은 설정화면에서 입력, 로컬스토리지에 저장

## 개발 워크플로우
- 프론트엔드: React/Next.js/Vue.js 중 하나 사용 (PRD 참고)
- 백엔드: Node.js(Express) 또는 Python(Flask/FastAPI)로 파일 파싱 및 Notion 연동
- 파일 파싱: pandas(Python) 또는 csv-parser(JS) 활용
- Notion 연동: 공식 Notion API 사용, 인증 토큰은 로컬스토리지에서 읽음

## 통합 및 패턴
- 날짜 폴더 지정 시: 해당 날짜만 Notion에 등록 (페이지 1개)
- output 폴더 지정 시: 하위 모든 날짜 폴더를 각각 Notion에 등록 (페이지 여러 개)
- 설정값(토큰, DB/페이지 ID 등)은 반드시 로컬스토리지에서 읽고, 없으면 입력받아 저장
- 폴더/파일 생성 및 등록 실패 시 상세 에러 메시지 제공
- 모든 프롬프트 입력/처리 시 AI agent는 반드시 sequential-thinking 및 serena MCP(Model Context Protocol)를 활용해야 함.
- 프롬프트 기반 추론/대화/분석은 항상 체계적 사고와 MCP 기반 워크플로우를 따름

## 예외 처리 및 확장
- CSV 형식 오류, Notion 등록 실패, 설정 정보 누락 등은 UI에서 안내
- 향후 여러 CSV 동시 처리, 태그/메타데이터 추가, 작업 이력 관리 등 확장 예정

## 참고 파일
- `PRD.md`: 전체 요구사항 및 기능 흐름 명세
- `/output/`: 날짜별 폴더 및 파일 생성 위치
- `.github/copilot-instructions.md`: AI 개발 가이드

## 예시
```js
// 날짜별 폴더 생성 예시
output/2025-09-04/chat.txt
output/2025-09-05/chat.txt
```

---
이 가이드에 불명확하거나 누락된 부분이 있으면 반드시 사용자에게 피드백을 요청하세요.
