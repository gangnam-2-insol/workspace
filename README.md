# HireMe Project - 채용공고 관리 시스템

## 📋 프로젝트 개요

HireMe Project는 관리자와 구직자를 위한 종합적인 채용공고 관리 시스템입니다. 관리자는 직관적인 인터페이스를 통해 채용공고를 등록하고 관리할 수 있으며, 구직자는 다양한 채용 정보를 쉽게 검색하고 지원할 수 있습니다.

## 🏗️ 시스템 아키텍처

### 전체 구조
```
hireme_project/
├── admin/                    # 관리자 시스템
│   ├── backend/             # 관리자 백엔드 (Python/FastAPI)
│   ├── frontend/            # 관리자 프론트엔드 (React)
│   └── database/            # 관리자 데이터베이스
├── client/                   # 구직자 시스템
│   ├── backend/             # 구직자 백엔드 (Python/FastAPI)
│   ├── frontend/            # 구직자 프론트엔드 (React/TypeScript)
│   └── database/            # 구직자 데이터베이스
└── shared/                  # 공유 컴포넌트 및 유틸리티
```

### 기술 스택
- **Frontend**: React, TypeScript, Styled Components, Framer Motion
- **Backend**: Python, FastAPI
- **Database**: MongoDB
- **Containerization**: Docker, Docker Compose
- **Package Management**: npm, pip
- **AI/ML**: Gemini API, LangGraph, 자연어 처리

## 🚀 주요 기능

### 1. 관리자 대시보드 (Admin Dashboard)

#### 채용 관리 (Recruitment Management)
- **채용공고 등록**: 텍스트 기반 및 이미지 기반 등록 방식
- **AI 채용공고등록도우미**: 개별모드와 랭그래프모드 지원
- **공고 관리**: 등록된 채용공고 목록 조회, 수정, 삭제
- **상태 관리**: 임시저장 → 모집중 상태 변경
- **홈페이지 등록**: 공고를 홈페이지에 게시하는 기능

#### 사용자 관리 (User Management)
- 구직자 계정 관리
- 지원자 정보 관리
- 권한 관리

#### 포트폴리오 분석 (Portfolio Analysis)
- 지원자 포트폴리오 분석
- AI 기반 매칭 시스템

#### 면접 관리 (Interview Management)
- 면접 일정 관리
- 면접 결과 기록
- 면접 피드백 시스템

#### 이력서 관리 (Resume Management)
- 지원자 이력서 관리
- 이력서 검색 및 필터링
- **AI 기반 이력서 분석**: Gemini API를 활용한 자동 요약 및 키워드 추출
- **파일 업로드 지원**: PDF, DOC, DOCX, TXT 파일 형식 지원
- **드래그 앤 드롭**: 직관적인 파일 업로드 인터페이스

#### 인재 추천 (Talent Recommendation)
- AI 기반 인재 추천
- 매칭 알고리즘

#### 자기소개서 검증 (Cover Letter Validation)
- 자기소개서 검증 시스템
- AI 기반 평가

#### 설정 (Settings)
- 시스템 설정
- 사용자 프로필 관리

### 2. AI 채용공고등록도우미 시스템 🆕

#### 개별모드 (Individual Mode)
**기존의 단계별 입력 방식:**
- **5단계 등록 프로세스**:
  1. 구인 부서 및 경력 선택
  2. 구인 정보 (인원수, 주요 업무)
  3. 근무 조건 (시간, 위치, 연봉)
  4. 전형 절차
  5. 지원 방법 (이메일, 마감일)

- **AI 어시스턴트 기능**:
  - 단계별 질문을 통한 체계적 정보 수집
  - 실시간 필드 검증 및 피드백
  - 자동 완성 및 추천 기능

#### 랭그래프모드 (LangGraph Mode) 🆕
**새로운 AI 기반 자유 대화 방식:**

- **자유로운 대화형 입력**:
  - 사용자가 자연어로 채용공고 정보를 자유롭게 입력
  - AI가 대화 내용에서 관련 정보를 자동 추출
  - 추출된 정보를 채용공고등록도우미에 자동 적용

