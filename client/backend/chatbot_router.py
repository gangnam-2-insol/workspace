from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
import json
import re
from llm_service import LLMService  # 내부에 LLM 호출 로직 포함
from question_data import get_questions_for_page  # 기존 질문 리스트 불러오기용

router = APIRouter()
sessions: Dict[str, Dict[str, Any]] = {}

class ChatbotRequest(BaseModel):
    page: str
    user_input: str
    session_id: Optional[str] = None

class ChatbotResponse(BaseModel):
    field: Optional[str] = None
    value: Optional[str] = None
    message: str
    session_id: Optional[str] = None
    mode: str = "normal"  # "normal", "guided", "chat"

class SessionStartRequest(BaseModel):
    page: str
    questions: Optional[List[Dict[str, str]]] = None  # 외부 질문 리스트 동적 입력 허용

class SessionStartResponse(BaseModel):
    session_id: str
    current_field: str
    question: str

def detect_keywords(user_input: str) -> Dict[str, Any]:
    """
    사용자 입력에서 키워드를 감지하여 모드를 결정합니다.
    """
    input_lower = user_input.lower()
    
    # 키워드 패턴 정의 (우선순위 순)
    keywords = {
        "recruitment": [
            "채용", "구인", "공고", "모집", "채용공고", "구인공고", "채용정보", 
            "직무", "업무", "근무", "연봉", "급여", "복리후생", "근무지", "마감일",
            "자격요건", "우대사항", "필수조건", "선호조건"
        ],
        "resume": [
            "이력서", "자기소개서", "경력", "학력", "포트폴리오", "스킬", "기술스택",
            "프로젝트", "수상", "자격증", "언어능력", "외국어", "컴퓨터활용능력"
        ],
        "interview": [
            "면접", "인터뷰", "질문", "평가", "면접관", "면접자", "면접일정",
            "면접시간", "면접장소", "면접준비", "면접팁", "면접질문"
        ],
        "dashboard": [
            "대시보드", "현황", "통계", "현재상황", "요약", "개요", "현재상태",
            "지원자", "지원현황", "채용현황", "면접현황", "통계보기"
        ],
        "help": [
            "도움", "도움말", "사용법", "가이드", "설명", "어떻게", "방법",
            "사용방법", "이용법", "도움주세요", "알려주세요", "가르쳐주세요"
        ],
        "general_chat": [
            "안녕", "반갑", "고마워", "감사", "좋아", "괜찮아", "맞아", "그래",
            "네", "응", "알겠어", "이해했어", "그렇구나", "그런가", "아하"
        ],
        "system": [
            "시스템", "오류", "에러", "문제", "버그", "작동안됨", "안돼", "안됨",
            "로그인", "회원가입", "비밀번호", "아이디", "계정"
        ]
    }
    
    # 문맥 기반 키워드 (더 정확한 감지를 위해)
    context_keywords = {
        "question_words": ["뭐", "무엇", "어떤", "어떻게", "왜", "언제", "어디", "누가", "몇"],
        "action_words": ["해주세요", "해줘", "알려줘", "보여줘", "찾아줘", "추천해줘"],
        "confirmation_words": ["맞나", "맞아", "그래", "네", "응", "좋아", "괜찮아"]
    }
    
    detected_keywords = []
    detected_categories = []
    
    # 기본 키워드 감지
    for category, keyword_list in keywords.items():
        for keyword in keyword_list:
            if keyword in input_lower:
                detected_keywords.append(keyword)
                detected_categories.append(category)
                break
    
    # 문맥 키워드 감지
    context_detected = []
    for context_type, context_list in context_keywords.items():
        for keyword in context_list:
            if keyword in input_lower:
                context_detected.append(context_type)
                break
    
    # 모드 결정 로직 개선
    if detected_categories:
        # 우선순위: 기능별 키워드 > 도움말 > 일반 채팅
        if any(k in detected_categories for k in ["recruitment", "resume", "interview"]):
            return {"mode": "guided", "keywords": detected_keywords, "categories": detected_categories}
        elif any(k in detected_categories for k in ["dashboard", "help", "system"]):
            return {"mode": "guided", "keywords": detected_keywords, "categories": detected_categories}
        elif "general_chat" in detected_categories:
            return {"mode": "chat", "keywords": detected_keywords, "categories": detected_categories}
    
    # 키워드가 없지만 문맥상 질문인 경우
    if context_detected:
        if "question_words" in context_detected:
            # 질문 형태이지만 특정 키워드가 없으면 일반 채팅
            return {"mode": "chat", "keywords": [], "categories": [], "context": context_detected}
        elif "action_words" in context_detected:
            # 요청 형태이지만 특정 키워드가 없으면 일반 채팅
            return {"mode": "chat", "keywords": [], "categories": [], "context": context_detected}
    
    # 아무 키워드도 없으면 일반 채팅으로 처리
    return {"mode": "chat", "keywords": [], "categories": [], "context": context_detected}

# 세션 시작 (외부에서 질문 리스트 주입 가능)
@router.post("/start", response_model=SessionStartResponse)
async def start_session(request: SessionStartRequest):
    # 외부 질문 리스트가 있으면 우선 사용, 없으면 기존 질문 가져오기
    questions = request.questions or get_questions_for_page(request.page)
    if not questions:
        raise HTTPException(status_code=404, detail="페이지 질문을 찾을 수 없습니다")

    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "page": request.page,
        "questions": questions,
        "current_index": 0,
        "current_field": questions[0]["field"],
        "completed_fields": [],
        "conversation_history": [],
        "mode": "guided"  # 기본 모드
    }
    return SessionStartResponse(
        session_id=session_id,
        current_field=questions[0]["field"],
        question=questions[0]["question"]
    )

