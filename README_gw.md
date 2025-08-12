## HireMe 프로젝트 운영 가이드 (통합 README)

이 문서는 기존 README/README2 내용을 통합하고, 현재 작업 상태(의존성 경량화, AI 한글 이름 우선 추출, 정리 스크립트 추가)를 반영한 최신 실행/운영 지침입니다.

### 현재 상태 요약
- 백엔드: FastAPI + Uvicorn (포트 8000), MongoDB 연결 확인됨
- 프론트: 메인(3000), 관리자(3001) 정상 기동 가능 (프론트 코드는 변경하지 않음)
- AI: Groq LLM 사용(GROQ_API_KEY 필요). PDF 업로드 시 한글 이름을 AI로 최우선 추출하도록 개선됨
- 최적화: 무거운 패키지(torch/opencv/scikit-image 등) 제거, 임베딩 폴백(경량) 추가, 정리 스크립트/확장된 .gitignore 추가

---

### 1) 필수 요건
- Git, Node.js LTS(>= 18), npm
- Python 3.11 (권장)
- MongoDB Community Server (로컬 27017)
- OCR
  - Tesseract OCR (Windows 설치 후 실행 경로 필요)
  - Poppler (Windows는 bin 경로 필요)

설치 참고
- Tesseract: `https://tesseract-ocr.github.io/tessdoc/Installation.html`
- Poppler(Windows): `https://github.com/oschwartz10612/poppler-windows/releases`

---

### 2) 저장소 클론
```bash
git clone <YOUR_REPO_URL>
cd workspace
```

---

### 3) 환경 변수(.env)
환경파일 위치: `admin/backend/.env`

필수 예시
```env
# 디렉터리
DATA_DIR=data
UPLOADS_DIR=data/uploads
IMAGES_DIR=data/images
RESULTS_DIR=data/results

# OCR
OCR_LANG=kor+eng
TESSERACT_CMD=C:\\Program Files\\Tesseract-OCR\\tesseract.exe   # Windows 예시
POPPLER_PATH=C:\\tools\\poppler\\Library\\bin                 # Windows 예시

# 서버
HOST=0.0.0.0
PORT=8000

# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=pdf_ocr
MONGODB_COLLECTION=documents
DATABASE_NAME=hireme

# LLM (Groq 사용)
LLM_PROVIDER=groq
GROQ_API_KEY=<YOUR_GROQ_API_KEY>
GROQ_MODEL=llama-3.1-70b-versatile

# (선택) OpenAI
OPENAI_MODEL=gpt-4o-mini

# CORS (필요 시)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

주의
- 백엔드는 `admin/backend/.env`만 로드합니다.
- 한글 PDF OCR은 `OCR_LANG=kor+eng` 권장입니다.

---

### 4) 백엔드 설치 및 실행
Windows (PowerShell)
```powershell
cd admin/backend
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```
Mac/Linux (bash)
```bash
cd admin/backend
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

헬스 체크
```bash
curl http://localhost:8000/health
```

샘플 데이터(선택)
```powershell
cd admin/backend
python .\init_data.py
```

---

### 5) 프론트엔드 실행 (코드 변경 없음)
메인 UI (3000)
```bash
cd frontend
npm ci --no-audit --no-fund
npm start
```
관리자 UI (3001)
```bash
cd admin/frontend
npm ci --no-audit --no-fund
npm start
```

접속
- 메인: `http://localhost:3000`
- 관리자: `http://localhost:3001`
- API: `http://localhost:8000/health`

---

### 6) PDF 업로드 → OCR/색인/지원자 자동 생성
엔드포인트: `POST http://localhost:8000/api/pdf/upload`
- form-data: key=`file`, value=PDF

업로드 시 처리
- PDF→이미지 변환(Poppler)→OCR(Tesseract) & 내장텍스트 병합
- 요약/키워드(옵션) 및 임베딩(경량 폴백 제공) 생성
- `pdf_ocr.documents/pages` 저장, `hireme.applicant`/`hireme.applicants` 자동 생성

한글 이름 추출 정책 (개선)
- AI(Groq)로 한국어 이름(2~4자)을 최우선 추출
- 실패 시 정규식 기반(라벨/문서 초반) 시도
- 이메일 로컬파트로 이름을 유추하지 않고, 끝까지 없으면 “미상” 사용

---

