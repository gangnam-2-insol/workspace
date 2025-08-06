import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';

// ==========================================================
// AI 서비스 클래스: 백엔드 API와의 통신 담당
// ==========================================================
class AIChatbotService {
  constructor() {
    this.baseURL = 'http://localhost:8000';
    this.sessionId = null;
    this.conversationHistory = [];
  }

  // AI 세션 시작
  async startSession(page, fields) {
    try {
      const response = await fetch(`${this.baseURL}/api/chatbot/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page,
          fields,
          mode: 'modal_assistant'
        })
      });

      if (!response.ok) {
        throw new Error('AI 세션 시작 실패');
      }

      const data = await response.json();
      this.sessionId = data.session_id;
      console.log('[AIChatbotService] 세션 시작:', this.sessionId);
      return data;
    } catch (error) {
      console.error('[AIChatbotService] 세션 시작 오류:', error);
      // 오프라인 모드로 전환
      return this.startOfflineSession(page, fields);
    }
  }

  // AI 메시지 전송
  async sendMessage(userInput, currentField, context = {}) {
    try {
      const response = await fetch(`${this.baseURL}/api/chatbot/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: this.sessionId,
          user_input: userInput,
          current_field: currentField?.key || null,
          context,
          mode: 'modal_assistant'
        })
      });

      if (!response.ok) {
        throw new Error('AI 메시지 전송 실패');
      }

      const data = await response.json();
      this.conversationHistory.push({
        type: 'user',
        content: userInput,
        timestamp: new Date()
      });
      this.conversationHistory.push({
        type: 'ai',
        content: data.message,
        timestamp: new Date()
      });

      return data;
    } catch (error) {
      console.error('[AIChatbotService] 메시지 전송 오류:', error);
      // 오프라인 모드로 처리
      return this.processOffline(userInput, currentField, context);
    }
  }

  // 필드 업데이트
  async updateField(field, value) {
    try {
      const response = await fetch(`${this.baseURL}/api/chatbot/update-field`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: this.sessionId,
          field,
          value
        })
      });

      if (!response.ok) {
        throw new Error('필드 업데이트 실패');
      }

      return await response.json();
    } catch (error) {
      console.error('[AIChatbotService] 필드 업데이트 오류:', error);
      return { success: false, error: error.message };
    }
  }

  // 오프라인 세션 시작
  startOfflineSession(page, fields) {
    console.log('[AIChatbotService] 오프라인 모드로 전환');
    this.sessionId = 'offline-' + Date.now();
    return {
      session_id: this.sessionId,
      mode: 'offline',
      message: '오프라인 모드로 전환되었습니다.'
    };
  }



  // 오프라인 메시지 처리 (순수 LLM 모델)
  processOffline(userInput, currentField, context) {
    console.log('[AIChatbotService] 오프라인 메시지 처리:', userInput);
    
    // 순수 LLM 응답 생성
    let message = '';
    let value = null;
    let needMoreDetail = true;
    let autoFillSuggestions = [];

    // 사용자 입력에 대한 자연스러운 응답
    if (currentField) {
      message = `현재 "${currentField.label}" 필드에 대해 입력해주세요.`;
    } else {
      message = '어떤 도움이 필요하신가요?';
    }

    return {
      message,
      value,
      needMoreDetail,
      autoFillSuggestions,
      mode: 'offline'
    };
  }

  // 세션 종료
  async endSession() {
    if (this.sessionId && !this.sessionId.startsWith('offline-')) {
      try {
        await fetch(`${this.baseURL}/api/chatbot/end`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: this.sessionId
          })
        });
      } catch (error) {
        console.error('[AIChatbotService] 세션 종료 오류:', error);
      }
    }
    this.sessionId = null;
    this.conversationHistory = [];
  }
}

// ==========================================================
// Helper Functions: 유틸리티 함수들
// ==========================================================



// 기본 필드 제안
const getFieldSuggestions = (fieldKey, formData = {}) => {
  switch (fieldKey) {
    case 'department':
      return ['개발', '기획', '마케팅', '디자인', '인사', '영업'];
    case 'headcount':
      return ['1명', '2명', '3명', '5명', '10명'];
    case 'mainDuties':
      return [
        '신규 웹 서비스 개발 및 기존 시스템 유지보수',
        '사용자 리서치 및 제품 기획',
        '브랜드 마케팅 전략 수립 및 실행',
        '모바일 앱 개발 및 플랫폼 최적화',
        '데이터 분석 및 인사이트 도출'
      ];
    case 'workHours':
      return ['주 5일 근무', '유연근무제', '재택근무 가능', '시차출근제'];
    case 'salary':
      return ['연봉 협의', '연봉 3,000만원', '연봉 4,000만원', '시급 15,000원'];
    case 'contactEmail':
      return ['hr@company.com', 'recruit@company.com', 'jobs@company.com'];
    case 'experience':
      return ['신입', '경력 1년 이상', '경력 3년 이상', '경력 5년 이상', '경력 무관'];
    case 'requiredExperience':
      return ['React, Node.js 2년 이상', '데이터 분석 및 시각화', '영어 커뮤니케이션'];
    case 'preferredQualifications':
      return ['AWS 클라우드 경험', 'Git 협업 경험', '애자일 방법론 경험'];
    default:
      return [];
  }
};