@router.post("/ask", response_model=ChatbotResponse)
async def ask_chatbot(request: ChatbotRequest):
    if not request.session_id or request.session_id not in sessions:
        raise HTTPException(status_code=400, detail="유효하지 않은 세션입니다")

    session = sessions[request.session_id]
    
    # 키워드 감지 및 모드 결정
    keyword_result = detect_keywords(request.user_input)
    current_mode = keyword_result["mode"]
    
    # 대화 히스토리에 사용자 입력 저장
    session["conversation_history"].append({
        "role": "user",
        "content": request.user_input,
        "field": session.get("current_field"),
        "mode": current_mode
    })

    llm_service = LLMService()
    
    if current_mode == "chat":
        # 일반 채팅 모드 - 자유로운 대화
        response = await handle_chat_mode(request, session, llm_service)
    else:
        # 가이드 모드 - 기존 기능별 질문 처리
        response = await handle_guided_mode(request, session, llm_service)
    
    # 대화 히스토리에 챗봇 응답 저장
    session["conversation_history"].append({
        "role": "bot",
        "content": response["message"],
        "field": response.get("field"),
        "mode": current_mode
    })

    return ChatbotResponse(
        field=response.get("field"),
        value=response.get("value"),
        message=response["message"],
        session_id=request.session_id,
        mode=current_mode
    )

async def handle_chat_mode(request: ChatbotRequest, session: Dict, llm_service: LLMService) -> Dict[str, Any]:
    """
    일반 채팅 모드 처리 - 자유로운 대화
    """
    chat_prompt = f"""
당신은 친근하고 도움이 되는 AI 비서입니다.
사용자는 인사담당자로, 구인구직 업무를 담당하고 있습니다.

**당신의 역할:**
- 구인구직 전문가로서 실용적인 조언 제공
- 인사담당자의 업무 효율성 향상 지원
- 친근하고 자연스러운 대화 스타일 유지
- 구인구직 관련 질문에 대한 전문적인 답변

**구인구직 전문 지식:**
- 채용공고 작성 및 최적화
- 이력서 검토 및 평가 방법
- 면접 질문 및 평가 기준
- 구인구직 트렌드 및 법규
- 인사 관리 및 조직 문화

**응답 스타일:**
- 친근하고 존댓말 사용
- 구체적이고 실용적인 조언 제공
- 필요시 예시나 사례 포함
- 사용자의 상황에 맞는 맞춤형 답변
- 전문적이면서도 이해하기 쉬운 설명

**현재 페이지**: {request.page}
**사용자 입력**: {request.user_input}

사용자와 자연스럽게 대화하며, 구인구직 관련 질문이나 일반적인 대화 모두에 친절하게 응답해주세요.
"""

    try:
        # 일반 채팅용 메시지 구성
        context_messages = [
            {"role": "user", "parts": [chat_prompt]}
        ]
        
        # 최근 대화 히스토리 추가 (최근 4턴)
        if session["conversation_history"]:
            recent_history = session["conversation_history"][-8:]  # 최근 4턴
            for msg in recent_history:
                if msg["role"] == "user":
                    context_messages.append({"role": "user", "parts": [msg["content"]]})
                elif msg["role"] == "bot":
                    context_messages.append({"role": "model", "parts": [msg["content"]]})
        
        # 현재 사용자 입력 추가
        context_messages.append({"role": "user", "parts": [request.user_input]})
        
        # Gemini API 호출
        response = llm_service.client.generate_content(context_messages)
        
        return {
            "field": None,
            "value": None,
            "message": response.text
        }
        
    except Exception as e:
        return {
            "field": None,
            "value": None,
            "message": f"죄송합니다. 대화 처리 중 오류가 발생했습니다: {str(e)}"
        }

async def handle_guided_mode(request: ChatbotRequest, session: Dict, llm_service: LLMService) -> Dict[str, Any]:
    """
    가이드 모드 처리 - 기존 기능별 질문 처리
    """
    current_index = session["current_index"]
    questions = session["questions"]
    current_field = session["current_field"]
    current_question = questions[current_index]["question"]

    # 기존 LLM 처리 로직
    llm_response = await llm_service.process_user_input(
        page=request.page,
        field=current_field,
        user_input=request.user_input,
        conversation_history=session["conversation_history"],
        questions=questions,
        current_index=current_index
    )

    # LLM 응답에서 데이터 추출
    value = llm_response.get("value")
    field = llm_response.get("field")
    message = llm_response.get("message", "")

    # 확정 답변이 있으면 다음 질문으로 이동
    if value is not None and field == current_field:
        if current_field not in session["completed_fields"]:
            session["completed_fields"].append(current_field)
        session["current_index"] += 1
        if session["current_index"] < len(questions):
            session["current_field"] = questions[session["current_index"]]["field"]
        else:
            message += "\n\n모든 질문에 답변해 주셔서 감사합니다! 🎉"

    return {
        "field": field,
        "value": value,
        "message": message
    } 