### 7) 주요 API
- 헬스 체크: `GET /health`
- 지원자: `GET /api/applicants?skip=0&limit=20`, `GET /api/applicants/{id}`, `POST /api/applicants`, `PUT /api/applicants/{id}`
- 상태 변경: `PUT /api/applicants/{id}/status`
- 통계: `GET /api/applicants/stats/overview`
- OCR 문서를 카드 형태로: `GET /api/pdf/documents/applicants`

캐시
- 지원자 목록/통계는 서버 측 5분 캐시(캐시 키: skip/limit/status/position)
- 생성/수정/업로드 시 캐시 무효화됨

---

### 8) 경량화/최적화
- 무거운 패키지 제거: torch, scikit-image, opencv, pinecone 등 제거(필요 시 추후 복구)
- OpenCV 제거 → NumPy/Pillow 기반 전처리로 대체
- 임베딩 폴백: sentence-transformers 미설치 시 해시 기반 임베딩으로 동작
- .gitignore 확장: `node_modules`, `build`, 업로드/이미지/결과, `.venv`, `vector_db` 등 Git 제외
- 정리 스크립트: `cleanup.ps1`
  - DryRun: `powershell -ExecutionPolicy Bypass -File cleanup.ps1 -DryRun`
  - 실행: `powershell -ExecutionPolicy Bypass -File cleanup.ps1`

주의
- Pinecone 등 외부 VectorDB는 기본 비활성. 필요 시 의존성 복구 및 키 설정 후 사용

---

### 9) 자주 겪는 이슈
- PyMuPDF 빌드/호환: Python 3.11 권장
- Tesseract/Poppler 미설치: OCR 품질 저하 → 경로/설치 확인
- 포트 충돌: 8000/3000/3001 점유 시 종료 후 재시작
- MongoDB 미가동: API/목록 비노출 → 27017 가동 확인
- PowerShell 업로드 이슈: curl/Postman 사용 권장

---

### 10) 데이터/디렉터리
- 샘플/업로드: `admin/backend/data/uploads/`
- 썸네일: `admin/backend/data/images/`
- OCR 메타(JSON): `admin/backend/data/results/`

---

### 11) 변경 이력(핵심)
- Groq 기반 한글 이름 우선 추출 적용
- 백엔드 경량화(의존성/전처리/임베딩 폴백)
- 정리 스크립트 및 .gitignore 확장
- 프론트는 변경 없음

---

### 부록) 기존 COMBINED_README 통합 안내
- 기존 `COMBINED_README.md`에 흩어져 있던 실행/구성/엔드포인트/흐름 설명을 본 문서 각 절(1~11)에 재구성해 통합했습니다.
- 중복/노후 내용은 제거하고, 현 프로젝트 상태(경량화/AI 이름 추출/정리 스크립트) 기준으로 최신화했습니다.
- 필요 시 추가 상세 섹션이 요구되면 본 문서에 보강하겠습니다.

## 프로젝트 실행 가이드 (Windows/Mac/Linux)

이 문서는 다른 컴퓨터에서 본 프로젝트를 새로 실행할 때 필요한 전체 절차를 요약합니다.

### 1) 필수 요건 설치

- Git, Node.js LTS(>= 18), npm
- Python 3.11 (권장: 3.11 사용. 3.13은 PyMuPDF 빌드 이슈가 발생할 수 있음)
- MongoDB Community Server (로컬 27017 기본 포트)
- OCR 고정밀을 원할 경우
  - Tesseract OCR (Windows 설치 후 경로 필요)
  - Poppler (Windows는 bin 경로 필요)

참고 링크 (설치 안내)
- Tesseract: `https://tesseract-ocr.github.io/tessdoc/Installation.html`
- Poppler (Windows builds): `https://github.com/oschwartz10612/poppler-windows/releases`

### 2) 저장소 클론

```bash
git clone <YOUR_REPO_URL>
cd workspace
```

이 문서는 저장소 루트(여기) 기준 경로를 사용합니다.

### 3) 백엔드(.env) 설정

환경파일 위치는 `admin/backend/.env` 입니다. 아래 예시를 그대로 복사/수정해 사용하세요.