- **AI 정보 추출 기능**:
  - 부서 정보 자동 인식 (개발팀, 마케팅팀, 영업팀 등)
  - 직무 정보 추출 (개발자, 프로그래머, 엔지니어 등)
  - 인원수, 경력요건, 급여 정보 자동 파싱
  - 근무 조건 및 위치 정보 인식

- **실시간 폼 업데이트**:
  - AI가 추출한 정보가 실시간으로 폼에 반영
  - 사용자가 수동으로 정보 수정 가능
  - 토스트 메시지로 진행 상황 알림

- **LangGraph 기반 Agent 시스템**:
  - 다양한 도구를 자동으로 선택하여 답변
  - 검색, 계산, DB 조회, 일반 대화 기능
  - 지능형 대화 관리 및 컨텍스트 유지

#### 공통 기능
- **우측 채팅창**: 두 모드 모두에서 공통으로 사용되는 AI 어시스턴트
- **모드 전환**: 개별모드 ↔ 랭그래프모드 간 자유로운 전환
- **세션 관리**: 대화 내용 자동 저장 및 복원
- **실시간 피드백**: 입력 내용에 대한 즉시적인 AI 피드백

### 3. 채용공고 등록 시스템

#### 텍스트 기반 등록 (Text-Based Registration)
**5단계 등록 프로세스:**

1. **구인 부서 및 경력 선택**
   - 조직도 연동 부서 선택
   - 경력 구분 (신입/경력)
   - 경력 연도 선택 (2년이상, 2~3년, 4~5년, 직접입력)

2. **구인 정보**
   - 구인 인원수 선택
   - 주요 업무 입력 (AI 추천 기능)

3. **근무 조건**
   - 근무 시간 선택 (09:00~18:00, 10:00~19:00, 직접입력)
   - 근무지 선택 (시/구 2단계 선택)
   - 연봉 입력

4. **전형 절차**
   - 기본 전형 절차 설정
   - 서류 → 실무면접 → 최종면접 → 입사

5. **지원 방법**
   - 인사담당자 이메일
   - 마감일 설정

#### 이미지 기반 등록 (Image-Based Registration)
**7단계 등록 프로세스:**

1. **구인 부서 및 경력 선택** (텍스트 기반과 동일)
2. **구인 정보** (텍스트 기반과 동일)
3. **근무 조건** (텍스트 기반과 동일)
4. **전형 절차** (텍스트 기반과 동일)
5. **지원 방법** (텍스트 기반과 동일)
6. **이미지 생성** (AI 기반 채용공고 이미지 생성)
7. **이미지 선택** (생성된 이미지 중 선택)

#### 공통 기능
- **템플릿 시스템**: 자주 사용하는 공고 정보를 템플릿으로 저장/불러오기
- **조직도 설정**: 회사 조직도를 이미지로 업로드하여 AI가 분석하여 부서 정보 자동 추출
- **AI 기능**: 
  - 업무 설명 AI 추천
  - 자격 요건 자동 생성
  - 선호 자격 자동 적용
  - 이미지 기반 채용공고 생성
- **이메일 알림**: 등록 완료 시 인사담당자에게 자동 이메일 전송

### 4. 채용공고 관리 기능

#### 공고 목록 관리
- **상태 관리**: 임시저장 ↔ 모집중 상태 변경
- **홈페이지 등록**: 버튼 클릭 시 상태 변경 (버튼 비활성화)
- **연봉 표시**: 자동으로 "만원" 단위 적용 및 천/백 단위 변환
  - 예: "4,000만원" → "4천만원"
  - 예: "4,500만원" → "4천5백만원"
  - 예: "3,000만원 ~ 5,000만원" → "3천~5천만원"

#### 상세 페이지
- **보기 모드**: 채용공고 상세 정보 조회
- **수정 모드**: 채용공고 정보 수정
- **연봉 포맷팅**: 자동으로 한국어 단위 적용

### 5. 구직자 시스템 (Client)

#### 주요 페이지
- **홈**: 메인 페이지
- **채용공고**: 전체 채용공고 목록
- **채용공고 상세**: 개별 채용공고 상세 정보
- **지원하기**: 채용공고 지원 기능
- **내 지원현황**: 지원한 공고 목록
- **면접**: 면접 일정 및 결과
- **추천**: AI 기반 맞춤 추천
- **포트폴리오**: 개인 포트폴리오 관리
- **제품/서비스**: 회사 제품/서비스 소개
- **고객센터**: 문의 및 지원
- **마이페이지**: 개인 정보 관리

