import React, { useState, useEffect, useRef } from 'react';
import './InterviewManagement.css';
import InterviewCalendarView from './components/InterviewCalendarView';
import CalendarScheduleModal from './components/CalendarScheduleModal';
import { 
  FiVideo, 
  FiCalendar, 
  FiClock, 
  FiUser, 
  FiSettings,
  FiPlay,
  FiPause,
  FiEye,
  FiDownload,
  FiMessageSquare,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiFileText,
  FiMail,
  FiPhone,
  FiStar,
  FiFilter,
  FiSearch,
  FiExternalLink,
  FiVolume2,
  FiVolumeX,
  FiMaximize,
  FiMinimize,
  FiRotateCcw,
  FiEdit3,
  FiSend,
  FiArchive,
  FiBarChart3,
  FiList
} from 'react-icons/fi';

// 지원자 데이터 샘플
const applicantsData = [
  {
    id: 1,
    name: '김철수',
    position: '프론트엔드 개발자',
    email: 'kim***@gmail.com',
    phone: '010-****-1234',
    interviewDate: '2024-01-20',
    interviewTime: '14:00',
    duration: '60분',
    status: 'scheduled',
    type: '비대면',
    platform: 'Zoom',
    aiScore: 85,
    documents: {
      resume: {
        exists: true,
        summary: 'React, TypeScript, Next.js 경험 풍부. 3년간 프론트엔드 개발 경력. 주요 프로젝트: 이커머스 플랫폼 구축, 관리자 대시보드 개발.',
        keywords: ['React', 'TypeScript', 'Next.js', 'Redux', 'Tailwind CSS'],
        content: '상세 이력서 내용...'
      },
      portfolio: {
        exists: true,
        summary: 'GitHub에 15개 이상의 프로젝트 포트폴리오 보유. 반응형 웹 디자인, PWA 개발 경험.',
        keywords: ['GitHub', 'PWA', '반응형', 'UI/UX'],
        content: '포트폴리오 상세 내용...'
      },
      coverLetter: {
        exists: false,
        summary: '',
        keywords: [],
        content: ''
      }
    },
    questions: [
      {
        id: 1,
        question: 'React와 Vue.js의 차이점에 대해 설명해주세요',
        answer: 'React는 컴포넌트 기반 라이브러리이고, Vue.js는 프레임워크입니다. React는 JSX를 사용하고, Vue는 템플릿 문법을 사용합니다.',
        videoUrl: '/videos/interview1_q1.mp4',
        aiAnalysis: {
          expression: 85,
          voice: 90,
          gesture: 78,
          summary: '자신감 있게 답변하며, 적절한 제스처를 사용했습니다.'
        }
      },
      {
        id: 2,
        question: '상태 관리 라이브러리 사용 경험을 말씀해주세요',
        answer: 'Redux와 Zustand를 사용한 경험이 있습니다. Redux는 큰 규모의 프로젝트에서, Zustand는 작은 프로젝트에서 주로 사용했습니다.',
        videoUrl: '/videos/interview1_q2.mp4',
        aiAnalysis: {
          expression: 88,
          voice: 85,
          gesture: 82,
          summary: '구체적인 경험을 바탕으로 한 답변으로 신뢰도가 높습니다.'
        }
      }
    ],
    evaluation: {
      technicalScore: 85,
      communicationScore: 88,
      cultureScore: 82,
      overallScore: 85,
      memo: '기술적 이해도가 높고, 커뮤니케이션 능력도 우수합니다.',
      result: 'pending' // pending, pass, fail
    },
    feedback: {
      sent: false,
      content: '',
      channel: 'email',
      sentAt: null
    }
  },
  {
    id: 2,
    name: '이영희',
    position: '백엔드 개발자',
    email: 'lee***@naver.com',
    phone: '010-****-5678',
    interviewDate: '2024-01-19',
    interviewTime: '15:30',
    duration: '90분',
    status: 'completed',
    type: '대면',
    platform: '회사 면접실',
    aiScore: 92,
    documents: {
      resume: {
        exists: true,
        summary: 'Java, Spring Boot, MySQL 경험 5년. 마이크로서비스 아키텍처 설계 및 구축 경험.',
        keywords: ['Java', 'Spring Boot', 'MySQL', '마이크로서비스', 'Docker'],
        content: '상세 이력서 내용...'
      },
      portfolio: {
        exists: true,
        summary: 'GitHub에 20개 이상의 백엔드 프로젝트. API 설계, 데이터베이스 최적화 경험.',
        keywords: ['API 설계', 'DB 최적화', 'GitHub', 'RESTful'],
        content: '포트폴리오 상세 내용...'
      },
      coverLetter: {
        exists: true,
        summary: '백엔드 개발자로서의 성장 과정과 목표를 명확히 제시.',
        keywords: ['성장', '목표', '기술 발전'],
        content: '자기소개서 상세 내용...'
      }
    },
    questions: [
      {
        id: 1,
        question: '마이크로서비스 아키텍처 설계 경험을 말씀해주세요',
        answer: '이전 회사에서 마이크로서비스로 전환한 경험이 있습니다. Spring Cloud를 사용하여 서비스 디스커버리, 로드 밸런싱을 구현했습니다.',
        videoUrl: '/videos/interview2_q1.mp4',
        aiAnalysis: {
          expression: 92,
          voice: 88,
          gesture: 85,
          summary: '자신감 있고 전문적인 답변으로 높은 평가를 받았습니다.'
        }
      }
    ],
    evaluation: {
      technicalScore: 95,
      communicationScore: 88,
      cultureScore: 85,
      overallScore: 92,
      memo: '기술력이 뛰어나고 시스템 설계 경험이 풍부합니다.',
      result: 'pass'
    },
    feedback: {
      sent: true,
      content: '축하드립니다! 합격하셨습니다. 다음 단계 일정은 별도로 안내드리겠습니다.',
      channel: 'email',
      sentAt: '2024-01-19 17:30'
    }
  },
  {
    id: 3,
    name: '박민수',
    position: 'UI/UX 디자이너',
    email: 'park***@daum.net',
    phone: '010-****-9012',
    interviewDate: '2024-01-21',
    interviewTime: '10:00',
    duration: '60분',
    status: 'in-progress',
    type: '비대면',
    platform: 'Teams',
    aiScore: 78,
    documents: {
      resume: {
        exists: true,
        summary: 'Figma, Adobe XD 사용 3년. 웹/앱 디자인 경험. 사용자 리서치 및 프로토타이핑 경험.',
        keywords: ['Figma', 'Adobe XD', 'UI/UX', '프로토타이핑', '사용자 리서치'],
        content: '상세 이력서 내용...'
      },
      portfolio: {
        exists: true,
        summary: 'Behance에 12개 프로젝트. 모바일 앱, 웹사이트 디자인 포트폴리오.',
        keywords: ['Behance', '모바일 앱', '웹사이트', '디자인 시스템'],
        content: '포트폴리오 상세 내용...'
      },
      coverLetter: {
        exists: false,
        summary: '',
        keywords: [],
        content: ''
      }
    },
    questions: [
      {
        id: 1,
        question: '디자인 시스템 구축 경험을 말씀해주세요',
        answer: '이전 프로젝트에서 디자인 시스템을 구축한 경험이 있습니다. 컴포넌트 라이브러리를 만들어 팀 전체의 디자인 일관성을 유지했습니다.',
        videoUrl: '/videos/interview3_q1.mp4',
        aiAnalysis: {
          expression: 75,
          voice: 80,
          gesture: 70,
          summary: '답변은 적절하지만 다소 긴장한 모습을 보입니다.'
        }
      }
    ],
    evaluation: {
      technicalScore: 80,
      communicationScore: 75,
      cultureScore: 78,
      overallScore: 78,
      memo: '디자인 감각은 좋지만 커뮤니케이션에서 개선이 필요합니다.',
      result: 'pending'
    },
    feedback: {
      sent: false,
      content: '',
      channel: 'email',
      sentAt: null
    }
  },
  {
    id: 4,
    name: '최지영',
    position: '데이터 분석가',
    email: 'choi***@gmail.com',
    phone: '010-****-3456',
    interviewDate: '2024-01-22',
    interviewTime: '16:00',
    duration: '60분',
    status: 'scheduled',
    type: '비대면',
    platform: 'Zoom',
    aiScore: 0,
    documents: {
      resume: {
        exists: true,
        summary: 'Python, R, SQL 사용 4년. 머신러닝, 통계 분석 경험. 대시보드 구축 경험.',
        keywords: ['Python', 'R', 'SQL', '머신러닝', '통계 분석'],
        content: '상세 이력서 내용...'
      },
      portfolio: {
        exists: false,
        summary: '',
        keywords: [],
        content: ''
      },
      coverLetter: {
        exists: true,
        summary: '데이터 기반 의사결정의 중요성과 본인의 역할에 대한 명확한 비전 제시.',
        keywords: ['데이터 기반', '의사결정', '비전'],
        content: '자기소개서 상세 내용...'
      }
    },
    questions: [],
    evaluation: {
      technicalScore: 0,
      communicationScore: 0,
      cultureScore: 0,
      overallScore: 0,
      memo: '',
      result: 'pending'
    },
    feedback: {
      sent: false,
      content: '',
      channel: 'email',
      sentAt: null
    }
  }
];