```env
# 디렉터리
DATA_DIR=data
UPLOADS_DIR=data/uploads
IMAGES_DIR=data/images
RESULTS_DIR=data/results

# OCR
OCR_LANG=kor+eng
TESSERACT_CMD=C:\\Program Files\\Tesseract-OCR\\tesseract.exe   # Windows 예시 (Mac/Linux는 생략)
POPPLER_PATH=C:\\tools\\poppler\\Library\\bin                 # Windows 예시

# 서버
HOST=0.0.0.0
PORT=8000

# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=pdf_ocr
MONGODB_COLLECTION=documents

# 임베딩/인덱싱
EMBEDDING_MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2
CHUNK_SIZE=800
CHUNK_OVERLAP=200
MIN_CHUNK_CHARS=20
INDEX_GENERATE_SUMMARY=true
INDEX_GENERATE_KEYWORDS=true

# LLM (Groq 사용)
LLM_PROVIDER=groq
GROQ_API_KEY=<YOUR_GROQ_API_KEY>
GROQ_MODEL=llama-3.1-70b-versatile

# (선택) OpenAI
OPENAI_MODEL=gpt-4o-mini

# CORS 허용 (필요 시)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

주의
- 백엔드는 `admin/backend/.env`만을 로드합니다. 다른 경로에 `.env`가 있어도 사용되지 않습니다.
- 한글 PDF OCR은 `OCR_LANG=kor+eng` 권장입니다.

### 4) 백엔드 설치 및 실행

Windows (PowerShell):
```powershell
cd admin/backend
py -3.11 -m venv .venv
.\.venv\Scripts\python -m pip install --upgrade pip
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Mac/Linux (bash):
```bash
cd admin/backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

샘플 데이터 삽입(선택):
```powershell
cd admin/backend
.\.venv\Scripts\python .\init_data.py
```

헬스 체크:
```bash
curl http://localhost:8000/health
```

### 5) 프론트엔드 실행

메인 UI (포트 3000):
```bash
cd frontend
npm ci --no-audit --no-fund
npm start
```

관리자 UI (포트 3001):
```bash
cd admin/frontend
npm ci --no-audit --no-fund
npm start
```

### 6) 동작 확인

- 메인 UI: `http://localhost:3000`
- 관리자 UI: `http://localhost:3001`
- API 헬스: `http://localhost:8000/health`
- 지원자 목록: `http://localhost:8000/api/applicants?skip=0&limit=20`

### 7) PDF 업로드 (OCR/인덱싱/지원자 자동생성)

엔드포인트: `POST http://localhost:8000/api/pdf/upload`
- form-data: key=`file`, value=PDF 파일
- 업로드 후:
  - `pdf_ocr.documents`에 문서 저장(요약/키워드 옵션 적용)
  - `hireme.applicant` 및 `hireme.applicants`에 동일 포맷으로 지원자 자동 생성
  - 프론트는 업로드 직후 목록을 재로딩하며, 추가된 카드가 즉시 표시됨

OCR 문서를 지원자 카드로 항상 노출하고 싶다면:
- 백엔드: `GET /api/pdf/documents/applicants` 제공
- 프론트: 목록 로딩 시 API 결과와 병합 (이미 반영됨)

### 8) 자주 겪는 이슈

- PyMuPDF 빌드 오류: Python 3.13 + Windows에서 Visual Studio 빌드툴 요구. Python 3.11 사용 권장
- Tesseract/Poppler 미설치: OCR 정확도가 낮아짐. Windows는 환경변수 또는 `.env` 경로 지정 필요
- 포트 충돌: 8000/3000/3001 점유 시 다른 포트 사용 또는 기존 프로세스 종료
- MongoDB 미가동: 서비스가 정상 작동하지 않음. 로컬 MongoDB가 27017에서 실행 중인지 확인

### 9) 환경 요약(필수)

- Python: 3.11
- Node.js: LTS 18 이상
- MongoDB: 6.x 이상 (로컬 27017)
- `.env` 위치: `admin/backend/.env`
- 필수 변수: `MONGODB_URI`, `OCR_LANG`, `LLM_PROVIDER`, (`GROQ_API_KEY` 또는 OpenAI/Gemini 키)

### 10) 테스트 파일/샘플 위치

- 샘플 PDF: `admin/backend/data/uploads/`
- OCR 결과 썸네일: `admin/backend/data/images/`
- OCR 메타 저장(JSON 스냅샷): `admin/backend/data/results/`

### 11) 종료/재시작 팁

- 백엔드 재시작 시 변경사항 즉시 반영(uvicorn 재실행)
- 업로드 후 목록 캐시는 자동 무효화되도록 처리됨 (즉시 반영)