## 🛠️ 설치 및 실행

### Docker를 사용한 실행 (권장)

#### 1. 전체 시스템 실행
```bash
# 전체 시스템 실행 (MongoDB, 백엔드, 프론트엔드 모두 포함)
docker-compose up
```

#### 2. 개발 환경 실행
```bash
# 프론트엔드만 실행 (개발용)
docker-compose -f docker-compose.dev.yml up
```

### 로컬 실행

#### 1. 프론트엔드 실행
```bash
# 관리자 프론트엔드
cd admin/frontend
npm install
npm start

# 구직자 프론트엔드
cd client/frontend
npm install
npm start
```

#### 2. 백엔드 실행
```bash
# 관리자 백엔드
cd admin/backend
pip install -r requirements.txt
python main.py

# 구직자 백엔드
cd client/backend
pip install -r requirements.txt
python main.py
```

## 📱 접속 정보

- **관리자 대시보드**: http://localhost:3001
- **구직자 시스템**: http://localhost:3000
- **관리자 API**: http://localhost:8001
- **구직자 API**: http://localhost:8000

## 🎨 UI/UX 특징

### 디자인 시스템
- **색상**: CSS 변수를 활용한 일관된 색상 체계
- **타이포그래피**: 가독성 높은 폰트 스택
- **간격**: 8px 기반 그리드 시스템
- **애니메이션**: Framer Motion을 활용한 부드러운 전환 효과

### 반응형 디자인
- **모바일**: 768px 이하 최적화
- **태블릿**: 768px ~ 1024px 지원
- **데스크톱**: 1024px 이상 최적화

### 접근성
- **키보드 네비게이션**: 모든 기능 키보드로 접근 가능
- **스크린 리더**: ARIA 라벨 및 시맨틱 HTML
- **색상 대비**: WCAG 2.1 AA 기준 준수

## 🤖 AI 기능

### 현재 구현된 AI 기능

#### 1. AI 채용공고등록도우미 🆕
- **개별모드**: 단계별 질문을 통한 체계적 정보 수집
- **랭그래프모드**: 자유로운 대화를 통한 정보 추출 및 자동 적용
- **실시간 정보 추출**: 부서, 직무, 인원수, 경력, 급여 등 자동 인식
- **LangGraph Agent**: 다양한 도구를 자동 선택하여 지능형 답변

#### 2. 기존 AI 기능
- **조직도 분석**: 업로드된 조직도 이미지를 AI가 분석하여 부서 정보 자동 추출
- **업무 설명 추천**: 입력된 부서와 경력에 따른 AI 추천 업무 설명
- **자격 요건 자동 생성**: 업무와 경력에 따른 자동 자격 요건 생성
- **선호 자격 자동 적용**: 분야별 일반적인 선호 자격 자동 적용
- **이미지 기반 채용공고 생성**: 입력된 정보를 바탕으로 AI가 채용공고 이미지 생성
- **이력서 분석**: Gemini API를 활용한 자동 요약 및 키워드 추출

### AI 모드별 특징

#### 개별모드 (Individual Mode)
- **체계적 입력**: 단계별 질문으로 누락 없이 정보 수집
- **실시간 검증**: 각 필드별 유효성 검사 및 피드백
- **AI 추천**: 상황에 맞는 자동 추천 기능

#### 랭그래프모드 (LangGraph Mode)
- **자유로운 대화**: 자연어로 자유롭게 정보 입력
- **지능형 추출**: AI가 대화에서 관련 정보를 자동 추출
- **실시간 적용**: 추출된 정보가 즉시 폼에 반영
- **다양한 도구**: 검색, 계산, DB 조회, 일반 대화 기능

### 향후 계획
- **실제 AI API 연동**: 현재는 시뮬레이션, 실제 AI 서비스 연동 예정
- **이메일 서비스**: 실제 이메일 전송 기능 구현
- **이미지 생성**: 실제 AI 이미지 생성 API 연동
- **고급 LangGraph 기능**: 더 정교한 Agent 시스템 구현

## 🔧 개발 환경 설정

