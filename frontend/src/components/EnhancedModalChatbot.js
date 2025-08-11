import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import AIModeSelector from './AIModeSelector';
import ChatbotRestartButton from './ChatbotRestartButton';
import jsonFieldMapper from '../utils/JsonFieldMapper';
import { classifyContext } from '../nlp/contextClassifier';
import { loadRules, getRulesForContext } from '../nlp/rulesLoader';
import { matchKeywords } from '../nlp/keywordMatcher';
import rulesConfig from '../config/rules/recruitRules.json';
import { getInitialField, getNextField, getPrompt } from '../nlp/formFlow';

const EnhancedModalChatbot = ({
  isOpen,
  onClose,
  onFieldUpdate,
  onComplete,
  onTitleRecommendation,  // 새로운 prop: 제목 추천 모달 열기
  formData = {},
  pageId = 'recruit_form',
  closeOnBackdropClick = false  // 배경 클릭 시 닫기 여부 (기본값: false)
}) => {
  // API URL 설정 - 환경 변수 또는 기본값 사용
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 세션 기반 히스토리를 위한 세션 ID (sessionStorage 사용하여 새로고침 시 자동 초기화)
  const [sessionId] = useState(() => {
    const existingSessionId = sessionStorage.getItem('aiChatbot_sessionId');
    if (existingSessionId) {
      return existingSessionId;
    }
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('aiChatbot_sessionId', newSessionId);
    return newSessionId;
  });
  const [showDirectionChoice, setShowDirectionChoice] = useState(true);
  const [selectedDirection, setSelectedDirection] = useState(null);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showEndChat, setShowEndChat] = useState(false);
  const [endChatTimer, setEndChatTimer] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [suggestions, setSuggestions] = useState([]);

  // 대화 순서 관리 상태
  const [conversationOrder, setConversationOrder] = useState({
    currentStep: 0,
    totalSteps: 8,
    completedFields: new Set(),
    isOrderBroken: false
  });

  // 필드 순서 정의
  const FIELD_ORDER = [
    { key: 'department', label: '구인 부서', step: 1 },
    { key: 'headcount', label: '채용 인원', step: 2 },
    { key: 'mainDuties', label: '주요 업무', step: 3 },
    { key: 'workHours', label: '근무 시간', step: 4 },
    { key: 'locationCity', label: '근무 위치', step: 5 },
    { key: 'salary', label: '급여 조건', step: 6 },
    { key: 'experience', label: '경력 요건', step: 7 },
    { key: 'contactEmail', label: '연락처 이메일', step: 8 }
  ];
  const [isFinalizing, setIsFinalizing] = useState(false);

  // 대화 재시작 함수
  const handleRestartConversation = useCallback(() => {
    console.log('[EnhancedModalChatbot] 대화 재시작');
    
    // 상태 초기화
    setMessages([]);
    setInputValue('');
    setIsLoading(false);
    setIsFinalizing(false);
    setShowModeSelector(true);
    setSelectedAIMode(null);
    setSelectedDirection(null);
    setShowDirectionChoice(true);
    
    // 순서 상태 초기화
    setConversationOrder({
      currentStep: 0,
      totalSteps: 8,
      completedFields: new Set(),
      isOrderBroken: false
    });
    
    // 세션 히스토리 클리어
    clearSessionHistory();
    
    // 초기 메시지 추가
    setTimeout(() => {
      setMessages([{
        type: 'bot',
        content: '안녕하세요! 채용공고 작성을 도와드리겠습니다. 어떤 방식으로 진행하시겠어요?',
        timestamp: new Date(),
        id: 'welcome-restart'
      }]);
    }, 100);
  }, []);

  // 세션 히스토리 클리어 함수
  const clearSessionHistory = useCallback(() => {
    try {
      sessionStorage.removeItem(`aiChatbot_messages_${sessionId}`);
      sessionStorage.removeItem(`aiChatbot_formData_${sessionId}`);
      console.log('[EnhancedModalChatbot] 세션 히스토리 클리어 완료');
    } catch (error) {
      console.error('[EnhancedModalChatbot] 세션 히스토리 클리어 실패:', error);
    }
  }, [sessionId]);

  // AI 모드 선택 상태
  const [showModeSelector, setShowModeSelector] = useState(true);
  const [selectedAIMode, setSelectedAIMode] = useState(null);

  // AI 모드 정의
  const AI_MODES = [
    {
      id: 'assistant',
      title: 'AI 어시스턴트',
      description: '질문에 답변하고 정보를 제공합니다',
      icon: '🤖',
      color: '#667eea'
    },
    {
      id: 'guide',
      title: '단계별 가이드',
      description: '순서대로 차근차근 안내합니다',
      icon: '📋',
      color: '#10b981'
    },
    {
      id: 'auto',
      title: '자동 작성',
      description: 'AI가 자동으로 내용을 작성합니다',
      icon: '⚡',
      color: '#f59e0b'
    }
  ];

  // AI 모드 선택 핸들러
  const handleAIModeSelect = useCallback((mode) => {
    console.log('[EnhancedModalChatbot] AI 모드 선택:', mode);
    setSelectedAIMode(mode);
    setShowModeSelector(false);
    
    // 선택된 모드에 따른 초기 메시지 설정
    let initialMessage = '';
    switch (mode.id) {
      case 'assistant':
        initialMessage = '안녕하세요! 채용공고 작성에 대해 궁금한 점이 있으시면 언제든 물어보세요. 어떤 도움이 필요하신가요?';
        break;
      case 'guide':
        initialMessage = '단계별로 차근차근 안내해드리겠습니다. 먼저 구인 부서부터 시작하겠습니다. 어떤 부서를 구인하시나요?';
        break;
      case 'auto':
        initialMessage = '자동 작성 모드입니다. 간단한 정보만 입력해주시면 AI가 자동으로 내용을 작성해드립니다. 시작하시겠어요?';
        break;
      default:
        initialMessage = '안녕하세요! 채용공고 작성을 도와드리겠습니다.';
    }
    
    // 초기 메시지 추가
    setMessages([{
      type: 'bot',
      content: initialMessage,
      timestamp: new Date(),
      id: 'mode-selection'
    }]);
    
    // 모드별 초기 설정
    if (mode.id === 'guide') {
      setConversationOrder(prev => ({
        ...prev,
        currentStep: 1
      }));
    }
  }, []);

  // 뒤로가기 핸들러
  const handleBackToModeSelector = useCallback(() => {
    setShowModeSelector(true);
    setSelectedAIMode(null);
    setMessages([]);
    setConversationOrder({
      currentStep: 0,
      totalSteps: 8,
      completedFields: new Set(),
      isOrderBroken: false
    });
  }, []);

  // 메시지 전송 핸들러
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage = {
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
      id: `user_${Date.now()}`
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      let response;
      
      // 선택된 AI 모드에 따른 응답 생성
      switch (selectedAIMode?.id) {
        case 'assistant':
          response = await generateAssistantResponse(userMessage.content);
          break;
        case 'guide':
          response = await generateGuideResponse(userMessage.content);
          break;
        case 'auto':
          response = await generateAutoResponse(userMessage.content);
          break;
        default:
          response = await generateDefaultResponse(userMessage.content);
      }
      
      const botMessage = {
        type: 'bot',
        content: response,
        timestamp: new Date(),
        id: `bot_${Date.now()}`
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      // 세션 히스토리 저장
      saveSessionHistory([...messages, userMessage, botMessage]);
      
    } catch (error) {
      console.error('[EnhancedModalChatbot] 메시지 처리 오류:', error);
      
      const errorMessage = {
        type: 'bot',
        content: '죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.',
        timestamp: new Date(),
        id: `error_${Date.now()}`
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, selectedAIMode, messages]);

  // AI 어시스턴트 응답 생성
  const generateAssistantResponse = async (userInput) => {
    // 간단한 키워드 기반 응답 생성
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes('부서') || lowerInput.includes('팀')) {
      return '구인 부서는 회사의 조직 구조에 따라 다릅니다. 일반적으로 개발팀, 마케팅팀, 영업팀, 인사팀 등이 있습니다. 어떤 부서를 구인하시나요?';
    }
    
    if (lowerInput.includes('인원') || lowerInput.includes('명수')) {
      return '채용 인원은 보통 1명부터 시작하지만, 대규모 채용의 경우 10명 이상이 될 수도 있습니다. 몇 명을 채용하실 예정인가요?';
    }
    
    if (lowerInput.includes('업무') || lowerInput.includes('일')) {
      return '주요 업무는 해당 직무의 핵심 책임과 역할을 설명합니다. 예를 들어 개발자의 경우 "웹 애플리케이션 개발 및 유지보수" 등이 있습니다. 구체적으로 어떤 업무를 담당하게 될까요?';
    }
    
    if (lowerInput.includes('시간') || lowerInput.includes('근무')) {
      return '근무 시간은 보통 9시-18시 (8시간)이지만, 회사마다 다를 수 있습니다. 어떤 근무 시간을 제안하시나요?';
    }
    
    if (lowerInput.includes('위치') || lowerInput.includes('장소')) {
      return '근무 위치는 회사 사무실 주소나 원격 근무 여부를 명시합니다. 서울 강남구, 원격 근무 가능 등으로 표현할 수 있습니다. 어디서 근무하게 될까요?';
    }
    
    if (lowerInput.includes('급여') || lowerInput.includes('연봉')) {
      return '급여 조건은 연봉으로 표현하는 것이 일반적입니다. 예를 들어 "연봉 3,000만원 ~ 4,500만원" 등으로 표시합니다. 어떤 급여 조건을 제안하시나요?';
    }
    
    if (lowerInput.includes('경력') || lowerInput.includes('경험')) {
      return '경력 요건은 신입, 경력 3년 이상, 경력 5년 이상 등으로 표현합니다. 어떤 경력 수준을 원하시나요?';
    }
    
    if (lowerInput.includes('연락처') || lowerInput.includes('이메일')) {
      return '연락처는 이메일 주소를 주로 사용합니다. 예: recruit@company.com. 어떤 이메일로 연락받고 싶으시나요?';
    }
    
    return '채용공고 작성에 대해 궁금한 점이 있으시면 구체적으로 질문해주세요. 부서, 인원, 업무, 근무시간, 위치, 급여, 경력, 연락처 등에 대해 문의하실 수 있습니다.';
  };

  // 단계별 가이드 응답 생성
  const generateGuideResponse = async (userInput) => {
    const currentField = FIELD_ORDER[conversationOrder.currentStep - 1];
    if (!currentField) return '모든 단계가 완료되었습니다.';
    
    // 입력값 검증 및 추출
    const extractedValue = extractFieldValue(userInput, currentField.key);
    
    if (extractedValue.isValid) {
      // 필드 업데이트
      onFieldUpdate?.(currentField.key, extractedValue.normalizedValue);
      
      // 다음 단계로 진행
      const nextStep = conversationOrder.currentStep + 1;
      if (nextStep <= FIELD_ORDER.length) {
        setConversationOrder(prev => ({
          ...prev,
          currentStep: nextStep,
          completedFields: new Set([...prev.completedFields, currentField.key])
        }));
        
        const nextField = FIELD_ORDER[nextStep - 1];
        return `좋습니다! ${currentField.label}이(가) "${extractedValue.normalizedValue}"로 설정되었습니다.\n\n다음은 ${nextField.label}입니다. ${nextField.label}에 대해 알려주세요.`;
      } else {
        // 모든 단계 완료
        setIsFinalizing(true);
        return `완벽합니다! 모든 정보가 입력되었습니다. 이제 채용공고 작성을 완료할 수 있습니다.`;
      }
    } else {
      return `입력하신 내용을 이해하기 어렵습니다. ${currentField.label}에 대해 다시 한 번 명확하게 설명해주세요.\n\n예시: ${getFieldExample(currentField.key)}`;
    }
  };

  // 자동 작성 응답 생성
  const generateAutoResponse = async (userInput) => {
    // 간단한 정보만으로 자동 생성
    const autoGeneratedContent = generateAutoContent(userInput);
    
    if (autoGeneratedContent) {
      return `입력해주신 정보를 바탕으로 자동으로 내용을 생성했습니다:\n\n${autoGeneratedContent}\n\n추가로 수정하고 싶은 부분이 있으시면 말씀해주세요.`;
    }
    
    return '자동 작성을 위해 더 구체적인 정보가 필요합니다. 어떤 내용을 자동으로 작성해드릴까요?';
  };

  // 기본 응답 생성
  const generateDefaultResponse = async (userInput) => {
    return 'AI 모드를 선택해주세요. 어시스턴트, 가이드, 자동 작성 중에서 원하는 방식을 선택하시면 더 정확한 도움을 드릴 수 있습니다.';
  };

  // 필드값 추출 함수
  const extractFieldValue = (input, fieldKey) => {
    const lowerInput = input.toLowerCase();
    
    switch (fieldKey) {
      case 'department':
        if (lowerInput.includes('개발') || lowerInput.includes('프로그래밍')) return { isValid: true, normalizedValue: '개발팀' };
        if (lowerInput.includes('마케팅')) return { isValid: true, normalizedValue: '마케팅팀' };
        if (lowerInput.includes('영업')) return { isValid: true, normalizedValue: '영업팀' };
        if (lowerInput.includes('인사')) return { isValid: true, normalizedValue: '인사팀' };
        return { isValid: true, normalizedValue: input.trim() };
      
      case 'headcount':
        const headcountMatch = input.match(/(\d+)/);
        if (headcountMatch) return { isValid: true, normalizedValue: parseInt(headcountMatch[1]) };
        return { isValid: false, normalizedValue: null, errorMessage: '숫자로 입력해주세요' };
      
      case 'mainDuties':
        return { isValid: true, normalizedValue: input.trim() };
      
      case 'workHours':
        if (lowerInput.includes('9시') || lowerInput.includes('18시')) return { isValid: true, normalizedValue: '09:00-18:00' };
        if (lowerInput.includes('10시') || lowerInput.includes('19시')) return { isValid: true, normalizedValue: '10:00-19:00' };
        return { isValid: true, normalizedValue: input.trim() };
      
      case 'locationCity':
        if (lowerInput.includes('서울')) return { isValid: true, normalizedValue: '서울' };
        if (lowerInput.includes('부산')) return { isValid: true, normalizedValue: '부산' };
        if (lowerInput.includes('대구')) return { isValid: true, normalizedValue: '대구' };
        if (lowerInput.includes('인천')) return { isValid: true, normalizedValue: '인천' };
        return { isValid: true, normalizedValue: input.trim() };
      
      case 'salary':
        const salaryMatch = input.match(/(\d+)/);
        if (salaryMatch) return { isValid: true, normalizedValue: `${salaryMatch[1]}만원` };
        return { isValid: true, normalizedValue: input.trim() };
      
      case 'experience':
        if (lowerInput.includes('신입')) return { isValid: true, normalizedValue: '신입' };
        if (lowerInput.includes('경력')) return { isValid: true, normalizedValue: '경력' };
        return { isValid: true, normalizedValue: input.trim() };
      
      case 'contactEmail':
        const emailMatch = input.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) return { isValid: true, normalizedValue: emailMatch[0] };
        return { isValid: false, normalizedValue: null, errorMessage: '올바른 이메일 형식으로 입력해주세요' };
      
      default:
        return { isValid: true, normalizedValue: input.trim() };
    }
  };

  // 필드별 예시 제공
  const getFieldExample = (fieldKey) => {
    switch (fieldKey) {
      case 'department': return '개발팀, 마케팅팀, 영업팀 등';
      case 'headcount': return '1명, 3명, 5명 등';
      case 'mainDuties': return '웹 개발, 마케팅 전략 수립, 고객 관리 등';
      case 'workHours': return '09:00-18:00, 10:00-19:00 등';
      case 'locationCity': return '서울 강남구, 부산 해운대구 등';
      case 'salary': return '연봉 3,000만원, 월급 250만원 등';
      case 'experience': return '신입, 경력 3년 이상 등';
      case 'contactEmail': return 'recruit@company.com';
      default: return '구체적인 내용을 입력해주세요';
    }
  };

  // 자동 내용 생성
  const generateAutoContent = (input) => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('개발자') || lowerInput.includes('프로그래머')) {
      return `• 주요 업무: 웹 애플리케이션 개발 및 유지보수
• 근무 시간: 09:00-18:00 (탄력근무제)
• 근무 위치: 서울 강남구
• 급여 조건: 연봉 3,500만원 ~ 5,000만원
• 경력 요건: 경력 2년 이상`;
    }
    
    if (lowerInput.includes('마케팅') || lowerInput.includes('홍보')) {
      return `• 주요 업무: 마케팅 전략 수립 및 실행
• 근무 시간: 09:00-18:00
• 근무 위치: 서울 강남구
• 급여 조건: 연봉 3,000만원 ~ 4,500만원
• 경력 요건: 경력 1년 이상`;
    }
    
    return null;
  };

  // 세션 히스토리 저장
  const saveSessionHistory = useCallback((messages, formData = {}) => {
    try {
      sessionStorage.setItem(`aiChatbot_messages_${sessionId}`, JSON.stringify(messages));
      sessionStorage.setItem(`aiChatbot_formData_${sessionId}`, JSON.stringify(formData));
    } catch (error) {
      console.error('[EnhancedModalChatbot] 세션 히스토리 저장 실패:', error);
    }
  }, [sessionId]);

  // 세션 히스토리 로드
  const loadSessionHistory = useCallback(() => {
    try {
      const savedMessages = sessionStorage.getItem(`aiChatbot_messages_${sessionId}`);
      const savedFormData = sessionStorage.getItem(`aiChatbot_formData_${sessionId}`);
      
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
      
      if (savedFormData) {
        // formData 업데이트는 상위 컴포넌트에서 처리
        console.log('[EnhancedModalChatbot] 저장된 폼 데이터 로드:', JSON.parse(savedFormData));
      }
    } catch (error) {
      console.error('[EnhancedModalChatbot] 세션 히스토리 로드 실패:', error);
    }
  }, [sessionId]);

  // 컴포넌트 마운트 시 세션 히스토리 로드
  useEffect(() => {
    if (isOpen) {
      loadSessionHistory();
    }
  }, [isOpen, loadSessionHistory]);

  // 키보드 이벤트 처리
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // 모달 닫기 처리
  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  // 배경 클릭 처리
  const handleBackdropClick = useCallback((e) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      handleClose();
    }
  }, [closeOnBackdropClick, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">AI 채용공고 작성 어시스턴트</h2>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* AI 모드 선택기 */}
          {showModeSelector && (
            <div className="w-full p-6">
              <h3 className="text-lg font-semibold mb-4 text-center">AI 모드를 선택해주세요</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {AI_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => handleAIModeSelect(mode)}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all duration-200 text-left"
                    style={{ borderColor: mode.color + '20' }}
                  >
                    <div className="text-3xl mb-2">{mode.icon}</div>
                    <h4 className="font-semibold text-gray-800 mb-1">{mode.title}</h4>
                    <p className="text-sm text-gray-600">{mode.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 채팅 인터페이스 */}
          {!showModeSelector && (
            <>
              {/* 모드 표시 및 뒤로가기 */}
              <div className="w-full p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">선택된 모드:</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                      {selectedAIMode?.title}
                    </span>
                  </div>
                  <button
                    onClick={handleBackToModeSelector}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    ← 모드 변경
                  </button>
                </div>
              </div>

              {/* 메시지 영역 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      <div className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        AI가 응답을 생성하고 있습니다...
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 입력 영역 */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex gap-2">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="메시지를 입력하세요..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    전송
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedModalChatbot; 