// 파일 저장/다운로드 유틸리티
const getFormattedContent = (formData) => {
  const safeFormData = formData || {};
  
  const contentParts = [
    `**[채용공고 초안]**`,
    `----------------------------------------`,
    `**부서:** ${safeFormData.department || '미정'}`,
    `**인원:** ${safeFormData.headcount || '미정'}`,
    `**주요 업무:**\n${safeFormData.mainDuties || '미정'}\n`,
    `**필요 경험/기술:**\n${safeFormData.requiredExperience || '미정'}\n`,
    `**우대 사항:**\n${safeFormData.preferredQualifications || '없음'}\n`,
    `----------------------------------------`,
    `AI 채용공고 어시스턴트가 생성했습니다.`,
  ];
  return contentParts.join('\n');
};

const saveDraft = (formData) => {
  const draftContent = getFormattedContent(formData);
  try {
    localStorage.setItem('jobPostingDraft', draftContent);
    console.log('초안 저장됨:', draftContent);
    return { message: "✅ 초안이 성공적으로 저장되었습니다!" };
  } catch (error) {
    console.error('초안 저장 실패:', error);
    return { message: "❌ 초안 저장에 실패했습니다. 다시 시도해주세요." };
  }
};

const downloadPDF = (formData, format = 'pdf') => {
  const content = getFormattedContent(formData);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `채용공고_초안.${format === 'text' ? 'txt' : format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return { message: `✅ 채용공고 초안이 ${format.toUpperCase()} 파일로 다운로드되었습니다!` };
};

// ==========================================================
// Styled Components: UI 스타일링 (기존 유지)
// ==========================================================

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
`;

const loadingDots = keyframes`
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1.0); }
`;

const ModalOverlay = styled.div`
  position: absolute;
  width: 470px;
  height: 923px;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  height: 90%;
  max-height: 90vh;
  width: 100%;
  display: flex;
  overflow: hidden;
  position: relative;
  left: 50%;
  top: 40%;
  transform: translate(-50%, -50%);

  @media (max-width: 768px) {
    flex-direction: column;
    max-width: 95%;
    max-height: 95vh;
  }
`;

const FormSection = styled.div`
  flex: 1;
  padding: 24px;
  border-right: 1px solid #e5e7eb;
  overflow-y: auto;

  @media (max-width: 768px) {
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
    min-height: 200px;
  }
`;

const ChatbotSection = styled.div`
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  animation: ${slideIn} 0.5s ease-out;
  width: 100%;
  max-width: 500px;

  @media (max-width: 768px) {
    width: 100%;
    height: 60%;
    min-height: 300px;
  }
`;

const ChatbotHeader = styled.div`
  padding: 24px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1.1em;
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.5em;
  cursor: pointer;
  padding: 0 5px;
  transition: transform 0.2s ease-in-out;

  &:hover {
    transform: rotate(90deg);
  }
`;

const EndConversationButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 0.9em;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
  margin-right: 8px;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }
`;

const CancelButton = styled.button`
  background: #ef4444;
  border: none;
  color: white;
  font-size: 0.9em;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.2s ease;
  margin-top: 8px;

  &:hover {
    background: #dc2626;
    transform: translateY(-1px);
  }
`;

const ItemSelectionContainer = styled.div`
  margin-top: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
`;

const ItemCard = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  background: white;
  border: 2px solid ${props => props.selected ? '#667eea' : '#e2e8f0'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #667eea;
    box-shadow: 0 2px 4px rgba(102, 126, 234, 0.1);
  }
`;

const Checkbox = styled.input`
  margin-top: 2px;
  width: 18px;
  height: 18px;
  accent-color: #667eea;
`;

const ItemText = styled.div`
  flex: 1;
  font-size: 0.9em;
  line-height: 1.4;
  color: #2d3748;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  justify-content: flex-end;
`;

const ActionButton = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;

  ${props => props.primary ? `
    background-color: #667eea;
    color: white;
    &:hover {
      background-color: #5a67d8;
      transform: translateY(-1px);
    }
  ` : `
    background-color: #edf2f7;
    color: #4a5568;
    border: 1px solid #e2e8f0;
    &:hover {
      background-color: #e2e8f0;
      transform: translateY(-1px);
    }
  `}
`;

const ChatbotMessages = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scroll-behavior: smooth;
  background-color: #f0f2f5;

  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #cbd5e0;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-track {
    background-color: #f1f5f9;
  }
`;

const Message = styled.div`
  max-width: 85%;
  padding: 10px 15px;
  border-radius: 18px;
  line-height: 1.4;
  font-size: 0.9em;
  animation: ${fadeIn} 0.3s ease-out;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  white-space: pre-wrap;

  ${props => props.type === 'user' ? `
    background-color: #e0e7ff;
    color: #333;
    align-self: flex-end;
    border-bottom-right-radius: 5px;
  ` : `
    background-color: #ffffff;
    color: #2d3748;
    align-self: flex-start;
    border: 1px solid #e2e8f0;
    border-bottom-left-radius: 5px;
  `}
`;

