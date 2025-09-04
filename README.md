
# KakaoSplit

카카오톡 대화 CSV 파일을 날짜별로 분리하여 다운로드할 수 있는 웹 애플리케이션입니다.

## 🚀 주요 기능

- **CSV 파일 업로드**: 카카오톡에서 내보낸 대화 CSV 파일을 업로드
- **날짜별 자동 분리**: 대화 내용을 날짜별로 자동 분리하여 개별 파일 생성
- **ZIP 다운로드**: 처리된 모든 파일을 ZIP으로 압축하여 한 번에 다운로드
- **개별 다운로드**: 원하는 날짜의 파일만 선택하여 개별 다운로드
- **Vercel 최적화**: 서버리스 환경에서 안정적으로 작동

## 🛠️ 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **파일 처리**: csv-parse, JSZip
- **배포**: Vercel

## 📦 설치 및 실행

### 로컬 개발

```bash
# 저장소 클론
git clone <repository-url>
cd kakao_notion

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 배포

```bash
# 빌드
npm run build

# Vercel 배포
vercel --prod
```

## 💡 사용법

1. **설정**: 파일이 저장될 폴더 경로를 설정합니다.
2. **CSV 업로드**: 카카오톡에서 내보낸 대화 CSV 파일을 업로드합니다.
3. **파일 다운로드**: 
   - 모든 파일을 ZIP으로 다운로드하거나
   - 원하는 날짜의 파일만 개별 다운로드할 수 있습니다.

## 📁 파일 구조

```
kakao_notion/
├── app/
│   ├── api/
│   │   ├── upload/          # CSV 파일 업로드 및 처리
│   │   ├── get-files/       # 파일 목록 조회
│   │   └── download/        # 파일 다운로드
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx             # 메인 페이지
├── public/
├── package.json
└── README.md
```

## 🔧 API 엔드포인트

- `POST /api/upload`: CSV 파일 업로드 및 날짜별 분리 처리
- `GET /api/get-files`: 처리된 파일 목록 조회
- `POST /api/download`: 개별 파일 다운로드

## 🌐 환경별 동작

### 로컬 환경
- 사용자가 지정한 경로에 실제 파일 생성
- 파일 시스템을 통한 파일 관리

### Vercel (서버리스)
- `/tmp` 디렉터리를 사용한 임시 파일 처리
- 메모리 기반 파일 내용 관리
- 브라우저 직접 다운로드 방식

## 🐛 문제 해결

### 파일 권한 오류
- "임시폴더 (/tmp)" 옵션을 사용하세요
- 또는 접근 가능한 폴더 경로를 직접 입력하세요

### CSV 파일 형식 오류
- 카카오톡에서 정상적으로 내보낸 CSV 파일인지 확인하세요
- 파일 인코딩이 UTF-8인지 확인하세요

## 📄 라이센스

MIT License

문의: sigco3111@gmail.com