### 필수 요구사항
- Node.js 16+
- Python 3.8+
- Docker & Docker Compose
- MongoDB (Docker로 자동 설치)

### 개발 도구
- **IDE**: VS Code 권장
- **확장 프로그램**: 
  - ESLint
  - Prettier
  - Python
  - Docker

## 📝 코드 구조

### 프론트엔드 구조
```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── EnhancedModalChatbot.js    # AI 채용공고등록도우미
│   ├── FloatingChatbot.js         # 우측 채팅창
│   └── ...
├── pages/              # 페이지 컴포넌트
│   ├── JobPostingRegistration/    # 채용공고 등록
│   │   ├── LangGraphJobRegistration.js  # 랭그래프모드
│   │   ├── TextBasedRegistration.js     # 개별모드
│   │   └── ...
│   └── ...
├── hooks/              # 커스텀 훅
├── utils/              # 유틸리티 함수
└── styles/             # 스타일 관련 파일
```

### 백엔드 구조
```
backend/
├── main.py             # FastAPI 애플리케이션
├── models/             # 데이터 모델
├── routes/             # API 라우트
├── services/           # 비즈니스 로직
│   ├── ai_matching_service.py    # AI 매칭 서비스
│   └── ...
└── utils/              # 유틸리티 함수
```

## 🚀 배포

### Docker 배포
```bash
# 프로덕션 빌드
docker-compose -f docker-compose.prod.yml up -d
```

### 환경 변수
```bash
# .env 파일 예시
DATABASE_URL=mongodb://localhost:27017/hireme
JWT_SECRET=your-secret-key
EMAIL_SERVICE=your-email-service
GOOGLE_API_KEY=your-gemini-api-key
```

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📅 업데이트 히스토리

### 2025-01-08 (최신) 🆕
#### 🚀 AI 채용공고등록도우미 시스템 출시
- **개별모드 vs 랭그래프모드 구분 시스템**:
  - 개별모드: 기존 TextBasedRegistration 컴포넌트 사용
  - 랭그래프모드: 새로운 LangGraphJobRegistration 컴포넌트 사용
  - 우측 채팅창: 두 모드 모두에서 공통으로 사용

- **랭그래프모드 기능**:
  - 자유로운 대화형 입력 방식
  - AI가 대화에서 정보를 자동 추출 (부서, 직무, 인원수, 경력, 급여 등)
  - 추출된 정보를 실시간으로 폼에 자동 적용
  - 사용자가 수동으로 정보 수정 가능
  - 토스트 메시지로 진행 상황 알림

- **LangGraph Agent 시스템**:
  - 다양한 도구를 자동으로 선택하여 답변
  - 검색, 계산, DB 조회, 일반 대화 기능
  - 지능형 대화 관리 및 컨텍스트 유지

- **기술적 구현**:
  - EnhancedModalChatbot에 `initialAIMode` prop 추가
  - LangGraphJobRegistration 컴포넌트 완전 구현
  - 이벤트 기반 모달 전환 시스템
  - Fallback 로직으로 안정성 확보

#### 🔧 시스템 안정성 개선
- **이벤트 처리 시스템 고도화**:
  - App.js에 `openLangGraphRegistration` 액션 추가
  - JobPostingRegistration에 이벤트 핸들러 구현
  - FloatingChatbot과 EnhancedModalChatbot 간 연동 최적화

- **UI/UX 개선**:
  - 모드별 차별화된 사용자 경험
  - 실시간 피드백 및 상태 표시
  - 직관적인 모드 전환 인터페이스

### 2025-01-08 (이전)
#### 🚀 AI 상세 분석 시스템 고도화
- **다면적 문서 분석**: 
  - 이력서, 자기소개서, 포트폴리오 각각에 대한 상세 분석
  - 항목별 점수(0-10) 및 구체적 피드백 제공
  - 종합 평가 및 권장사항 시스템
- **새로운 분석 기준**: 
  - 이력서: 기본정보, 직무적합성, 경력명확성, 기술스택, 프로젝트최신성, 성과지표, 가독성, 오탈자, 최신성
  - 자기소개서: 지원동기, STAR기법, 정량적성과, 직무이해도, 차별화요소, 논리구조, 키워드다양성, 문장가독성, 오탈자
  - 포트폴리오: 프로젝트개요, 기술스택, 개인기여도, 성과지표, 시각자료, 문서화수준, 직무관련성, 독창적기능, 유지보수성