const InterviewManagement = () => {
  // 로컬 스토리지에서 데이터 로드
  const loadApplicantsFromStorage = () => {
    try {
      const saved = localStorage.getItem('interviewManagement_applicants');
      return saved ? JSON.parse(saved) : applicantsData;
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
      return applicantsData;
    }
  };

  // 상태 관리
  const [applicants, setApplicants] = useState(loadApplicantsFromStorage);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [applicantsPerRow, setApplicantsPerRow] = useState(4);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedAnswers, setExpandedAnswers] = useState({});
  const [contentWidth, setContentWidth] = useState(0);
  const contentRef = useRef(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    position: '',
    email: '',
    phone: '',
    interviewDate: '',
    interviewTime: '',
    duration: '60분',
    type: '비대면',
    platform: 'Zoom'
  });
  const [notifications, setNotifications] = useState([]);
  
  // 캘린더 관련 상태
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'calendar'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCalendarScheduleModalOpen, setIsCalendarScheduleModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  // 콘텐츠 영역 크기 변경 감지
  useEffect(() => {
    const handleResize = () => {
      if (contentRef.current) {
        setContentWidth(contentRef.current.offsetWidth);
      }
    };

    // 초기 크기 설정
    handleResize();

    // ResizeObserver 사용 (더 정확한 크기 감지)
    const resizeObserver = new ResizeObserver(handleResize);
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    // 윈도우 리사이즈도 감지
    window.addEventListener('resize', handleResize);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 콘텐츠 영역 크기에 따른 자동 그리드 조정
  useEffect(() => {
    let newGridSize = 4; // 기본값
    
    if (contentWidth < 600) {
      newGridSize = 1; // 매우 작은 영역: 1명
    } else if (contentWidth < 900) {
      newGridSize = 2; // 작은 영역: 2명
    } else if (contentWidth < 1100) {
      newGridSize = 3; // 중간 영역: 3명
    } else {
      newGridSize = 4; // 큰 영역: 4명
    }
    
    setApplicantsPerRow(newGridSize);
  }, [contentWidth]);

  // 키보드 단축키 처리
  useEffect(() => {
    const handleKeyDown = (event) => {
      // ESC 키로 모달 닫기
      if (event.key === 'Escape') {
        if (isDetailModalOpen) {
          setIsDetailModalOpen(false);
          setSelectedApplicant(null);
        } else if (isVideoModalOpen) {
          setIsVideoModalOpen(false);
          setSelectedVideo(null);
        } else if (isDocumentModalOpen) {
          setIsDocumentModalOpen(false);
          setSelectedDocument(null);
        } else if (isFeedbackModalOpen) {
          setIsFeedbackModalOpen(false);
          setSelectedApplicant(null);
        }
      }
      
      // Ctrl + F로 검색창 포커스
      if (event.ctrlKey && event.key === 'f') {
        event.preventDefault();
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDetailModalOpen, isVideoModalOpen, isDocumentModalOpen, isFeedbackModalOpen]);

  // 데이터 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    try {
      localStorage.setItem('interviewManagement_applicants', JSON.stringify(applicants));
    } catch (error) {
      console.error('Failed to save data to localStorage:', error);
    }
  }, [applicants]);

  // 통계 계산
  const stats = {
    scheduled: applicants.filter(a => a.status === 'scheduled').length,
    inProgress: applicants.filter(a => a.status === 'in-progress').length,
    completed: applicants.filter(a => a.status === 'completed').length,
    cancelled: applicants.filter(a => a.status === 'cancelled').length,
    averageScore: Math.round(applicants.filter(a => a.aiScore > 0).reduce((sum, a) => sum + a.aiScore, 0) / applicants.filter(a => a.aiScore > 0).length) || 0
  };

  // 필터링된 지원자 목록
  const filteredApplicants = applicants.filter(applicant => {
    const matchesSearch = applicant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         applicant.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || applicant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 답변 확장/축소 토글
  const toggleAnswerExpansion = (applicantId, questionId) => {
    setExpandedAnswers(prev => ({
      ...prev,
      [`${applicantId}-${questionId}`]: !prev[`${applicantId}-${questionId}`]
    }));
  };

  // 영상 재생 상태
  const [videoError, setVideoError] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const videoRef = useRef(null);

  // 영상 재생
  const playVideo = (video) => {
    setSelectedVideo(video);
    setVideoError(null);
    setVideoLoading(true);
    setIsVideoModalOpen(true);
  };

  // 비디오 로드 완료 처리
  const handleVideoLoad = () => {
    setVideoLoading(false);
  };

  // 비디오 에러 처리
  const handleVideoError = () => {
    setVideoLoading(false);
    setVideoError('비디오를 로드할 수 없습니다.');
  };

  // 문서 상세보기
  const viewDocument = (document) => {
    setSelectedDocument(document);
    setIsDocumentModalOpen(true);
  };

  // 피드백 모달 열기
  const openFeedbackModal = (applicant) => {
    setSelectedApplicant(applicant);
    setIsFeedbackModalOpen(true);
  };

  // 피드백 전송
  const sendFeedback = (applicantId, feedbackData) => {
    // 유효성 검사
    if (!feedbackData.content.trim()) {
      showNotification('피드백 내용을 입력해주세요.', 'error');
      return;
    }

    if (!feedbackData.channel) {
      showNotification('전송 채널을 선택해주세요.', 'error');
      return;
    }

    // 결과가 선택되지 않은 경우
    const applicant = applicants.find(a => a.id === applicantId);
    if (applicant && applicant.evaluation.result === 'pending') {
      showNotification('합격/불합격 결과를 먼저 선택해주세요.', 'error');
      return;
    }

    setApplicants(prev => prev.map(applicant => 
      applicant.id === applicantId 
        ? { ...applicant, feedback: { ...feedbackData, sent: true, sentAt: new Date().toLocaleString('ko-KR') } }
        : applicant
    ));
    setIsFeedbackModalOpen(false);
    setSelectedApplicant(null);
    showNotification('피드백이 성공적으로 전송되었습니다.');
  };

  // ZIP 다운로드 기능
  const downloadApplicantFiles = async (applicant) => {
    try {
      // JSZip 라이브러리가 없는 경우 간단한 다운로드 구현
      const files = [];
      
      // 비디오 파일들 수집
      applicant.questions.forEach((question, index) => {
        if (question.videoUrl) {
          files.push({
            name: `${applicant.name}_질문${question.id}_답변.mp4`,
            url: question.videoUrl
          });
        }
      });

      // 문서 파일들 (실제로는 PDF나 DOC 파일이어야 함)
      if (applicant.documents.resume.exists) {
        files.push({
          name: `${applicant.name}_이력서.txt`,
          content: applicant.documents.resume.content
        });
      }
      if (applicant.documents.portfolio.exists) {
        files.push({
          name: `${applicant.name}_포트폴리오.txt`,
          content: applicant.documents.portfolio.content
        });
      }
      if (applicant.documents.coverLetter.exists) {
        files.push({
          name: `${applicant.name}_자기소개서.txt`,
          content: applicant.documents.coverLetter.content
        });
      }

      // 간단한 다운로드 구현 (실제로는 ZIP 라이브러리 사용 권장)
      if (files.length === 0) {
        showNotification('다운로드할 파일이 없습니다.', 'warning');
        return;
      }

      // 첫 번째 파일만 다운로드 (데모용)
      const firstFile = files[0];
      if (firstFile.content) {
        // 텍스트 파일 다운로드
        const blob = new Blob([firstFile.content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = firstFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else if (firstFile.url) {
        // 비디오 파일 다운로드
        const a = document.createElement('a');
        a.href = firstFile.url;
        a.download = firstFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      showNotification(`${files.length}개 파일 중 첫 번째 파일이 다운로드되었습니다.`, 'info');
    } catch (error) {
      console.error('다운로드 오류:', error);
      showNotification('파일 다운로드 중 오류가 발생했습니다.', 'error');
    }
  };

  // 합격/불합격 처리
  const updateResult = (applicantId, result) => {
    setApplicants(prev => prev.map(applicant => 
      applicant.id === applicantId 
        ? { ...applicant, evaluation: { ...applicant.evaluation, result } }
        : applicant
    ));
  };

  // 알림 시스템
  const showNotification = (message, type = 'success') => {
    const id = Date.now();
    const notification = { id, message, type };
    setNotifications(prev => [...prev, notification]);
    
    // 3초 후 자동 제거
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // 데이터 초기화 (개발용)
  const resetData = () => {
    if (window.confirm('모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      localStorage.removeItem('interviewManagement_applicants');
      setApplicants(applicantsData);
      showNotification('데이터가 초기화되었습니다.', 'info');
    }
  };

  // 면접 일정 등록
  const createSchedule = () => {
    // 유효성 검사
    if (!newSchedule.name.trim()) {
      showNotification('지원자 이름을 입력해주세요.', 'error');
      return;
    }
    if (!newSchedule.position.trim()) {
      showNotification('지원 직무를 입력해주세요.', 'error');
      return;
    }
    if (!newSchedule.email.trim()) {
      showNotification('이메일을 입력해주세요.', 'error');
      return;
    }
    if (!newSchedule.phone.trim()) {
      showNotification('연락처를 입력해주세요.', 'error');
      return;
    }
    if (!newSchedule.interviewDate) {
      showNotification('면접 날짜를 선택해주세요.', 'error');
      return;
    }
    if (!newSchedule.interviewTime) {
      showNotification('면접 시간을 선택해주세요.', 'error');
      return;
    }

    // 새 지원자 생성
    const newApplicant = {
      id: Math.max(...applicants.map(a => a.id)) + 1,
      name: newSchedule.name,
      position: newSchedule.position,
      email: newSchedule.email,
      phone: newSchedule.phone,
      interviewDate: newSchedule.interviewDate,
      interviewTime: newSchedule.interviewTime,
      duration: newSchedule.duration,
      status: 'scheduled',
      type: newSchedule.type,
      platform: newSchedule.platform,
      aiScore: 0,
      documents: {
        resume: { exists: false, summary: '', keywords: [], content: '' },
        portfolio: { exists: false, summary: '', keywords: [], content: '' },
        coverLetter: { exists: false, summary: '', keywords: [], content: '' }
      },
      questions: [],
      evaluation: {
        technicalScore: 0,
        communicationScore: 0,
        cultureScore: 0,
        overallScore: 0,
        memo: '',
        result: 'pending'
      },
      feedback: {
        sent: false,
        content: '',
        channel: 'email',
        sentAt: null
      }
    };

    setApplicants(prev => [...prev, newApplicant]);
    setIsScheduleModalOpen(false);
    // 폼 초기화
    setNewSchedule({
      name: '',
      position: '',
      email: '',
      phone: '',
      interviewDate: '',
      interviewTime: '',
      duration: '60분',
      type: '비대면',
      platform: 'Zoom'
    });
    showNotification('면접 일정이 성공적으로 등록되었습니다.');
  };

  // 개인정보 마스킹
  const maskPersonalInfo = (text) => {
    if (!text) return '';
    return text.replace(/(\d{3})-(\d{4})-(\d{4})/, '$1-****-$3')
               .replace(/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/, '$1***@$2');
  };

  // 상태 텍스트 변환
const getStatusText = (status) => {
  const statusMap = {
    scheduled: '예정됨',
      'in-progress': '진행중',
    completed: '완료',
    cancelled: '취소됨'
  };
  return statusMap[status] || status;
};

  // 결과 텍스트 변환
  const getResultText = (result) => {
    const resultMap = {
      pending: '대기중',
      pass: '합격',
      fail: '불합격'
    };
    return resultMap[result] || result;
  };

  // 캘린더 관련 함수들
  const getInterviewsForDate = (dateStr) => {
    return applicants.filter(applicant => applicant.interviewDate === dateStr);
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const openCalendarScheduleModal = (dateStr) => {
    setSelectedDate(dateStr);
    setNewSchedule(prev => ({ ...prev, interviewDate: dateStr }));
    setIsCalendarScheduleModalOpen(true);
  };

  const createCalendarSchedule = () => {
    // 유효성 검사
    if (!newSchedule.name.trim()) {
      showNotification('지원자 이름을 입력해주세요.', 'error');
      return;
    }
    if (!newSchedule.position.trim()) {
      showNotification('지원 직무를 입력해주세요.', 'error');
      return;
    }
    if (!newSchedule.email.trim()) {
      showNotification('이메일을 입력해주세요.', 'error');
      return;
    }
    if (!newSchedule.phone.trim()) {
      showNotification('연락처를 입력해주세요.', 'error');
      return;
    }
    if (!newSchedule.interviewTime) {
      showNotification('면접 시간을 선택해주세요.', 'error');
      return;
    }

    // 새 지원자 생성
    const newApplicant = {
      id: Math.max(...applicants.map(a => a.id)) + 1,
      name: newSchedule.name,
      position: newSchedule.position,
      email: newSchedule.email,
      phone: newSchedule.phone,
      interviewDate: newSchedule.interviewDate,
      interviewTime: newSchedule.interviewTime,
      duration: newSchedule.duration,
      status: 'scheduled',
      type: newSchedule.type,
      platform: newSchedule.platform,
      aiScore: 0,
      documents: {
        resume: { exists: false, summary: '', keywords: [], content: '' },
        portfolio: { exists: false, summary: '', keywords: [], content: '' },
        coverLetter: { exists: false, summary: '', keywords: [], content: '' }
      },
      questions: [],
      evaluation: {
        technicalScore: 0,
        communicationScore: 0,
        cultureScore: 0,
        overallScore: 0,
        memo: '',
        result: 'pending'
      },
      feedback: {
        sent: false,
        content: '',
        channel: 'email',
        sentAt: null
      }
    };

    setApplicants(prev => [...prev, newApplicant]);
    setIsCalendarScheduleModalOpen(false);
    // 폼 초기화
    setNewSchedule({
      name: '',
      position: '',
      email: '',
      phone: '',
      interviewDate: '',
      interviewTime: '',
      duration: '60분',
      type: '비대면',
      platform: 'Zoom'
    });
    setSelectedDate('');
    showNotification('면접 일정이 성공적으로 등록되었습니다.');
  };

  return (
    <div className="interview-management" ref={contentRef}>
      {/* 알림 토스트 */}
      <div className="notifications">
        {notifications.map((notification) => (
          <div 
            key={notification.id}
            className={`notification ${notification.type}`}
            onClick={() => removeNotification(notification.id)}
          >
            <div className="notification-content">
              {notification.type === 'success' && <FiCheckCircle />}
              {notification.type === 'error' && <FiAlertCircle />}
              {notification.type === 'warning' && <FiAlertCircle />}
              {notification.type === 'info' && <FiMessageSquare />}
              <span>{notification.message}</span>
            </div>
            <button 
              className="notification-close"
              onClick={(e) => {
                e.stopPropagation();
                removeNotification(notification.id);
              }}
            >
              <FiX />
            </button>
          </div>
        ))}
      </div>
      {/* 헤더 */}
      <div className="header">
        <h1>면접자 관리</h1>
        <div className="header-actions">
          <div className="view-mode-toggle">
            <button 
              className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('grid')}
            >
              <FiList />
              목록형
            </button>
            <button 
              className={`btn ${viewMode === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('calendar')}
            >
              <FiCalendar />
              캘린더형
            </button>
          </div>
          {viewMode === 'grid' && (
            <div className="view-controls">
              <span>콘텐츠 영역 크기에 따라 자동 조정</span>
              <span className="current-view">
                현재: {applicantsPerRow}명씩 표시 ({contentWidth}px)
              </span>
            </div>
          )}
          <button 
            className="btn btn-secondary"
            onClick={() => setIsSettingsModalOpen(true)}
          >
            <FiSettings />
            설정
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setIsScheduleModalOpen(true)}
          >
            <FiCalendar />
            면접 일정 등록
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.scheduled}</div>
          <div className="stat-label">예정된 면접</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.inProgress}</div>
          <div className="stat-label">진행중</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.completed}</div>
          <div className="stat-label">완료된 면접</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.averageScore}</div>
          <div className="stat-label">평균 점수</div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="search-filter">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="지원자명 또는 직무로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <FiFilter />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">전체 상태</option>
            <option value="scheduled">예정됨</option>
            <option value="in-progress">진행중</option>
            <option value="completed">완료</option>
            <option value="cancelled">취소됨</option>
          </select>
        </div>
      </div>

      {/* 뷰 모드에 따른 컨텐츠 렌더링 */}
      {viewMode === 'grid' ? (
        /* 지원자 그리드 */
        <div 
          className="applicants-grid"
          style={{ 
            gridTemplateColumns: `repeat(${applicantsPerRow}, 1fr)` 
          }}
        >
          {filteredApplicants.map((applicant) => (
            <div key={applicant.id} className="applicant-card">
              {/* 지원자 헤더 */}
              <div className="applicant-header">
                <div className="applicant-info">
                  <h3 className="applicant-name">{applicant.name}</h3>
                  <p className="applicant-position">{applicant.position}</p>
                  <div className="applicant-contact">
                    <span><FiMail /> {maskPersonalInfo(applicant.email)}</span>
                    <span><FiPhone /> {maskPersonalInfo(applicant.phone)}</span>
                  </div>
                </div>
                <div className={`status-badge ${applicant.status}`}>
                  {getStatusText(applicant.status)}
                </div>
              </div>

              {/* 면접 정보 */}
              <div className="interview-info">
                <div className="info-row">
                  <span className="label">면접일시:</span>
                  <span className="value">{applicant.interviewDate} {applicant.interviewTime}</span>
                </div>
                <div className="info-row">
                  <span className="label">소요시간:</span>
                  <span className="value">{applicant.duration}</span>
                </div>
                <div className="info-row">
                  <span className="label">면접유형:</span>
                  <span className="value">{applicant.type} ({applicant.platform})</span>
                </div>
                </div>
                
              {/* AI 점수 */}
              {applicant.aiScore > 0 && (
                <div className="ai-score">
                  <div className="score-header">
                    <FiStar />
                    <span>AI 면접 점수</span>
                    <span className="score-value">{applicant.aiScore}점</span>
                  </div>
                  <div className="score-bar">
                    <div className="score-fill" style={{ width: `${applicant.aiScore}%` }}></div>
                  </div>
                </div>
              )}

              {/* 간단한 정보 요약 */}
              <div className="info-summary">
                <div className="summary-item">
                  <FiFileText />
                  <span>서류: {applicant.documents.resume.exists ? '제출' : '미제출'}</span>
                </div>
                {applicant.questions.length > 0 && (
                  <div className="summary-item">
                    <FiVideo />
                    <span>영상: {applicant.questions.length}개</span>
                  </div>
                )}
                {applicant.evaluation.overallScore > 0 && (
                  <div className="summary-item">
                    <FiStar />
                    <span>평가: {applicant.evaluation.overallScore}점</span>
                  </div>
                )}
              </div>

              {/* 액션 버튼 */}
              <div className="action-buttons">
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setSelectedApplicant(applicant);
                  setIsDetailModalOpen(true);
                  }}
                >
                  <FiEye />
                  상세보기
                </button>
                {applicant.questions.length > 0 && (
                  <button 
                    className="btn btn-secondary"
                    onClick={() => downloadApplicantFiles(applicant)}
                  >
                  <FiDownload />
                    다운로드
                  </button>
                )}
                <button 
                  className="btn btn-secondary"
                  onClick={() => openFeedbackModal(applicant)}
                >
                  <FiMessageSquare />
                  결과 전송
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 캘린더 뷰 */
        <InterviewCalendarView
          currentDate={currentDate}
          applicants={applicants}
          navigateMonth={navigateMonth}
          openCalendarScheduleModal={openCalendarScheduleModal}
          getStatusText={getStatusText}
        />
      )}

      {/* 상세보기 모달 */}
      {isDetailModalOpen && selectedApplicant && (
        <div className="modal-overlay" onClick={() => setIsDetailModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedApplicant.name} 상세정보</h2>
              <button 
                className="btn-icon"
                onClick={() => setIsDetailModalOpen(false)}
              >
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              {/* 상세 정보 내용 */}
              <div className="detail-section">
                <h3>기본 정보</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">이름</span>
                    <span className="value">{selectedApplicant.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">지원 직무</span>
                    <span className="value">{selectedApplicant.position}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">이메일</span>
                    <span className="value">{maskPersonalInfo(selectedApplicant.email)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">연락처</span>
                    <span className="value">{maskPersonalInfo(selectedApplicant.phone)}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>면접 정보</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">면접 일시</span>
                    <span className="value">{selectedApplicant.interviewDate} {selectedApplicant.interviewTime}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">소요 시간</span>
                    <span className="value">{selectedApplicant.duration}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">면접 유형</span>
                    <span className="value">{selectedApplicant.type}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">플랫폼</span>
                    <span className="value">{selectedApplicant.platform}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">상태</span>
                    <span className={`status-badge ${selectedApplicant.status}`}>
                      {getStatusText(selectedApplicant.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 문서 정보 */}
              <div className="detail-section">
                <h3>제출 서류</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">이력서</span>
                    <span className="value">
                      {selectedApplicant.documents.resume.exists ? (
                        <button 
                          className="btn-link"
                          onClick={() => viewDocument({ type: 'resume', ...selectedApplicant.documents.resume })}
                        >
                          상세보기
                        </button>
                      ) : (
                        <span className="no-document">제출 내역 없음</span>
                      )}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">포트폴리오</span>
                    <span className="value">
                      {selectedApplicant.documents.portfolio.exists ? (
                        <button 
                          className="btn-link"
                          onClick={() => viewDocument({ type: 'portfolio', ...selectedApplicant.documents.portfolio })}
                        >
                          상세보기
                        </button>
                      ) : (
                        <span className="no-document">제출 내역 없음</span>
                      )}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">자기소개서</span>
                    <span className="value">
                      {selectedApplicant.documents.coverLetter.exists ? (
                        <button 
                          className="btn-link"
                          onClick={() => viewDocument({ type: 'coverLetter', ...selectedApplicant.documents.coverLetter })}
                        >
                          상세보기
                        </button>
                      ) : (
                        <span className="no-document">제출 내역 없음</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* 질문 및 답변 */}
              {selectedApplicant.questions.length > 0 && (
                <div className="detail-section">
                  <h3>질문 및 답변</h3>
                  {selectedApplicant.questions.map((question) => (
                    <div key={question.id} className="question-detail">
                      <div className="question-header">
                        <h4>질문 {question.id}</h4>
                        <button 
                          className="btn-icon"
                          onClick={() => playVideo(question)}
                        >
                          <FiPlay />
                        </button>
                      </div>
                      <div className="question-content">
                        <p className="question-text">{question.question}</p>
                        <p className="answer-text">{question.answer}</p>
                      </div>
                      {question.aiAnalysis && (
                        <div className="ai-analysis-detail">
                          <h5>AI 분석 결과</h5>
                          <div className="analysis-scores">
                            <div className="analysis-score">
                              <span>표정</span>
                              <div className="score-bar">
                                <div 
                                  className="score-fill" 
                                  style={{ width: `${question.aiAnalysis.expression}%` }}
                                ></div>
                              </div>
                              <span>{question.aiAnalysis.expression}%</span>
                            </div>
                            <div className="analysis-score">
                              <span>목소리</span>
                              <div className="score-bar">
                                <div 
                                  className="score-fill" 
                                  style={{ width: `${question.aiAnalysis.voice}%` }}
                                ></div>
                              </div>
                              <span>{question.aiAnalysis.voice}%</span>
                            </div>
                            <div className="analysis-score">
                              <span>제스처</span>
                              <div className="score-bar">
                                <div 
                                  className="score-fill" 
                                  style={{ width: `${question.aiAnalysis.gesture}%` }}
                                ></div>
                              </div>
                              <span>{question.aiAnalysis.gesture}%</span>
                            </div>
                          </div>
                          <p className="analysis-summary">{question.aiAnalysis.summary}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 평가 내역 */}
              {selectedApplicant.evaluation.overallScore > 0 && (
                <div className="detail-section">
                  <h3>평가 내역</h3>
                  <div className="evaluation-detail">
                    <div className="evaluation-chart">
                      <div className="chart-item">
                        <span>기술력</span>
                        <div className="chart-bar">
                          <div 
                            className="chart-fill" 
                            style={{ width: `${selectedApplicant.evaluation.technicalScore}%` }}
                          ></div>
                        </div>
                        <span>{selectedApplicant.evaluation.technicalScore}%</span>
                      </div>
                      <div className="chart-item">
                        <span>커뮤니케이션</span>
                        <div className="chart-bar">
                          <div 
                            className="chart-fill" 
                            style={{ width: `${selectedApplicant.evaluation.communicationScore}%` }}
                          ></div>
                        </div>
                        <span>{selectedApplicant.evaluation.communicationScore}%</span>
                      </div>
                      <div className="chart-item">
                        <span>문화적합성</span>
                        <div className="chart-bar">
                          <div 
                            className="chart-fill" 
                            style={{ width: `${selectedApplicant.evaluation.cultureScore}%` }}
                          ></div>
                        </div>
                        <span>{selectedApplicant.evaluation.cultureScore}%</span>
                      </div>
                    </div>
                    <div className="evaluation-memo">
                      <h4>내부 메모</h4>
                      <p>{selectedApplicant.evaluation.memo}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 영상 재생 모달 */}
      {isVideoModalOpen && selectedVideo && (
        <div className="modal-overlay" onClick={() => setIsVideoModalOpen(false)}>
          <div className="modal-content video-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>영상 재생</h2>
              <button 
                className="btn-icon"
                onClick={() => setIsVideoModalOpen(false)}
              >
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="video-player">
                {videoLoading && (
                  <div className="video-loading">
                    <div className="loading-spinner"></div>
                    <p>비디오를 로드하는 중...</p>
                  </div>
                )}
                {videoError && (
                  <div className="video-error">
                    <FiAlertCircle />
                    <p>{videoError}</p>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => playVideo(selectedVideo)}
                    >
                      다시 시도
                    </button>
                  </div>
                )}
                <video 
                  ref={videoRef}
                  controls
                  onLoadedData={handleVideoLoad}
                  onError={handleVideoError}
                  style={{ display: videoLoading || videoError ? 'none' : 'block' }}
                >
                  <source src={selectedVideo.videoUrl} type="video/mp4" />
                  브라우저가 비디오를 지원하지 않습니다.
                </video>
                <div className="video-controls">
                  <button className="btn btn-secondary">
                    <FiRotateCcw />
                    반복 재생
                  </button>
                  <button className="btn btn-secondary">
                    <FiVolume2 />
                    속도 조절
                  </button>
                  <button className="btn btn-secondary">
                    <FiEdit3 />
                    메모 추가
                  </button>
                </div>
                {selectedVideo.aiAnalysis && (
                  <div className="video-analysis">
                    <h4>AI 분석 결과</h4>
                    <div className="analysis-detail">
                      <div className="analysis-item">
                        <span>표정 분석</span>
                        <div className="analysis-bar">
                          <div 
                            className="analysis-fill" 
                            style={{ width: `${selectedVideo.aiAnalysis.expression}%` }}
                          ></div>
                        </div>
                        <span>{selectedVideo.aiAnalysis.expression}%</span>
                      </div>
                      <div className="analysis-item">
                        <span>목소리 분석</span>
                        <div className="analysis-bar">
                          <div 
                            className="analysis-fill" 
                            style={{ width: `${selectedVideo.aiAnalysis.voice}%` }}
                          ></div>
                        </div>
                        <span>{selectedVideo.aiAnalysis.voice}%</span>
                      </div>
                      <div className="analysis-item">
                        <span>제스처 분석</span>
                        <div className="analysis-bar">
                          <div 
                            className="analysis-fill" 
                            style={{ width: `${selectedVideo.aiAnalysis.gesture}%` }}
                          ></div>
                        </div>
                        <span>{selectedVideo.aiAnalysis.gesture}%</span>
                      </div>
                    </div>
                    <p className="analysis-summary">{selectedVideo.aiAnalysis.summary}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 문서 상세보기 모달 */}
      {isDocumentModalOpen && selectedDocument && (
        <div className="modal-overlay" onClick={() => setIsDocumentModalOpen(false)}>
          <div className="modal-content document-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedDocument.type === 'resume' ? '이력서' : 
                   selectedDocument.type === 'portfolio' ? '포트폴리오' : '자기소개서'} 상세보기</h2>
              <button 
                className="btn-icon"
                onClick={() => setIsDocumentModalOpen(false)}
              >
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="document-content">
                <div className="document-summary">
                  <h4>요약</h4>
                  <p>{selectedDocument.summary}</p>
                </div>
                <div className="document-keywords">
                  <h4>주요 키워드</h4>
                  <div className="keyword-tags">
                    {selectedDocument.keywords.map((keyword, index) => (
                      <span key={index} className="keyword-tag">{keyword}</span>
                    ))}
                  </div>
                </div>
                <div className="document-full">
                  <h4>전문 내용</h4>
                  <div className="document-text">
                    {selectedDocument.content}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 피드백 모달 */}
      {isFeedbackModalOpen && selectedApplicant && (
        <div className="modal-overlay" onClick={() => setIsFeedbackModalOpen(false)}>
          <div className="modal-content feedback-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedApplicant.name} 피드백 전송</h2>
              <button 
                className="btn-icon"
                onClick={() => setIsFeedbackModalOpen(false)}
              >
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="feedback-form">
                <div className="form-group">
                  <label>결과</label>
                  <div className="result-buttons">
                    <button 
                      className={`btn ${selectedApplicant.evaluation.result === 'pass' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => updateResult(selectedApplicant.id, 'pass')}
                    >
                      합격
                    </button>
                    <button 
                      className={`btn ${selectedApplicant.evaluation.result === 'fail' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => updateResult(selectedApplicant.id, 'fail')}
                    >
                      불합격
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>전송 채널</label>
                  <select 
                    value={selectedApplicant.feedback.channel}
                    onChange={(e) => {
                      const updatedApplicant = { 
                        ...selectedApplicant, 
                        feedback: { ...selectedApplicant.feedback, channel: e.target.value } 
                      };
                      setSelectedApplicant(updatedApplicant);
                      setApplicants(prev => prev.map(applicant => 
                        applicant.id === selectedApplicant.id 
                          ? updatedApplicant
                          : applicant
                      ));
                    }}
                  >
                    <option value="email">이메일</option>
                    <option value="sms">문자</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>피드백 내용</label>
                  <textarea 
                    value={selectedApplicant.feedback.content}
                    onChange={(e) => {
                      const updatedApplicant = { 
                        ...selectedApplicant, 
                        feedback: { ...selectedApplicant.feedback, content: e.target.value } 
                      };
                      setSelectedApplicant(updatedApplicant);
                      setApplicants(prev => prev.map(applicant => 
                        applicant.id === selectedApplicant.id 
                          ? updatedApplicant
                          : applicant
                      ));
                    }}
                    placeholder="피드백 내용을 입력하세요..."
                    rows={6}
                  />
                </div>
                <div className="feedback-guide">
                  <h4>피드백 가이드</h4>
                  <div className="guide-buttons">
                    <button 
                      className="btn-link"
                      onClick={() => {
                        const isEmail = selectedApplicant.feedback.channel === 'email';
                        
                        const defaultPassMessage = isEmail ? 
                          `안녕하세요, ${selectedApplicant.name}님!

🎉 합격을 축하드립니다! 🎉

저희와 함께 할 수 있게 되어 매우 기쁩니다. 면접에서 보여주신 전문성과 열정이 깊은 인상을 남겼습니다.

📋 다음 단계 안내:
• 입사 관련 서류 및 세부 일정은 별도 연락을 통해 안내드리겠습니다
• 궁금한 사항이 있으시면 언제든 연락해 주세요

다시 한번 합격을 축하드리며, 함께 성장해 나갈 수 있기를 기대합니다.

감사합니다.` : 
                          `🎉 ${selectedApplicant.name}님, 합격을 축하드립니다! 입사 관련 세부사항은 이메일로 별도 안내드리겠습니다. 감사합니다.`;
                        
                        const updatedApplicant = { 
                          ...selectedApplicant, 
                          feedback: { ...selectedApplicant.feedback, content: defaultPassMessage } 
                        };
                        setSelectedApplicant(updatedApplicant);
                        setApplicants(prev => prev.map(applicant => 
                          applicant.id === selectedApplicant.id 
                            ? updatedApplicant
                            : applicant
                        ));
                      }}
                    >
                      합격 기본 메시지 ({selectedApplicant.feedback.channel === 'email' ? '이메일용' : '문자용'})
                    </button>
                    <button 
                      className="btn-link"
                      onClick={() => {
                        const isEmail = selectedApplicant.feedback.channel === 'email';
                        
                        const defaultFailMessage = isEmail ? 
                          `안녕하세요, ${selectedApplicant.name}님.

면접에 참여해 주셔서 진심으로 감사드립니다.

신중한 검토 결과, 아쉽게도 이번 기회에는 함께하지 못하게 되었음을 알려드립니다. 이는 ${selectedApplicant.name}님의 역량 부족이 아닌, 현재 저희가 찾고 있는 포지션과의 적합성을 종합적으로 고려한 결과입니다.

💪 앞으로의 응원 메시지:
• 면접에서 보여주신 열정과 노력을 높이 평가합니다
• 더 좋은 기회에서 ${selectedApplicant.name}님의 역량을 발휘하실 수 있기를 바랍니다
• 향후 다른 포지션에서 기회가 있다면 다시 연락드릴 수도 있습니다

소중한 시간을 내어 면접에 참여해 주신 점 다시 한번 감사드리며, ${selectedApplicant.name}님의 앞날에 좋은 일들이 가득하기를 진심으로 응원합니다.

감사합니다.` : 
                          `${selectedApplicant.name}님, 면접에 참여해 주셔서 감사합니다. 아쉽게도 이번에는 함께하지 못하게 되었습니다. 좋은 기회가 있기를 바랍니다.`;
                        
                        const updatedApplicant = { 
                          ...selectedApplicant, 
                          feedback: { ...selectedApplicant.feedback, content: defaultFailMessage } 
                        };
                        setSelectedApplicant(updatedApplicant);
                        setApplicants(prev => prev.map(applicant => 
                          applicant.id === selectedApplicant.id 
                            ? updatedApplicant
                            : applicant
                        ));
                      }}
                    >
                      불합격 기본 메시지 ({selectedApplicant.feedback.channel === 'email' ? '이메일용' : '문자용'})
                    </button>
                  </div>
                </div>
                <div className="form-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => sendFeedback(selectedApplicant.id, selectedApplicant.feedback)}
                  >
                    <FiSend />
                    피드백 전송
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setIsFeedbackModalOpen(false)}
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 면접 일정 등록 모달 */}
      {isScheduleModalOpen && (
        <div className="modal-overlay" onClick={() => setIsScheduleModalOpen(false)}>
          <div className="modal-content schedule-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>면접 일정 등록</h2>
              <button 
                className="btn-icon"
                onClick={() => setIsScheduleModalOpen(false)}
              >
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="schedule-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>지원자 이름 *</label>
                    <input
                      type="text"
                      value={newSchedule.name}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="지원자 이름을 입력하세요"
                    />
                  </div>
                  <div className="form-group">
                    <label>지원 직무 *</label>
                    <input
                      type="text"
                      value={newSchedule.position}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, position: e.target.value }))}
                      placeholder="지원 직무를 입력하세요"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>이메일 *</label>
                    <input
                      type="email"
                      value={newSchedule.email}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="이메일을 입력하세요"
                    />
                  </div>
                  <div className="form-group">
                    <label>연락처 *</label>
                    <input
                      type="tel"
                      value={newSchedule.phone}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="010-0000-0000"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>면접 날짜 *</label>
                    <input
                      type="date"
                      value={newSchedule.interviewDate}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, interviewDate: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>면접 시간 *</label>
                    <input
                      type="time"
                      value={newSchedule.interviewTime}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, interviewTime: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>소요 시간</label>
                    <select
                      value={newSchedule.duration}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, duration: e.target.value }))}
                    >
                      <option value="30분">30분</option>
                      <option value="60분">60분</option>
                      <option value="90분">90분</option>
                      <option value="120분">120분</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>면접 유형</label>
                    <select
                      value={newSchedule.type}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="비대면">비대면</option>
                      <option value="대면">대면</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>플랫폼/장소</label>
                  <input
                    type="text"
                    value={newSchedule.platform}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, platform: e.target.value }))}
                    placeholder="Zoom, Teams, 회사 면접실 등"
                  />
                </div>
                <div className="form-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={createSchedule}
                  >
                    <FiCalendar />
                    일정 등록
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setIsScheduleModalOpen(false)}
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 설정 모달 */}
      {isSettingsModalOpen && (
        <div className="modal-overlay" onClick={() => setIsSettingsModalOpen(false)}>
          <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>설정</h2>
              <button 
                className="btn-icon"
                onClick={() => setIsSettingsModalOpen(false)}
              >
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="settings-form">
                <div className="settings-section">
                  <h3>화면 설정</h3>
                  <div className="form-group">
                    <label>한 줄에 표시할 지원자 수</label>
                    <select
                      value={applicantsPerRow}
                      onChange={(e) => setApplicantsPerRow(Number(e.target.value))}
                    >
                      <option value={1}>1명</option>
                      <option value={2}>2명</option>
                      <option value={3}>3명</option>
                      <option value={4}>4명</option>
                      {/* <option value={5}>5명</option> */}
                    </select>
                  </div>
                </div>
                <div className="settings-section">
                  <h3>알림 설정</h3>
                  <div className="form-group">
                    <label>
                      <input type="checkbox" defaultChecked />
                      면접 시작 알림
                    </label>
                  </div>
                  <div className="form-group">
                    <label>
                      <input type="checkbox" defaultChecked />
                      피드백 전송 알림
                    </label>
                  </div>
                </div>
                <div className="settings-section">
                  <h3>개인정보 보호</h3>
                  <div className="form-group">
                    <label>
                      <input type="checkbox" defaultChecked />
                      개인정보 마스킹 사용
                    </label>
                  </div>
                </div>
                <div className="settings-section">
                  <h3>데이터 관리</h3>
                  <div className="form-group">
                    <button 
                      className="btn btn-secondary"
                      onClick={resetData}
                      style={{ background: '#ef4444', color: 'white', border: 'none' }}
                    >
                      <FiArchive />
                      데이터 초기화
                    </button>
                    <small style={{ color: '#6b7280', marginTop: '4px' }}>
                      모든 면접자 데이터를 초기 상태로 되돌립니다.
                    </small>
                  </div>
                </div>
                <div className="form-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      setIsSettingsModalOpen(false);
                      showNotification('설정이 저장되었습니다.');
                    }}
                  >
                    <FiSettings />
                    설정 저장
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setIsSettingsModalOpen(false)}
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 캘린더 면접 일정 등록 모달 */}
      <CalendarScheduleModal
        isOpen={isCalendarScheduleModalOpen}
        onClose={() => setIsCalendarScheduleModalOpen(false)}
        selectedDate={selectedDate}
        newSchedule={newSchedule}
        setNewSchedule={setNewSchedule}
        onSubmit={createCalendarSchedule}
        getInterviewsForDate={getInterviewsForDate}
        getStatusText={getStatusText}
        applicants={applicants}
      />
    </div>
  );
};

export default InterviewManagement; 