const TypingIndicator = styled.div`
  display: flex;
  align-self: flex-start;
  padding: 10px 15px;
  border-radius: 18px;
  background: #ffffff;
  color: #2d3748;
  margin-top: 5px;
  animation: ${fadeIn} 0.3s ease-out;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);

  span {
    display: inline-block;
    width: 7px;
    height: 7px;
    background-color: #667eea;
    border-radius: 50%;
    margin: 0 2px;
    animation: ${loadingDots} 1.4s infinite ease-in-out both;

    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
    &:nth-child(3) { animation-delay: 0s; }
  }
`;

const ChatbotInput = styled.div`
  padding: 5px 16px 16px;
  border-top: 1px solid #e5e7eb;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const InputArea = styled.div`
  display: flex;
  gap: 10px;
`;

const TextArea = styled.textarea`
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #cbd5e0;
  border-radius: 8px;
  font-size: 0.95em;
  resize: none;
  outline: none;
  &:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
  }
  &::placeholder {
    color: #a0aec0;
  }
  min-height: 40px;
  max-height: 120px;
  overflow-y: auto;
`;

const SendButton = styled.button`
  background: ${props => props.disabled ? '#e2e8f0' : '#667eea'};
  color: ${props => props.disabled ? '#a0aec0' : 'white'};
  border: none;
  border-radius: 8px;
  padding: 10px 18px;
  font-size: 0.95em;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: background 0.2s ease, transform 0.1s ease;
  &:not(:disabled):hover {
    background: #5a67d8;
    transform: translateY(-1px);
  } 
`;

const SuggestionsContainer = styled.div`
  transition: all 0.3s ease;
  overflow: hidden;
  max-height: ${props => props.$isExpanded ? '200px' : '43px'};
  border-radius: 8px;
  background: ${props => props.$isExpanded ? 'transparent' : '#f0f4ff'};
  border: 1px solid ${props => props.$isExpanded ? 'transparent' : '#b3c7ff'};
  margin-bottom: ${props => props.$isExpanded ? '8px' : '0'};
  box-shadow: ${props => props.$isExpanded ? 'none' : '0 2px 4px rgba(102, 126, 234, 0.1)'};
`;

const SuggestionsToggle = styled.button`
  background: ${props => props.$isExpanded ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
  border: none;
  color: ${props => props.$isExpanded ? '#64748b' : 'white'};
  font-size: 0.9em;
  font-weight: 600;
  cursor: pointer;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  width: 100%;
  border-radius: 6px;
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: ${props => props.$isExpanded ? 'none' : 'translateY(-1px)'};
    box-shadow: ${props => props.$isExpanded ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.3)'};
  }
  
  &:active {
    transform: ${props => props.$isExpanded ? 'none' : 'translateY(0)'};
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }
  
  &:hover::before {
    left: 100%;
  }
`;

const SuggestionsContent = styled.div`
  transition: all 0.3s ease;
  opacity: ${props => props.$isExpanded ? '1' : '0'};
  transform: ${props => props.$isExpanded ? 'translateY(0)' : 'translateY(-10px)'};
  max-height: 200px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #cbd5e0;
    border-radius: 3px;
  }
  &::-webkit-scrollbar-track {
    background-color: #f1f5f9;
  }
`;

const SuggestionsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  padding-right: 4px;
`;

const AutoFillButton = styled.button`
  background: ${props => props.disabled ? '#edf2f7' : '#f0f4ff'};
  color: ${props => props.disabled ? '#a0aec0' : '#4c51bf'};
  border: 1px solid ${props => props.disabled ? '#e2e8f0' : '#b3c7ff'};
  border-radius: 20px;
  padding: 8px 12px;
  font-size: 0.8em;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;

  &:not(:disabled):hover {
    background: #e0e9ff;
    border-color: #92aeff;
  }
`;



const SectionTitle = styled.h2`
  font-size: 1.5em;
  color: #2d3748;
  margin-bottom: 20px;
  border-bottom: 2px solid #edf2f7;
  padding-bottom: 10px;
`;

const FormField = styled.div`
  margin-bottom: 18px;

  label {
    display: block;
    font-size: 0.95em;
    color: #4a5568;
    margin-bottom: 6px;
    font-weight: 600;
  }

  input[type="text"],
  input[type="number"],
  textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #cbd5e0;
    border-radius: 6px;
    font-size: 1em;
    color: #2d3748;
    background-color: #ffffff;
    box-shadow: inset 0 1px 2px rgba(0,0,0,0.04);
    transition: border-color 0.2s, box-shadow 0.2s;

    &:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
    }

    &:disabled {
      background-color: #f8fafc;
      color: #a0aec0;
      cursor: not-allowed;
    }
  }

  textarea {
    min-height: 80px;
    resize: vertical;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
  justify-content: flex-end;
`;