- **향상된 UI/UX**: 
  - 새로운 상세 분석 모달 컴포넌트 (`DetailedAnalysisModal`)
  - 점수별 색상 구분 (우수: 초록, 보통: 노랑, 미흡: 빨강)
  - 종합 점수 및 권장사항 시각화
- **API 확장**: 
  - `/api/upload/analyze` 엔드포인트 추가
  - JSON 스키마 표준화된 분석 결과
  - 문서 타입별 분석 (`resume`, `cover_letter`, `portfolio`)

### 2025-01-07
#### 🚀 AI 기반 이력서 분석 시스템 추가
- **FastAPI + Gemini API 통합**: 
  - 새로운 업로드 라우터 (`/api/upload`) 구현
  - 파일 업로드 및 텍스트 추출 기능
  - Gemini API를 활용한 자동 요약 및 키워드 추출
- **파일 형식 지원**: 
  - PDF, DOC, DOCX, TXT 파일 업로드 지원
  - PyPDF2, python-docx 라이브러리 통합
  - 파일 크기 제한 (10MB) 및 유효성 검사
- **드래그 앤 드롭 인터페이스**: 
  - 프론트엔드에 직관적인 파일 업로드 UI 구현
  - 시각적 피드백 및 파일 타입 검증
  - 실시간 업로드 상태 표시
- **AI 분석 결과**: 
  - 일반 요약, 기술 요약, 경험 요약 3가지 타입 지원
  - 신뢰도 점수 및 처리 시간 제공
  - 핵심 키워드 자동 추출 (최대 5개)

#### 🔧 시스템 안정성 및 AI 개선
- **Docker 시스템 복구**: Docker Desktop 재설치 후 전체 프로젝트 재빌드 및 복구 완료
- **MongoDB 연결 최적화**: 
  - Admin Backend & Client Backend MongoDB 연결 설정 통일
  - Docker Compose 환경변수와 일치하도록 연결 URI 수정
  - 데이터베이스명 `hireme`로 통일
- **포트 충돌 해결**: 
  - Admin Backend: 8001 포트 고정
  - Client Backend: 8000 포트 고정
  - Dockerfile 내 포트 설정 일치 확인
- **인재 데이터 관리**: 
  - MongoDB 초기화 스크립트에 5명 샘플 인재 데이터 추가
  - 김철수, 이영희, 박민수, 정수진, 최하늘 프로필 포함
  - API를 통한 실시간 데이터 조회 기능 검증
- **AI 매칭 시스템 개선**:
  - `ai_matching_service.py` 신규 모듈 개발
  - HuggingFace `sentence-transformers` 모델 임시 비활성화 (빌드 최적화)
  - Gemini AI 챗봇 기능 유지 및 안정성 확보
  - 향상된 규칙 기반 매칭 알고리즘 적용
  - 의미적 유사도 계산 및 AI 기반 추천 이유 생성
- **시스템 검증**: 
  - 전체 API 엔드포인트 정상 작동 확인
  - Frontend-Backend 연동 테스트 완료
  - 데이터 동기화 및 실시간 업데이트 검증
  - 브라우저에서 Admin/Client 페이지 정상 실행 확인

#### 🚀 주요 기술 스택 업데이트
- **AI/ML**: Gemini 1.5 Flash 챗봇, 규칙 기반 매칭 알고리즘, AI 이력서 분석
- **Database**: MongoDB 5명 인재 데이터 with AI 프로필
- **Infrastructure**: Docker Compose 기반 마이크로서비스 아키텍처
- **API**: FastAPI RESTful 서비스 (Admin: 8001, Client: 8000)
- **File Processing**: PyPDF2, python-docx, aiofiles

#### 🔧 개발자 노트
- HuggingFace 모델은 향후 프로덕션 환경에서 재활성화 예정
- MongoDB 볼륨 데이터 보존으로 데이터 영속성 확보
- Docker 이미지 캐싱으로 빌드 시간 단축
- Gemini API 키 설정 필요 (`GOOGLE_API_KEY` 환경변수)

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.

---

**HireMe Project** - 더 나은 채용 경험을 만들어갑니다. 🚀 