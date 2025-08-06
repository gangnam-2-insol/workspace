# HireMe - AI 기반 채용 관리 플랫폼

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

인공지능을 활용한 스마트한 채용 프로세스 관리 시스템

[문서 보기](https://github.com/your-username/hireme_project) •
[데모 보기](https://github.com/your-username/hireme_project) •
[버그 신고](https://github.com/your-username/hireme_project/issues/new) •
[기능 요청](https://github.com/your-username/hireme_project/issues/new)

## 목차

- [프로젝트 소개](#about-the-project)
  - [사용 기술](#built-with)
- [시작하기](#getting-started)
  - [사전 요구사항](#prerequisites)
  - [설치 방법](#installation)
- [사용법](#usage)
- [주요 기능](#features)
- [AI 챗봇 기능](#ai-chatbot)
- [아키텍처](#architecture)
- [로드맵](#roadmap)
- [기여하기](#contributing)
- [라이선스](#license)
- [연락처](#contact)

## About The Project

HireMe는 인공지능을 활용한 혁신적인 채용 관리 플랫폼입니다. 기존의 복잡하고 시간이 많이 소요되는 채용 프로세스를 AI 기술로 간소화하여, HR 담당자와 채용 매니저가 더 효율적으로 인재를 발굴하고 관리할 수 있도록 도와줍니다.

### 주요 특징:
- 🤖 **AI 기반 채용공고 작성**: 자연어 처리를 통한 스마트한 채용공고 생성
- 📊 **데이터 기반 인재 추천**: 기업 요구사항과 후보자 프로필을 매칭하는 AI 추천 시스템
- 📝 **자동화된 이력서 분석**: AI가 이력서를 분석하여 핵심 정보를 추출
- 🎯 **맞춤형 포트폴리오 분석**: 지원자의 포트폴리오를 AI가 분석하여 적합성 평가
- 📋 **스마트 면접 관리**: 면접 일정 관리 및 AI 면접 질문 생성
- 📧 **자동 커버레터 검증**: 지원자의 자기소개서를 AI가 검토하고 피드백 제공

### Built With

이 프로젝트는 다음과 같은 기술 스택으로 구성되어 있습니다:

- [![React][React.js]][React-url] - 프론트엔드 프레임워크
- [![Node.js][Node.js]][Node-url] - 백엔드 런타임
- [![Python][Python]][Python-url] - AI/ML 백엔드
- [![MongoDB][MongoDB]][MongoDB-url] - 데이터베이스
- [![Docker][Docker]][Docker-url] - 컨테이너화
- [![FastAPI][FastAPI]][FastAPI-url] - API 프레임워크

## Getting Started

로컬 환경에서 프로젝트를 실행하는 방법을 안내합니다.

### Prerequisites

다음 소프트웨어들이 필요합니다:
- Node.js (v16 이상)
- Python (v3.8 이상)
- Docker & Docker Compose
- Git

### Installation

1. 저장소 클론
   ```sh
   git clone https://github.com/your-username/hireme_project.git
   cd hireme_project
   ```

2. 환경 변수 설정
   ```sh
   # client/.env 파일 생성
   cp client/backend/env_example.txt client/backend/.env
   
   # admin/.env 파일 생성
   cp admin/backend/env_example.txt admin/backend/.env
   ```

3. Docker Compose로 전체 서비스 실행
   ```sh
   # 클라이언트 서비스 실행
   cd client
   docker-compose up -d
   
   # 관리자 서비스 실행
   cd ../admin
   docker-compose up -d
   ```

4. 개별 서비스 실행 (선택사항)
   ```sh
   # 클라이언트 프론트엔드
   cd client/frontend
   npm install
   npm start
   
   # 클라이언트 백엔드
   cd client/backend
   pip install -r requirements.txt
   python main.py
   
   # 관리자 프론트엔드
   cd admin/frontend
   npm install
   npm start
   
   # 관리자 백엔드
   cd admin/backend
   pip install -r requirements.txt
   python main.py
   ```

5. 브라우저에서 접속
   - 클라이언트: http://localhost:3000
   - 관리자: http://localhost:8000

## Usage

### 클라이언트 (구직자)
1. **회원가입/로그인**: 개인 계정 생성
2. **이력서 작성**: AI 도움을 받아 이력서 작성
3. **포트폴리오 업로드**: 프로젝트 포트폴리오 등록
4. **채용공고 탐색**: AI 추천 기반 맞춤 채용공고 검색
5. **지원서 제출**: AI 검토를 통한 최적화된 지원서 제출

### 관리자 (HR/채용담당자)
1. **채용공고 작성**: AI 어시스턴트를 통한 스마트 채용공고 생성
2. **지원자 관리**: 지원자 이력서 및 포트폴리오 AI 분석
3. **면접 관리**: 면접 일정 및 질문 자동화
4. **인재 추천**: AI 기반 최적 인재 매칭

## Features

### 🤖 AI 채용공고 어시스턴트
- 자연어 처리를 통한 스마트 채용공고 작성
- 부서별 맞춤형 템플릿 제공
- 실시간 피드백 및 개선 제안

### 📊 AI 인재 추천 시스템
- 기업 요구사항과 후보자 프로필 매칭
- 머신러닝 기반 적합도 점수 계산
- 지속적인 학습을 통한 추천 정확도 향상

### 📝 자동화된 이력서 분석
- AI가 이력서에서 핵심 정보 추출
- 기술 스택 및 경험 자동 분석
- 객관적인 평가 기준 제공

### 🎯 포트폴리오 AI 분석
- 프로젝트 포트폴리오 자동 분석
- 기술력 및 창의성 평가
- 시각적 요소 및 사용자 경험 분석

### 📋 스마트 면접 관리
- 면접 일정 자동 관리
- AI 면접 질문 생성
- 면접 결과 분석 및 피드백

### 📧 커버레터 AI 검증
- 자기소개서 내용 분석
- 문법 및 표현 개선 제안
- 경쟁력 있는 내용으로 최적화

## AI 챗봇 기능

### 🤖 AI 채용공고 작성 도우미

AI 채용공고 작성 도우미는 자연스러운 대화를 통해 채용공고를 작성할 수 있는 스마트 AI 어시스턴트입니다.

#### 주요 기능:
- **자연스러운 대화형 인터페이스**: 일반적인 대화로 채용공고 작성
- **문맥 이해**: 이전 대화 내용을 기억하고 연속성 있는 대화 지원
- **실시간 응답**: 즉시 피드백과 제안 제공
- **LLM 수준의 지능적 대화**: 사용자의 질문에 답변하고 맥락을 이해하여 적절한 응답 생성

#### 지원하는 채용공고 필드:
- **구인부서**: 개발팀, 마케팅팀, 디자인팀 등 세부 분야 추천
- **채용인원**: 1명, 2명, 3명 등 규모별 맞춤 안내
- **주요업무**: 구체적인 업무 내용 작성 가이드
- **근무시간**: 유연근무, 재택근무 등 다양한 근무 형태 지원
- **근무위치**: 서울, 지방, 원격근무 등 위치별 안내
- **급여조건**: 협의, 구체적 금액 등 다양한 급여 형태 지원
- **마감일**: 채용시, 구체적 날짜 등 유연한 마감일 설정
- **연락처**: 담당자 이메일 등 연락처 정보 입력

#### 사용 방법:
1. 관리자 대시보드 접속 (http://localhost:8000)
2. 채용공고 등록 페이지로 이동
3. AI 도우미 버튼 클릭
4. 자연스러운 대화로 채용공고 작성 시작

#### 대화 예시:
```
사용자: "개발자 채용공고 작성해줘"
AI: "개발팀이시군요! 🚀

개발팀은 보통 프론트엔드, 백엔드, 풀스택으로 나뉘는데요. 
어떤 개발 분야를 찾고 계신가요?

• 프론트엔드: React, Vue.js, Angular
• 백엔드: Java, Python, Node.js
• 풀스택: 전체 개발 가능
• 모바일: iOS, Android

어떤 기술 스택을 사용하실 예정인가요?"

사용자: "프론트엔드 개발자"
AI: "✅ "프론트엔드 개발자" 부서로 등록되었습니다!

이제 채용 인원에 대해 알려주세요."
```

### 📁 관련 파일 목록

#### 채용공고 관련 파일:
- `admin/frontend/src/components/EnhancedModalChatbot.js` - 메인 AI 도우미 컴포넌트
- `admin/frontend/src/components/FloatingChatbot.js` - 플로팅 챗봇
- `admin/backend/chatbot_router.py` - AI 챗봇 API 라우터
- `client/backend/chatbot_router.py` - 클라이언트 챗봇 API
- `client/README.md` - 클라이언트 README (챗봇 기능 포함)

#### 챗봇 관련 파일:
- `admin/backend/chatbot_router.py` - 관리자 챗봇 백엔드
- `client/backend/chatbot_router.py` - 클라이언트 챗봇 백엔드
- `admin/frontend/src/components/EnhancedModalChatbot.js` - AI 채용공고 작성 도우미
- `admin/frontend/src/components/FloatingChatbot.js` - 플로팅 챗봇 UI
- `client/README.md` - 클라이언트 챗봇 기능 문서

### 🔧 기술적 특징

#### 백엔드 API 연동
- **FastAPI 기반**: 고성능 Python 웹 프레임워크 사용
- **실시간 통신**: WebSocket을 통한 실시간 대화 지원
- **세션 관리**: 사용자별 대화 세션 유지
- **에러 처리**: API 실패 시 로컬 응답으로 대체

#### 프론트엔드 구현
- **React 18**: 최신 React 기능 활용
- **Styled Components**: 컴포넌트 기반 스타일링
- **Context API**: 상태 관리
- **실시간 업데이트**: 즉시 UI 반영

#### AI 응답 생성
- **의도 분석**: 6가지 의도 분류 (질문, 요청, 확인, 명확화, 저장, 내보내기)
- **문맥 이해**: 최근 5개 대화 기억
- **필드별 특화**: 각 필드에 맞는 전문적인 응답 생성
- **추천 시스템**: 사용자 입력에 따른 맞춤 추천
- **맥락 기반 지능적 대화**: 사용자의 질문에 답변하고 문맥을 이해하여 적절한 응답 생성
- **감정 인식**: 사용자의 긍정/부정 표현에 대한 공감적 응답
- **사용자 의도 분석**: 질문, 명령어, 명확화 요청, 필드 입력 등을 자동 감지

## Architecture

```
hireme_project/
├── client/                 # 구직자용 클라이언트
│   ├── frontend/          # React 프론트엔드
│   ├── backend/           # Python FastAPI 백엔드
│   └── database/          # MongoDB 데이터베이스
├── admin/                 # 관리자용 대시보드
│   ├── frontend/          # React 관리자 UI
│   ├── backend/           # Python 관리자 API
│   └── database/          # 관리자 데이터베이스
└── hireme/               # Python 가상환경
```

### 기술 스택 상세
- **프론트엔드**: React, TypeScript, Styled Components
- **백엔드**: Python FastAPI, MongoDB
- **AI/ML**: Google Generative AI, 자연어 처리
- **인프라**: Docker, Docker Compose
- **데이터베이스**: MongoDB (NoSQL)

## Roadmap

- [x] 기본 채용공고 작성 기능
- [x] AI 이력서 분석 시스템
- [x] 포트폴리오 분석 기능
- [x] 면접 관리 시스템
- [x] 커버레터 검증 기능
- [x] AI 챗봇 기반 채용공고 작성
- [ ] 실시간 채팅 지원
- [ ] 모바일 앱 개발
- [ ] 다국어 지원 (영어, 중국어)
- [ ] 고급 AI 분석 기능
- [ ] 블록체인 기반 이력서 검증

## Contributing

프로젝트에 기여하고 싶으시다면 매우 환영합니다! 

1. 프로젝트를 Fork 합니다
2. 기능 브랜치를 생성합니다 (`git checkout -b feature/AmazingFeature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/AmazingFeature`)
5. Pull Request를 생성합니다

### 주요 기여자:

<a href="https://github.com/your-username/hireme_project/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=your-username/hireme_project" alt="contrib.rocks image" />
</a>

## License

MIT License 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## Contact

프로젝트 관리자 - [@your_twitter](https://twitter.com/your_username) - email@example.com

프로젝트 링크: [https://github.com/your-username/hireme_project](https://github.com/your-username/hireme_project)

## 링크 및 이미지
[contributors-shield]: https://img.shields.io/github/contributors/your-username/hireme_project.svg?style=for-the-badge
[contributors-url]: https://github.com/your-username/hireme_project/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/your-username/hireme_project.svg?style=for-the-badge
[forks-url]: https://github.com/your-username/hireme_project/network/members
[stars-shield]: https://img.shields.io/github/stars/your-username/hireme_project.svg?style=for-the-badge
[stars-url]: https://github.com/your-username/hireme_project/stargazers
[issues-shield]: https://img.shields.io/github/issues/your-username/hireme_project.svg?style=for-the-badge
[issues-url]: https://github.com/your-username/hireme_project/issues
[license-shield]: https://img.shields.io/github/license/your-username/hireme_project.svg?style=for-the-badge
[license-url]: https://github.com/your-username/hireme_project/blob/master/LICENSE
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/your-username
[product-screenshot]: https://via.placeholder.com/800x400/667eea/ffffff?text=HireMe+Screenshot
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[Node.js]: https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white
[Node-url]: https://nodejs.org/
[Python]: https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white
[Python-url]: https://python.org/
[MongoDB]: https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white
[MongoDB-url]: https://mongodb.com/
[Docker]: https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white
[Docker-url]: https://docker.com/
[FastAPI]: https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white
[FastAPI-url]: https://fastapi.tiangolo.com/
