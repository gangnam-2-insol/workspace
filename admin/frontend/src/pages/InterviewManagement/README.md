# 면접자 관리 (InterviewManagement)

면접자 관리 페이지는 AI 면접 시스템에서 지원자들의 면접 과정을 관리하고 평가하는 종합적인 관리 도구입니다.

## 주요 기능

### 1. 지원자 목록 관리
- **그리드 뷰 조정**: 한 줄에 2명, 4명, 6명씩 지원자 표시
- **검색 및 필터링**: 이름, 직무, 면접 상태별 검색
- **실시간 통계**: 예정/진행중/완료/취소된 면접 수 및 평균 점수

### 2. 지원자 상세 정보
- **기본 정보**: 이름, 직무, 연락처 (개인정보 마스킹 처리)
- **면접 정보**: 일시, 소요시간, 유형, 플랫폼, 상태
- **AI 면접 점수**: 종합 평가 점수 및 시각화

### 3. 문서 관리
- **이력서/포트폴리오/자기소개서** 요약 및 상세보기
- **주요 키워드** 자동 하이라이트
- **문서 없음** 안내 처리
- **모달 형태**로 전문 내용 확인

### 4. 질문 및 답변 관리
- **질문별 답변** 텍스트 요약
- **확장/축소** 기능 (긴 답변의 경우)
- **AI 분석 결과**: 표정, 목소리, 제스처 점수
- **영상 재생**: 개별 질문 영상 모달 재생

### 5. 영상 기능
- **개별 영상 재생**: 팝업/모달 형태
- **AI 분석 결과**: 표정/목소리/제스처 분석 요약
- **영상 컨트롤**: 반복 재생, 속도 조절, 메모 추가
- **일괄 다운로드**: ZIP 형태로 영상 파일 다운로드

### 6. 평가 및 피드백
- **평가 점수**: 기술력, 커뮤니케이션, 문화적합성
- **시각화**: 차트 형태로 평가 결과 표시
- **내부 메모**: 면접관 메모 기능
- **합격/불합격** 상태 관리

### 7. 피드백 전송
- **결과 선택**: 합격/불합격 버튼
- **채널 선택**: 이메일/문자 선택
- **피드백 내용**: 사용자 정의 또는 기본 메시지
- **가이드 제공**: 합격/불합격 기본 메시지 템플릿
- **전송 이력**: 전송 상태 및 시간 기록

### 8. 면접 상태 관리
- **자동 상태 전환**: 시간대별 예정됨/진행중/완료/취소됨
- **상태별 색상 구분**: 직관적인 시각적 표현
- **통계 리포트**: 상태별 통계 정보

## 컴포넌트 구조

```
InterviewManagement/
├── InterviewManagement.js    # 메인 컴포넌트
├── InterviewManagement.css   # 스타일 파일
└── README.md                # 문서
```

## 사용법

### 1. 지원자 목록 보기
- 상단의 드롭다운에서 한 줄에 표시할 지원자 수 선택 (2/4/6명)
- 검색창에서 지원자명 또는 직무로 검색
- 필터에서 면접 상태별 필터링

### 2. 지원자 상세보기
- 지원자 카드의 "상세보기" 버튼 클릭
- 기본 정보, 면접 정보, 평가 내역 확인
- 평가 차트 및 내부 메모 확인

### 3. 문서 확인
- 지원자 카드의 "상세보기" 버튼 클릭
- 이력서/포트폴리오/자기소개서 개별 확인
- 키워드 하이라이트 및 전문 내용 확인

### 4. 영상 재생
- 질문 항목 옆의 재생 버튼 클릭
- 영상 모달에서 재생 및 컨트롤
- AI 분석 결과 확인

### 5. 피드백 전송
- 지원자 카드의 "피드백" 버튼 클릭
- 합격/불합격 선택
- 전송 채널 및 내용 입력
- 기본 메시지 템플릿 활용

## 데이터 구조

### 지원자 데이터
```javascript
{
  id: number,
  name: string,
  position: string,
  email: string,
  phone: string,
  interviewDate: string,
  interviewTime: string,
  duration: string,
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled',
  type: string,
  platform: string,
  aiScore: number,
  documents: {
    resume: DocumentInfo,
    portfolio: DocumentInfo,
    coverLetter: DocumentInfo
  },
  questions: Question[],
  evaluation: Evaluation,
  feedback: Feedback
}
```

### 문서 정보
```javascript
{
  exists: boolean,
  summary: string,
  keywords: string[],
  content: string
}
```

### 질문 정보
```javascript
{
  id: number,
  question: string,
  answer: string,
  videoUrl: string,
  aiAnalysis: {
    expression: number,
    voice: number,
    gesture: number,
    summary: string
  }
}
```

### 평가 정보
```javascript
{
  technicalScore: number,
  communicationScore: number,
  cultureScore: number,
  overallScore: number,
  memo: string,
  result: 'pending' | 'pass' | 'fail'
}
```

## 스타일 특징

- **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원
- **모던 UI**: 깔끔하고 직관적인 인터페이스
- **호버 효과**: 부드러운 애니메이션 및 상호작용
- **색상 구분**: 상태별 명확한 색상 구분
- **그림자 효과**: 카드 형태의 입체적 디자인

## 기술 스택

- **React**: 컴포넌트 기반 UI 라이브러리
- **CSS3**: 모던 CSS 기능 활용
- **React Icons**: 아이콘 라이브러리
- **반응형 CSS**: Grid 및 Flexbox 활용

## 향후 개선 사항

1. **실시간 업데이트**: WebSocket을 통한 실시간 상태 업데이트
2. **고급 필터링**: 다중 조건 필터링 기능
3. **엑셀/CSV 내보내기**: 데이터 내보내기 기능
4. **접근 권한 관리**: 역할별 기능 제한
5. **알림 시스템**: 면접 일정 알림 기능
6. **AI 분석 강화**: 더 상세한 AI 분석 결과 제공 