const FormActionButton = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.95em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  ${props => props.$primary ? `
    background-color: #667eea;
    color: white;
    border: 1px solid #667eea;
    &:hover {
      background-color: #5a67d8;
      border-color: #5a67d8;
      transform: translateY(-1px);
    }
  ` : `
    background-color: #edf2f7;
    color: #4a5568;
    border: 1px solid #e2e8f0;
    &:hover {
      background-color: #e2e8f0;
      transform: translateY(-1px);
    }
  `}
`;

// ==========================================================
// Main Component: EnhancedModalChatbot
// ==========================================================

const EnhancedModalChatbot = ({
  isOpen,
  onClose,
  fields = [],
  formData = {},
  onFieldUpdate,
  onComplete,
  aiAssistant = true,
  title = "AI 채용공고 어시스턴트"
}) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentField, setCurrentField] = useState(null);
  const [autoFillSuggestions, setAutoFillSuggestions] = useState([]);
  const [isSuggestionsExpanded, setIsSuggestionsExpanded] = useState(false);
  const [aiService] = useState(() => new AIChatbotService());
  const [selectedItems, setSelectedItems] = useState([]);
  const [currentItems, setCurrentItems] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const sendMessageRef = useRef(null);
  const fieldsRef = useRef(fields);
  const inputUpdateTimeout = useRef(null);

  


  // fields ref 업데이트
  useEffect(() => {
    fieldsRef.current = fields;
  }, [fields]);

  // 현재 필드가 변경될 때마다 추천리스트 업데이트
  useEffect(() => {
    if (currentField) {
      console.log('[EnhancedModalChatbot] 현재 필드 변경됨:', currentField.key);
      const suggestions = getFieldSuggestions(currentField.key, formData);
      setAutoFillSuggestions(suggestions);
      console.log('[EnhancedModalChatbot] 추천리스트 업데이트:', suggestions);
    } else {
      // 모든 필드가 완료되면 추천리스트 숨기기
      console.log('[EnhancedModalChatbot] 모든 필드 완료 - 추천리스트 숨김');
      setAutoFillSuggestions([]);
      setIsSuggestionsExpanded(false);
    }
  }, [currentField, formData]);

  // 모달 열릴 때 AI 어시스턴트 시작
  useEffect(() => {
    if (isOpen && aiAssistant) {
      // startAIAssistant 함수를 직접 호출하지 않고 내부 로직을 실행
      const initializeAI = async () => {
        setIsLoading(true);
        
        try {
          // AI 세션 시작
          await aiService.startSession('job_posting', fieldsRef.current);
          
          if (!fieldsRef.current || fieldsRef.current.length === 0) {
            setMessages([{
              type: 'bot',
              content: "안녕하세요! 설정된 필드가 없습니다. 채용공고를 작성할 수 없습니다.",
              timestamp: new Date(),
              id: `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-no-fields`
            }]);
            setIsLoading(false);
            return;
          }

          const firstField = fieldsRef.current[0];
          setCurrentField(firstField);
          
          const welcomeMessage = {
            type: 'bot',
            content: `안녕하세요! 👋\n\n채용공고 작성을 도와드리겠습니다.\n\n먼저 **${firstField.label}**에 대해 알려주세요.`,
            timestamp: new Date(),
            id: `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-initial`
          };
          
          setMessages([welcomeMessage]);
          setAutoFillSuggestions(getFieldSuggestions(firstField.key, formData));
          setIsSuggestionsExpanded(true);
          
        } catch (error) {
          console.error('AI 어시스턴트 시작 오류:', error);
          setMessages([{
            type: 'bot',
            content: "AI 서비스에 연결할 수 없습니다. 오프라인 모드로 전환됩니다.",
            timestamp: new Date(),
            id: `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-error`
          }]);
        }
        
        setIsLoading(false);
        if (inputRef.current) {
          inputRef.current.focus();
        }
      };
      
      initializeAI();
    }
  }, [isOpen, aiAssistant, aiService]);

  // 메시지 업데이트 시 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 입력창 포커스
  useEffect(() => {
    if (!isLoading && inputRef.current && isOpen) {
      inputRef.current.focus();
    }
  }, [isLoading, isOpen]);

  // AI 응답 처리 함수
  const handleAIResponse = useCallback(async (userInput) => {
    if (!userInput.trim()) return;
    
    // 사용자 메시지를 먼저 추가하여 즉시 UI에 반영
    const userMessage = {
      type: 'user',
      content: userInput,
      timestamp: new Date(),
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      const response = await aiService.sendMessage(userInput, currentField, {
        formData,
        messages: messages.slice(-5) // 최근 5개 메시지만 컨텍스트로 전송
      });
      
      console.log('[EnhancedModalChatbot] AI 응답:', response);
      
      // AI 응답 메시지 추가
      const aiMessage = {
        type: 'bot',
        content: response.message,
        timestamp: new Date(),
        id: `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        responseType: response.response_type || 'conversation',
        selectableItems: response.selectable_items || [],
        suggestions: response.suggestions || []
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // 필드 업데이트가 있는 경우 처리
      if (response.field && response.value && onFieldUpdate) {
        console.log('[EnhancedModalChatbot] 필드 업데이트 실행:', response.field, response.value);
        onFieldUpdate(response.field, response.value);
        
        // 다음 필드로 이동
        const currentFieldIndex = fields.findIndex(f => f.key === response.field);
        if (currentFieldIndex !== -1 && currentFieldIndex < fields.length - 1) {
          const nextField = fields[currentFieldIndex + 1];
          setCurrentField(nextField);
          // 다음 필드에 대한 추천 업데이트
          setAutoFillSuggestions(getFieldSuggestions(nextField.key, formData));
        } else {
          // 모든 필드가 완료되면 currentField를 null로 설정
          setCurrentField(null);
          setAutoFillSuggestions([]);
          setIsSuggestionsExpanded(false);
        }
        
        console.log('[EnhancedModalChatbot] 필드 업데이트 완료:', response.field, response.value);
      } else {
        // 필드 업데이트가 없는 경우에도 사용자 입력을 현재 필드에 반영
        if (currentField && onFieldUpdate) {
          console.log('[EnhancedModalChatbot] 사용자 입력을 현재 필드에 반영:', currentField.key, userInput);
          onFieldUpdate(currentField.key, userInput);
          
          // 사용자 입력 후 다음 필드로 자동 이동
          const currentFieldIndex = fields.findIndex(f => f.key === currentField.key);
          if (currentFieldIndex !== -1 && currentFieldIndex < fields.length - 1) {
            const nextField = fields[currentFieldIndex + 1];
            setCurrentField(nextField);
            // 다음 필드에 대한 추천 업데이트
            setAutoFillSuggestions(getFieldSuggestions(nextField.key, formData));
          } else {
            // 모든 필드가 완료되면 currentField를 null로 설정
            setCurrentField(null);
            setAutoFillSuggestions([]);
            setIsSuggestionsExpanded(false);
          }
        }
      }
      
      // 경력 관련 입력 감지 및 자동 매핑
      if (!response.field && !response.value && currentField && onFieldUpdate) {
        const experienceKeywords = ['경력', '신입', '경험', '년', '무관'];
        const hasExperienceKeyword = experienceKeywords.some(keyword => 
          userInput.includes(keyword)
        );
        
        if (hasExperienceKeyword) {
          // 경력 필드가 있는지 확인
          const experienceField = fields.find(f => f.key === 'experience');
          if (experienceField) {
            console.log('[EnhancedModalChatbot] 경력 관련 입력 감지, experience 필드로 매핑:', userInput);
            onFieldUpdate('experience', userInput);
            
            // 다음 필드로 이동
            const experienceFieldIndex = fields.findIndex(f => f.key === 'experience');
            if (experienceFieldIndex !== -1 && experienceFieldIndex < fields.length - 1) {
              const nextField = fields[experienceFieldIndex + 1];
              setCurrentField(nextField);
              setAutoFillSuggestions(getFieldSuggestions(nextField.key, formData));
            } else {
              setCurrentField(null);
              setAutoFillSuggestions([]);
              setIsSuggestionsExpanded(false);
            }
          }
        }
      }
      
      // 강제로 필드 업데이트 확인
      if (currentField && onFieldUpdate) {
        setTimeout(() => {
          console.log('[EnhancedModalChatbot] 강제 필드 업데이트 확인:', currentField.key, userInput);
          onFieldUpdate(currentField.key, userInput);
        }, 100);
      }
      
      // 선택 가능한 항목이 있는 경우 처리
      if (response.response_type === 'selection' && response.selectable_items && response.selectable_items.length > 0) {
        setCurrentItems(response.selectable_items.map((item, index) => ({
          id: `item-${Date.now()}-${index}`,
          text: item.text || item,
          value: item.value || item
        })));
        setSelectedItems([]);
      } else {
        // 대화형 응답인 경우 선택 항목 초기화
        setCurrentItems([]);
        setSelectedItems([]);
      }
      
    } catch (error) {
      console.error('[EnhancedModalChatbot] AI 응답 처리 오류:', error);
      
      // 오류 발생 시에도 사용자 입력을 현재 필드에 반영
      if (currentField && onFieldUpdate) {
        console.log('[EnhancedModalChatbot] 오류 발생 시에도 필드 업데이트:', currentField.key, userInput);
        onFieldUpdate(currentField.key, userInput);
      }
      
      const errorMessage = {
        type: 'bot',
        content: '죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요.',
        timestamp: new Date(),
        id: `bot-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        responseType: 'conversation'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [aiService, currentField, formData, messages, fields, onFieldUpdate]);

  // sendMessage 함수를 ref에 저장
  sendMessageRef.current = handleAIResponse;

  // 키보드 이벤트 처리
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim() && sendMessageRef.current) {
        sendMessageRef.current(inputValue.trim());
      }
    }
  }, [inputValue]);

  // 자동완성 클릭 처리
  const handleAutoFill = useCallback((suggestion) => {
    console.log(`[DEBUG] 자동완성 선택됨: ${suggestion}`);
    
    // 자동완성 선택 시 즉시 필드 업데이트
    if (currentField && onFieldUpdate) {
      // 추천문구가 긴 경우 전체 내용을 그대로 사용
      const fieldValue = suggestion;
      
      console.log(`[DEBUG] 자동완성 필드 업데이트 - 필드: ${currentField.key}, 값: ${fieldValue}`);
      onFieldUpdate(currentField.key, fieldValue);
      
      // 필드 업데이트 후 다음 필드로 이동
      const currentFieldIndex = fields.findIndex(f => f.key === currentField.key);
      if (currentFieldIndex !== -1 && currentFieldIndex < fields.length - 1) {
        const nextField = fields[currentFieldIndex + 1];
        setCurrentField(nextField);
        // 다음 필드에 대한 추천 업데이트
        setAutoFillSuggestions(getFieldSuggestions(nextField.key, formData));
        
        // 다음 필드로 이동했다는 메시지 추가
        const nextFieldMessage = {
          type: 'bot',
          content: `좋습니다! 이제 **${nextField.label}**에 대해 알려주세요.`,
          timestamp: new Date(),
          id: `bot-next-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
        setMessages(prev => [...prev, nextFieldMessage]);
      } else {
        // 모든 필드가 완료되면 currentField를 null로 설정
        setCurrentField(null);
        setAutoFillSuggestions([]);
        setIsSuggestionsExpanded(false);
        
        // 완료 메시지 추가
        const completeMessage = {
          type: 'bot',
          content: `🎉 모든 정보 입력이 완료되었습니다! 채용공고 등록을 진행하겠습니다.`,
          timestamp: new Date(),
          id: `bot-complete-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
        setMessages(prev => [...prev, completeMessage]);
      }
    }
    
    // 자동완성 선택 시 접힌 상태로 변경
    setIsSuggestionsExpanded(false);
    
    // 즉시 메시지 전송 (사용자 메시지는 handleAIResponse에서 추가됨)
    if (sendMessageRef.current) {
      console.log(`[DEBUG] 자동완성 메시지 전송: ${suggestion}`);
      sendMessageRef.current(suggestion.trim());
    }
  }, [currentField, onFieldUpdate, fields, formData, messages]);

  // 대화종료 함수
  const handleEndConversation = useCallback(async () => {
    try {
      // 대화종료 메시지 표시
      const endMessage = {
        type: 'bot',
        content: "현재 채팅창을 닫고 대화를 종료합니다.",
        timestamp: new Date(),
        id: `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-end`
      };
      setMessages(prev => [...prev, endMessage]);
      
      // 3초 후에 실제 종료 처리
      const timeoutId = setTimeout(async () => {
        try {
          // AI 세션 종료
          await aiService.endSession();
          
          // 대화 초기화
          setMessages([]);
          setInputValue('');
          setCurrentField(null);
          setAutoFillSuggestions([]);
          setIsSuggestionsExpanded(false);
          
          // 모달 종료
          onClose();
          
          console.log('[EnhancedModalChatbot] 대화종료 완료');
        } catch (error) {
          console.error('[EnhancedModalChatbot] 대화종료 오류:', error);
          // 오류가 발생해도 모달은 종료
          onClose();
        }
      }, 3000);
      
      // 취소 버튼을 위한 메시지 추가 (1초 후)
      setTimeout(() => {
        const cancelMessage = {
          type: 'bot',
          content: "취소하려면 아래 버튼을 클릭하세요.",
          timestamp: new Date(),
          id: `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-cancel`,
          showCancelButton: true
        };
        setMessages(prev => [...prev, cancelMessage]);
      }, 1000);
      
    } catch (error) {
      console.error('[EnhancedModalChatbot] 대화종료 메시지 표시 오류:', error);
      // 오류가 발생해도 모달은 종료
      onClose();
    }
  }, [aiService, onClose]);

  // 취소 버튼 클릭 함수
  const handleCancelEndConversation = useCallback(() => {
    // 취소 메시지 표시
    const cancelConfirmMessage = {
      type: 'bot',
      content: "대화종료가 취소되었습니다. 계속해서 대화하실 수 있습니다.",
      timestamp: new Date(),
      id: `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-cancel-confirm`
    };
    setMessages(prev => [...prev, cancelConfirmMessage]);
  }, []);

  // 항목 선택 토글 함수
  const handleItemToggle = useCallback((itemId) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  }, []);

  // 모든 항목 선택/해제 함수
  const handleSelectAll = useCallback(() => {
    setSelectedItems(prev => {
      if (prev.length === currentItems.length) {
        return [];
      } else {
        return currentItems.map(item => item.id);
      }
    });
  }, [currentItems]);

  // 선택된 항목 등록 함수
  const handleRegisterSelectedItems = useCallback(() => {
    const selectedTexts = currentItems
      .filter(item => selectedItems.includes(item.id))
      .map(item => item.text)
      .join('\n');
    
    if (selectedTexts && onFieldUpdate && currentField) {
      onFieldUpdate(currentField.key, selectedTexts);
    }
    
    // 선택 상태 초기화
    setSelectedItems([]);
    setCurrentItems([]);
  }, [selectedItems, currentItems, onFieldUpdate, currentField]);

  // 항목 수정 함수
  const handleEditItems = useCallback(() => {
    const selectedTexts = currentItems
      .filter(item => selectedItems.includes(item.id))
      .map(item => item.text)
      .join('\n');
    
    setInputValue(selectedTexts);
  }, [selectedItems, currentItems]);

  // 모달이 열릴 때 챗봇 닫기
  useEffect(() => {
    if (isOpen) {
      console.log('EnhancedModalChatbot 모달이 열림 - 챗봇 닫기 이벤트 발생');
      const event = new CustomEvent('closeChatbot');
      window.dispatchEvent(event);
    }
  }, [isOpen]);

  // 모달 닫을 때 AI 세션 종료 및 타이머 정리
  useEffect(() => {
    return () => {
      if (isOpen) {
        aiService.endSession();
      }
      // 타이머 정리
      if (inputUpdateTimeout.current) {
        clearTimeout(inputUpdateTimeout.current);
      }
    };
  }, [isOpen, aiService]);

  console.log('[EnhancedModalChatbot] 렌더링, isOpen:', isOpen, 'aiAssistant:', aiAssistant);
  
  if (!isOpen) return null;

  return (
    <ModalOverlay key="enhanced-chatbot-overlay">
      <ModalContainer key="enhanced-chatbot-container">
        {/* Form Section */}
        {/* <FormSection>
          <SectionTitle>채용공고 정보 입력</SectionTitle>
          <form>
            {fields && fields.length > 0 ? (
              fields.map(field => (
                <FormField key={field.key}>
                  <label htmlFor={field.key}>
                    {field.label}
                    {field.required && <span style={{ color: 'red', marginLeft: '4px' }}>*</span>}
                    {currentField && currentField.key === field.key && (
                      <span style={{ 
                        color: '#667eea', 
                        marginLeft: '8px', 
                        fontSize: '0.9em',
                        fontWeight: 'bold'
                      }}>
                        🔄 진행 중...
                      </span>
                    )}
                  </label>
                  {field.type === 'textarea' ? (
                    <TextArea
                      id={field.key}
                      value={formData[field.key] || ''}
                      onChange={(e) => onFieldUpdate(field.key, e.target.value)}
                      disabled={false}
                      rows={4}
                      style={{
                        borderColor: currentField && currentField.key === field.key ? '#667eea' : '#cbd5e0',
                        boxShadow: currentField && currentField.key === field.key ? '0 0 0 3px rgba(102, 126, 234, 0.2)' : 'none'
                      }}
                    />
                  ) : (
                    <input
                      type={field.type}
                      id={field.key}
                      value={formData[field.key] || ''}
                      onChange={(e) => onFieldUpdate(field.key, e.target.value)}
                      disabled={false}
                      style={{
                        borderColor: currentField && currentField.key === field.key ? '#667eea' : '#cbd5e0',
                        boxShadow: currentField && currentField.key === field.key ? '0 0 0 3px rgba(102, 126, 234, 0.2)' : 'none'
                      }}
                    />
                  )}
                </FormField>
              ))
            ) : (
              <div style={{ 
                padding: '20px', 
                textAlign: 'center', 
                color: '#666',
                fontStyle: 'italic'
              }}>
                설정된 필드가 없습니다.
              </div>
            )}
            <ButtonGroup>
              <FormActionButton onClick={() => saveDraft(formData)}>초안 저장</FormActionButton>
              <FormActionButton $primary onClick={() => downloadPDF(formData, 'pdf')}>PDF 다운로드</FormActionButton>
            </ButtonGroup>
          </form>
        </FormSection> */}

        {/* Chatbot Section */}
        {aiAssistant && (
          <ChatbotSection>
            <ChatbotHeader>
              <span>AI 어시스턴트</span>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <EndConversationButton onClick={handleEndConversation}>
                  대화종료
                </EndConversationButton>
                <CloseButton onClick={onClose}>&times;</CloseButton>
              </div>
            </ChatbotHeader>

            <ChatbotMessages>
              {messages.map((message) => (
                <Message key={message.id} type={message.type}>
                  {message.content.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < message.content.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                  {message.showCancelButton && (
                    <div style={{ marginTop: '8px' }}>
                      <CancelButton onClick={handleCancelEndConversation}>
                        취소
                      </CancelButton>
                    </div>
                  )}
                  
                  {/* 선택형 응답인 경우 선택 UI 표시 */}
                  {message.responseType === 'selection' && message.selectableItems && message.selectableItems.length > 0 && (
                    <ItemSelectionContainer>
                      <div style={{ marginBottom: '12px', fontSize: '0.9em', color: '#4a5568' }}>
                        원하는 항목을 선택해주세요:
                      </div>
                      {message.selectableItems.map((item, index) => (
                        <ItemCard
                          key={`item-${message.id}-${index}`}
                          selected={selectedItems.includes(`item-${message.id}-${index}`)}
                          onClick={() => handleItemToggle(`item-${message.id}-${index}`)}
                        >
                          <Checkbox
                            type="checkbox"
                            checked={selectedItems.includes(`item-${message.id}-${index}`)}
                            onChange={() => handleItemToggle(`item-${message.id}-${index}`)}
                          />
                          <ItemText>{item.text || item}</ItemText>
                        </ItemCard>
                      ))}
                      <ActionButtons>
                        <ActionButton onClick={handleSelectAll}>
                          {selectedItems.length === message.selectableItems.length ? '모두 해제' : '모두 선택'}
                        </ActionButton>
                        <ActionButton onClick={handleEditItems} disabled={selectedItems.length === 0}>
                          수정
                        </ActionButton>
                        <ActionButton primary onClick={handleRegisterSelectedItems} disabled={selectedItems.length === 0}>
                          등록
                        </ActionButton>
                      </ActionButtons>
                    </ItemSelectionContainer>
                  )}
                  
                  {/* 기존 호환성을 위한 처리 */}
                  {message.showItemSelection && message.items && (
                    <ItemSelectionContainer>
                      <div style={{ marginBottom: '12px', fontSize: '0.9em', color: '#4a5568' }}>
                        원하는 항목을 선택해주세요:
                      </div>
                      {message.items.map((item) => (
                        <ItemCard
                          key={item.id}
                          selected={selectedItems.includes(item.id)}
                          onClick={() => handleItemToggle(item.id)}
                        >
                          <Checkbox
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={() => handleItemToggle(item.id)}
                          />
                          <ItemText>{item.text}</ItemText>
                        </ItemCard>
                      ))}
                      <ActionButtons>
                        <ActionButton onClick={handleSelectAll}>
                          {selectedItems.length === message.items.length ? '모두 해제' : '모두 선택'}
                        </ActionButton>
                        <ActionButton onClick={handleEditItems} disabled={selectedItems.length === 0}>
                          수정
                        </ActionButton>
                        <ActionButton primary onClick={handleRegisterSelectedItems} disabled={selectedItems.length === 0}>
                          등록
                        </ActionButton>
                      </ActionButtons>
                    </ItemSelectionContainer>
                  )}
                </Message>
              ))}
              {isLoading && (
                <TypingIndicator>
                  <span></span><span></span><span></span>
                </TypingIndicator>
              )}
              <div ref={messagesEndRef} />
            </ChatbotMessages>

            <ChatbotInput>
              {/* 자동완성 제안 */}
              {autoFillSuggestions.length > 0 && (
                <SuggestionsContainer $isExpanded={isSuggestionsExpanded}>
                  <SuggestionsToggle
                    $isExpanded={isSuggestionsExpanded}
                    onClick={() => setIsSuggestionsExpanded(!isSuggestionsExpanded)}
                  >
                    <span style={{ fontSize: '1.1em' }}>⚡</span>
                    <span>추천 리스트 보기</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.8em', opacity: 0.8 }}>
                      {isSuggestionsExpanded ? '접기' : '펼치기'}
                    </span>
                  </SuggestionsToggle>
                  
                  <SuggestionsContent $isExpanded={isSuggestionsExpanded}>
                    <SuggestionsGrid>
                      {autoFillSuggestions.map((suggestion) => (
                        <AutoFillButton
                          key={suggestion}
                          onClick={() => handleAutoFill(suggestion)}
                          disabled={isLoading}
                        >
                          <span>⚡</span>
                          {suggestion}
                        </AutoFillButton>
                      ))}
                    </SuggestionsGrid>
                  </SuggestionsContent>
                </SuggestionsContainer>
              )}
              
              <InputArea>
                <TextArea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setInputValue(newValue);
                    
                    // 실시간 필드 업데이트 (입력 중에도 반영)
                    if (currentField && newValue.trim().length > 0) {
                      // 약간의 지연을 두어 타이핑 중에는 업데이트하지 않음
                      clearTimeout(inputUpdateTimeout.current);
                      inputUpdateTimeout.current = setTimeout(() => {
                        if (onFieldUpdate) {
                          console.log('[EnhancedModalChatbot] 실시간 필드 업데이트:', currentField.key, newValue.trim());
                          onFieldUpdate(currentField.key, newValue.trim());
                        }
                      }, 1000); // 1초 후 업데이트
                    }
                  }}
                  onKeyDown={handleKeyPress}
                  placeholder="궁금한 점을 물어보거나 답변을 입력하세요..."
                  rows={3}
                  disabled={isLoading}
                />
                <SendButton
                  onClick={() => sendMessageRef.current && sendMessageRef.current(inputValue.trim())}
                  disabled={isLoading || !inputValue.trim()}
                >
                  전송
                </SendButton>
              </InputArea>
            </ChatbotInput>
          </ChatbotSection>
        )}
      </ModalContainer>
    </ModalOverlay>
  );
};

export default EnhancedModalChatbot;
