from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import uuid
import asyncio
import json
from datetime import datetime
import os
from dotenv import load_dotenv
import traceback
import re
import google.generativeai as genai
import numpy as np # numpy 라이브러리 추가

# 환경 변수 로드
load_dotenv()

# Gemini 모델 초기화
try:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY 환경 변수가 설정되지 않았습니다.")
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-pro')
    embedding_model = 'models/text-embedding-004' # 임베딩 모델 정의
    print("Gemini 모델 초기화 성공")
except Exception as e:
    print(f"Gemini 모델 초기화 실패: {e}")
    model = None

# ---- RAG를 위한 임시 벡터 저장 및 검색 로직 추가 시작 ----

# 임시로 사용할 문서 데이터
temporary_docs = [
    "Gemini 모델은 텍스트, 이미지 등 다양한 유형의 데이터를 처리할 수 있습니다. 멀티모달 기능을 통해 복잡한 질문에도 답변할 수 있습니다.",
    "Gemini 1.5 Pro는 1백만 토큰의 컨텍스트 윈도우를 지원하여 방대한 양의 정보를 한 번에 처리하고 이해할 수 있습니다.",
    "Gemini API는 Google AI Studio와 Google Cloud Vertex AI에서 사용할 수 있으며, 다양한 개발 환경을 지원합니다.",
    "RAG(Retrieval-Augmented Generation)는 외부 데이터를 활용해 LLM의 답변 품질을 높이는 기술입니다. 이를 통해 LLM은 학습되지 않은 최신 정보에도 답변할 수 있습니다.",
    "벡터 검색은 텍스트를 숫자의 배열(벡터)로 변환하고, 이 벡터 간의 유사도를 계산하여 가장 관련성이 높은 문서를 찾는 기술입니다.",
    "코사인 유사도(Cosine Similarity)는 두 벡터의 방향이 얼마나 일치하는지를 나타내는 지표로, 벡터 검색에서 문서 간의 유사성을 측정하는 데 널리 사용됩니다."
]

# 문서 벡터화 (초기화 시 한 번만 실행)
try:
    temporary_embeddings = genai.embed_content(
        model=embedding_model,
        content=temporary_docs,
        task_type="RETRIEVAL_DOCUMENT"
    )['embedding']
    temporary_embeddings_np = np.array(temporary_embeddings)
    print("임시 문서 임베딩 생성 성공")
except Exception as e:
    print(f"임시 문서 임베딩 생성 실패: {e}")
    temporary_embeddings_np = None

async def find_relevant_document(user_query: str) -> str:
    """
    사용자 입력과 가장 유사한 임시 문서를 찾아 반환합니다.
    """
    if temporary_embeddings_np is None or not temporary_docs:
        print("[WARNING] 임시 문서 또는 임베딩이 없어 RAG를 사용할 수 없습니다.")
        return ""

    try:
        # 사용자 질문 벡터화
        query_embedding = (await genai.embed_content_async(
            model=embedding_model,
            content=user_query,
            task_type="RETRIEVAL_QUERY"
        ))['embedding']
        
        query_embedding_np = np.array(query_embedding)
        
        # 코사인 유사도 계산
        # (A · B) / (||A|| * ||B||)
        similarities = np.dot(query_embedding_np, temporary_embeddings_np.T)
        
        # 가장 높은 유사도를 가진 문서의 인덱스 찾기
        most_similar_index = np.argmax(similarities)
        
        # 가장 유사한 문서 반환
        return temporary_docs[most_similar_index]
    except Exception as e:
        print(f"[ERROR] 유사 문서 검색 실패: {e}")
        traceback.print_exc()
        return ""

# ---- RAG를 위한 임시 벡터 저장 및 검색 로직 추가 끝 ----

# 의도 감지 유틸리티
HARDCODED_FIELDS = {
    "UI/UX 디자인": "지원 분야: UI/UX 디자인으로 설정되었습니다.",
    "그래픽 디자인": "지원 분야: 그래픽 디자인으로 설정되었습니다.",
    "Figma 경험": "사용 툴: Figma로 등록했습니다.",
    "개발팀": "부서: 개발팀으로 설정되었습니다.",
    "마케팅팀": "부서: 마케팅팀으로 설정되었습니다.",
    "영업팀": "부서: 영업팀으로 설정되었습니다.",
    "디자인팀": "부서: 디자인팀으로 설정되었습니다.",
}

def classify_input(text: str) -> dict:
    """
    키워드 기반 1차 분류 함수 (개선된 버전)
    """
    text_lower = text.lower()
    text_length = len(text.strip())
    
    # 질문 키워드 감지 (가장 먼저 체크)
    question_keywords = [
        "어떻게", "왜", "무엇", "뭐", "언제", "어디", "추천", "기준", "장점", "단점", "차이", 
        "있을까", "있나요", "어떤", "무슨", "궁금", "알려줘", "설명해줘", "몇명", "몇 명", 
        "얼마나", "어느 정도", "어떤 정도", "좋을까", "될까", "할까", "인가요", "일까",
        "어때", "어떠", "어떻", "어떤가", "어떤지", "어떤지요", "어떤가요", "어떤지요",
        "어떻게", "어떡", "어떻", "어떤", "어떤지", "어떤가", "어떤지요", "어떤가요"
    ]
    
    # 질문 키워드가 포함되어 있거나 문장이 "?"로 끝나는 경우
    if any(keyword in text_lower for keyword in question_keywords) or text.strip().endswith("?"):
        matched_keywords = [kw for kw in question_keywords if kw in text_lower]
        print(f"[DEBUG] 질문으로 분류됨 - 매칭된 질문 키워드: {matched_keywords}")
        return {'type': 'question', 'category': 'general', 'confidence': 0.8}
    
    # 긴 텍스트는 추천문구로 간주 (주요업무 등)
    # 단, 부서 관련 키워드가 포함된 긴 문구는 부서가 아닌 주요업무로 처리
    if text_length > 30:
        # 마케팅, 브랜드, 전략 등의 키워드가 포함된 긴 문구는 주요업무로 분류
        business_keywords = ["마케팅", "브랜드", "전략", "개발", "디자인", "기획", "분석", "관리", "운영", "실행", "수립"]
        if any(keyword in text_lower for keyword in business_keywords):
            return {'type': 'answer', 'category': '주요업무', 'confidence': 0.9}
        else:
            return {'type': 'answer', 'category': '추천문구', 'confidence': 0.9}
    
    # 채용 관련 키워드 분류
    if any(keyword in text_lower for keyword in ["채용 인원", "몇 명", "인원수", "채용인원"]):
        return {'type': 'question', 'category': '채용 인원', 'confidence': 0.8}
    
    if any(keyword in text_lower for keyword in ["주요 업무", "업무 내용", "담당 업무", "직무"]):
        return {'type': 'question', 'category': '주요 업무', 'confidence': 0.8}
    
    if any(keyword in text_lower for keyword in ["근무 시간", "근무시간", "출근 시간", "퇴근 시간"]):
        return {'type': 'question', 'category': '근무 시간', 'confidence': 0.8}
    
    if any(keyword in text_lower for keyword in ["급여", "연봉", "월급", "보수", "임금"]):
        return {'type': 'question', 'category': '급여 조건', 'confidence': 0.8}
    
    if any(keyword in text_lower for keyword in ["근무 위치", "근무지", "사무실", "오피스"]):
        return {'type': 'question', 'category': '근무 위치', 'confidence': 0.8}
    
    if any(keyword in text_lower for keyword in ["마감일", "지원 마감", "채용 마감", "마감"]):
        return {'type': 'question', 'category': '마감일', 'confidence': 0.8}
    
    if any(keyword in text_lower for keyword in ["이메일", "연락처", "contact", "email"]):
        return {'type': 'question', 'category': '연락처 이메일', 'confidence': 0.8}
    
    # 부서 관련 키워드 (팀 없이도 인식)
    if any(keyword in text_lower for keyword in ["개발팀", "개발", "프로그래밍", "코딩", "개발자"]):
        return {'type': 'field', 'category': '부서', 'value': '개발팀', 'confidence': 0.9}
    
    if any(keyword in text_lower for keyword in ["마케팅팀", "마케팅", "홍보", "광고", "마케터"]):
        return {'type': 'field', 'category': '부서', 'value': '마케팅팀', 'confidence': 0.9}
    
    if any(keyword in text_lower for keyword in ["영업팀", "영업", "세일즈", "영업사원"]):
        return {'type': 'field', 'category': '부서', 'value': '영업팀', 'confidence': 0.9}
    
    if any(keyword in text_lower for keyword in ["디자인팀", "디자인", "UI/UX", "그래픽", "디자이너"]):
        return {'type': 'field', 'category': '부서', 'value': '디자인팀', 'confidence': 0.9}
    
    if any(keyword in text_lower for keyword in ["기획팀", "기획", "기획자", "PM", "프로덕트"]):
        return {'type': 'field', 'category': '부서', 'value': '기획팀', 'confidence': 0.9}
    
    if any(keyword in text_lower for keyword in ["인사팀", "인사", "HR", "인사담당", "채용"]):
        return {'type': 'field', 'category': '부서', 'value': '인사팀', 'confidence': 0.9}
    
    # 일상 대화 키워드
    chat_keywords = ["안녕", "반가워", "고마워", "감사", "좋아", "싫어", "그래", "응", "네", "아니"]
    if any(keyword in text_lower for keyword in chat_keywords):
        return {'type': 'chat', 'category': '일상대화', 'confidence': 0.7}
    
    # 기본값: 답변으로 처리
    return {'type': 'answer', 'category': 'general', 'confidence': 0.6}

def classify_input_with_context(text: str, current_field: str = None) -> dict:
    """
    현재 필드 컨텍스트를 고려한 분류 함수
    """
    text_lower = text.lower()
    text_length = len(text.strip())
    
    print(f"[DEBUG] ===== classify_input_with_context 시작 =====")
    print(f"[DEBUG] 입력 텍스트: {text}")
    print(f"[DEBUG] 현재 필드: {current_field}")
    
    # 필드별 주 카테고리 매칭
    field_categories = {
        'department': {
            'keywords': ['개발팀', '마케팅팀', '영업팀', '디자인팀', '기획팀', '인사팀', '개발', '마케팅', '영업', '디자인', '기획', '인사'],
            'extract_value': True
        },
        'headcount': {
            'keywords': ['명', '인원', '사람', '명', '1명', '2명', '3명', '4명', '5명', '6명', '7명', '8명', '9명', '10명'],
            'extract_value': True,
            'extract_number': True
        },
        'mainDuties': {
            'keywords': ['개발', '디자인', '마케팅', '영업', '기획', '관리', '운영', '분석', '설계', '테스트', '유지보수'],
            'extract_value': True
        },
        'workHours': {
            'keywords': ['시', '분', '시간', '09:00', '10:00', '18:00', '19:00', '유연근무', '재택근무'],
            'extract_value': True
        },
        'location': {
            'keywords': ['서울', '부산', '대구', '인천', '대전', '광주', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'],
            'extract_value': True
        },
        'salary': {
            'keywords': ['만원', '원', '연봉', '월급', '급여', '보수', '임금', '면접', '협의'],
            'extract_value': True,
            'extract_number': True
        },
        'deadline': {
            'keywords': ['년', '월', '일', '마감', '지원', '채용', '마감일'],
            'extract_value': True
        },
        'contactEmail': {
            'keywords': ['@', '이메일', 'email', '메일', 'mail'],
            'extract_value': True
        }
    }
    
    # 질문 키워드 감지 (가장 먼저 체크)
    question_keywords = [
        "어떻게", "왜", "무엇", "뭐", "언제", "어디", "추천", "기준", "장점", "단점", "차이", 
        "있을까", "있나요", "어떤", "무슨", "궁금", "알려줘", "설명해줘", "몇명", "몇 명", 
        "얼마나", "어느 정도", "어떤 정도", "좋을까", "될까", "할까", "인가요", "일까",
        "어때", "어떠", "어떻", "어떤가", "어떤지", "어떤지요", "어떤가요", "어떤지요",
        "어떻게", "어떡", "어떻", "어떤", "어떤지", "어떤가", "어떤지요", "어떤가요"
    ]
    
    # 질문 키워드가 포함되어 있거나 문장이 "?"로 끝나는 경우
    if any(keyword in text_lower for keyword in question_keywords) or text.strip().endswith("?"):
        matched_keywords = [kw for kw in question_keywords if kw in text_lower]
        print(f"[DEBUG] 질문으로 분류됨 - 매칭된 질문 키워드: {matched_keywords}")
        return {'type': 'question', 'category': 'general', 'confidence': 0.8}
    
    # 현재 필드에 대한 컨텍스트 검토
    if current_field and current_field in field_categories:
        field_config = field_categories[current_field]
        print(f"[DEBUG] 필드 '{current_field}'의 키워드 검사 시작")
        print(f"[DEBUG] 필드 키워드 목록: {field_config['keywords']}")
        
        # 해당 필드의 키워드가 포함되어 있는지 확인
        matched_keywords = [kw for kw in field_config['keywords'] if kw in text_lower]
        print(f"[DEBUG] 매칭된 답변 키워드: {matched_keywords}")
        
        if matched_keywords:
            print(f"[DEBUG] 답변 키워드 감지됨 - 맥락 검토 시작")
            # 맥락 검토: 실제 답변인지 확인
            if is_valid_answer_for_field(text, current_field):
                print(f"[DEBUG] 맥락 검토 통과 - 값 추출 시작")
                extracted_value = extract_field_value(text, current_field, field_config)
                print(f"[DEBUG] 추출된 값: {extracted_value}")
                result = {
                    'type': 'answer', 
                    'category': current_field, 
                    'value': extracted_value,
                    'confidence': 0.9
                }
                print(f"[DEBUG] 답변으로 분류됨: {result}")
                return result
            else:
                print(f"[DEBUG] 맥락 검토 실패 - 답변으로 분류하지 않음")
        else:
            print(f"[DEBUG] 답변 키워드 없음")
    
    # 기존 분류 로직 (필드별 컨텍스트가 없는 경우)
    print(f"[DEBUG] 기존 분류 로직 사용")
    result = classify_input(text)
    print(f"[DEBUG] 최종 분류 결과: {result}")
    return result

def is_valid_answer_for_field(text: str, field: str) -> bool:
    """
    해당 필드에 대한 유효한 답변인지 검토
    """
    text_lower = text.lower()
    
    print(f"[DEBUG] ===== is_valid_answer_for_field 검토 시작 =====")
    print(f"[DEBUG] 검토 텍스트: {text}")
    print(f"[DEBUG] 검토 필드: {field}")
    
    # 부정적인 표현이나 질문성 표현이 포함된 경우 제외
    negative_patterns = ['모르겠', '잘 모르', '몰라', '궁금', '어떻게', '왜', '뭐']
    negative_matches = [pattern for pattern in negative_patterns if pattern in text_lower]
    if negative_matches:
        print(f"[DEBUG] 부정적 표현 감지됨: {negative_matches} - 유효하지 않음")
        return False
    
    # 너무 짧거나 너무 긴 경우 제외
    if len(text.strip()) < 2 or len(text.strip()) > 200:
        print(f"[DEBUG] 길이 검사 실패 - 길이: {len(text.strip())} - 유효하지 않음")
        return False
    
    # 필드별 유효성 검사
    if field == 'headcount':
        # 숫자가 포함되어야 함
        import re
        numbers = re.findall(r'\d+', text)
        if not numbers:
            print(f"[DEBUG] headcount 필드 - 숫자 없음 - 유효하지 않음")
            return False
        else:
            print(f"[DEBUG] headcount 필드 - 숫자 감지됨: {numbers}")
    
    elif field == 'contactEmail':
        # 이메일 형식이어야 함
        import re
        if not re.search(r'@', text):
            print(f"[DEBUG] contactEmail 필드 - @ 없음 - 유효하지 않음")
            return False
        else:
            print(f"[DEBUG] contactEmail 필드 - @ 감지됨")
    
    print(f"[DEBUG] 모든 검토 통과 - 유효함")
    return True

def extract_field_value(text: str, field: str, field_config: dict) -> str:
    """
    필드에 맞는 값 추출 (대화형 입력 고려) - 개선된 버전
    """
    import re
    
    print(f"[DEBUG] ===== extract_field_value 시작 =====")
    print(f"[DEBUG] 원본 텍스트: {text}")
    print(f"[DEBUG] 대상 필드: {field}")
    print(f"[DEBUG] 필드 설정: {field_config}")
    
    # 텍스트 정리 (대화형 입력에서 불필요한 부분 제거)
    cleaned_text = text.strip()
    
    if field == 'headcount':
        # 숫자만 추출 (개선된 패턴)
        numbers = re.findall(r'\d+', cleaned_text)
        if numbers:
            # 가장 큰 숫자를 선택 (예: "신입 2명, 경력 1명 총 3명" → "3명")
            max_number = max(numbers, key=int)
            extracted = max_number + '명'
            print(f"[DEBUG] headcount - 숫자 추출: {max_number} → {extracted}")
            return extracted
        
        # "명"이 포함된 경우 숫자 추출 시도
        if '명' in cleaned_text:
            # "2명 정도", "3명 정도" 등의 패턴에서 숫자 추출
            number_match = re.search(r'(\d+)명', cleaned_text)
            if number_match:
                number = number_match.group(1)
                extracted = number + '명'
                print(f"[DEBUG] headcount - '명' 포함 숫자 추출: {number} → {extracted}")
                return extracted
            
            # "한 명", "두 명" 등의 한글 숫자 처리
            korean_numbers = {
                '한': '1', '두': '2', '세': '3', '네': '4', '다섯': '5',
                '여섯': '6', '일곱': '7', '여덟': '8', '아홉': '9', '열': '10'
            }
            for korean, arabic in korean_numbers.items():
                if f"{korean} 명" in cleaned_text:
                    extracted = arabic + '명'
                    print(f"[DEBUG] headcount - 한글 숫자 추출: {korean} → {extracted}")
                    return extracted
        
        # 숫자 + "명" 패턴이 없는 경우, 숫자만 추출
        if numbers:
            max_number = max(numbers, key=int)
            extracted = max_number + '명'
            print(f"[DEBUG] headcount - 숫자만 추출: {max_number} → {extracted}")
            return extracted
        
        print(f"[DEBUG] headcount - 숫자 없음, 원본 반환")
        return cleaned_text
    
    elif field == 'salary':
        # 숫자만 추출 (개선된 패턴)
        numbers = re.findall(r'\d+', cleaned_text)
        if numbers:
            # 가장 큰 숫자를 선택 (예: "신입은 3000만원, 경력은 5000만원" → "5000만원")
            max_number = max(numbers, key=int)
            extracted = max_number + '만원'
            print(f"[DEBUG] salary - 숫자 추출: {max_number} → {extracted}")
            return extracted
        print(f"[DEBUG] salary - 숫자 없음, 원본 반환")
        return cleaned_text
    
    elif field == 'department':
        # 부서명 추출 (대화형 입력 고려) - 개선된 로직
        department_keywords = ['개발팀', '마케팅팀', '영업팀', '디자인팀', '기획팀', '인사팀', '개발', '마케팅', '영업', '디자인', '기획', '인사']
        
        # 우선순위가 높은 키워드부터 검색
        for keyword in ['개발팀', '마케팅팀', '영업팀', '디자인팀', '기획팀', '인사팀']:
            if keyword in cleaned_text:
                print(f"[DEBUG] department - 부서명 추출: {keyword}")
                return keyword
        
        # 단일 키워드 검색
        for keyword in ['개발', '마케팅', '영업', '디자인', '기획', '인사']:
            if keyword in cleaned_text:
                keyword_with_team = keyword + '팀'
                print(f"[DEBUG] department - 부서명 추출: {keyword_with_team}")
                return keyword_with_team
        
        print(f"[DEBUG] department - 부서명 없음, 원본 반환")
        return cleaned_text
    
    elif field == 'mainDuties':
        # 주요 업무 추출 (대화형 입력 고려) - 개선된 로직
        duty_keywords = [
            '웹개발', '앱개발', '모바일개발', '서버개발', '프론트엔드', '백엔드', '풀스택', 'UI/UX', 'UI디자인', 'UX디자인', '그래픽디자인', '편집디자인', '패키지디자인',
            '브랜드마케팅', '디지털마케팅', '콘텐츠마케팅', 'SNS마케팅', '퍼포먼스마케팅',
            '데이터분석', 'AI개발', '프로그래밍', '코딩', '브랜딩',
            '개발', '디자인', '마케팅', '영업', '기획', '관리', '운영', '분석', '설계', '테스트', '유지보수',
            '광고', '홍보', '콘텐츠', 'SNS', '고객관리', '매출관리', '전략기획', '사업기획', '제품기획'
        ]
        
        # 우선순위가 높은 키워드부터 검색 (더 구체적인 키워드 우선)
        priority_keywords = ['웹개발', '앱개발', '모바일개발', '서버개발', '프론트엔드', '백엔드', '풀스택', 
                           'UI/UX', 'UI디자인', 'UX디자인', '그래픽디자인', '편집디자인', '패키지디자인',
                           '브랜드마케팅', '디지털마케팅', '콘텐츠마케팅', 'SNS마케팅', '퍼포먼스마케팅',
                           '데이터분석', 'AI개발', '프로그래밍', '코딩']
        
        for keyword in priority_keywords:
            if keyword in cleaned_text:
                print(f"[DEBUG] mainDuties - 우선순위 업무 추출: {keyword}")
                return keyword
        
        # 일반 키워드 검색
        general_keywords = ['개발', '디자인', '마케팅', '영업', '기획', '관리', '운영', '분석', '설계', '테스트', '유지보수']
        for keyword in general_keywords:
            if keyword in cleaned_text:
                print(f"[DEBUG] mainDuties - 일반 업무 추출: {keyword}")
                return keyword
        
        print(f"[DEBUG] mainDuties - 업무 없음, 원본 반환")
        return cleaned_text
    
    elif field == 'workHours':
        # 근무 시간 추출 (개선된 패턴)
        time_patterns = [
            r'\d{1,2}:\d{2}-\d{1,2}:\d{2}',  # 09:00-18:00 형태
            r'오전 \d{1,2}시', r'오후 \d{1,2}시',  # 오전 9시, 오후 6시
            r'유연근무', r'재택근무', r'시차출근'
        ]
        
        for pattern in time_patterns:
            matches = re.findall(pattern, cleaned_text)
            if matches:
                print(f"[DEBUG] workHours - 시간 패턴 추출: {matches[0]}")
                return matches[0]
        
        # "오전 9시부터 오후 6시까지" 형태의 패턴 처리
        if '오전' in cleaned_text and '오후' in cleaned_text:
            morning_match = re.search(r'오전 (\d{1,2})시', cleaned_text)
            afternoon_match = re.search(r'오후 (\d{1,2})시', cleaned_text)
            if morning_match and afternoon_match:
                morning_hour = morning_match.group(1)
                afternoon_hour = afternoon_match.group(1)
                extracted = f"{morning_hour.zfill(2)}:00-{afternoon_hour.zfill(2)}:00"
                print(f"[DEBUG] workHours - 오전/오후 시간 추출: {extracted}")
                return extracted
        
        # 시간 관련 키워드가 있는지 확인
        time_keywords = ['시', '시간', '출근', '근무']
        if any(keyword in cleaned_text for keyword in time_keywords):
            # 시간 정보가 포함된 문장에서 시간 부분만 추출
            time_match = re.search(r'(\d{1,2}:\d{2})', cleaned_text)
            if time_match:
                extracted = time_match.group(1)
                print(f"[DEBUG] workHours - 시간 추출: {extracted}")
                return extracted
            
            # "9시부터 6시까지" 형태의 패턴 처리
            time_range_match = re.search(r'(\d{1,2})시부터 (\d{1,2})시까지', cleaned_text)
            if time_range_match:
                start_hour = time_range_match.group(1)
                end_hour = time_range_match.group(2)
                extracted = f"{start_hour.zfill(2)}:00-{end_hour.zfill(2)}:00"
                print(f"[DEBUG] workHours - 시간 범위 추출: {extracted}")
                return extracted
        
        print(f"[DEBUG] workHours - 시간 패턴 없음, 원본 반환")
        return cleaned_text
    
    elif field == 'locationCity':
        # 근무 위치 추출 (개선된 로직)
        location_keywords = [
            '서울', '부산', '대구', '인천', '대전', '광주', '울산', '세종', 
            '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
            '강남', '강북', '서초', '송파', '마포', '용산', '영등포', '동대문', '중구'
        ]
        
        for keyword in location_keywords:
            if keyword in cleaned_text:
                print(f"[DEBUG] locationCity - 위치 추출: {keyword}")
                return keyword
        
        print(f"[DEBUG] locationCity - 위치 없음, 원본 반환")
        return cleaned_text
    
    elif field == 'deadline':
        # 마감일 추출 (개선된 로직)
        deadline_patterns = [
            r'\d{4}년 \d{1,2}월 \d{1,2}일',  # 2024년 12월 31일
            r'\d{1,2}월 \d{1,2}일',  # 12월 31일
            r'상시채용', r'채용시마감'
        ]
        
        for pattern in deadline_patterns:
            matches = re.findall(pattern, cleaned_text)
            if matches:
                print(f"[DEBUG] deadline - 마감일 추출: {matches[0]}")
                return matches[0]
        
        print(f"[DEBUG] deadline - 마감일 없음, 원본 반환")
        return cleaned_text
    
    elif field == 'contactEmail':
        # 이메일 추출 (개선된 로직)
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        email_match = re.search(email_pattern, cleaned_text)
        if email_match:
            extracted = email_match.group(0)
            print(f"[DEBUG] contactEmail - 이메일 추출: {extracted}")
            return extracted
        
        print(f"[DEBUG] contactEmail - 이메일 없음, 원본 반환")
        return cleaned_text
    
    else:
        # 기본적으로 정리된 텍스트 반환
        print(f"[DEBUG] 기본 처리 - 정리된 텍스트 반환")
        return cleaned_text

# 기존 detect_intent 함수는 호환성을 위해 유지
def detect_intent(user_input: str):
    classification = classify_input(user_input)
    
    if classification['type'] == 'field':
        return "field", HARDCODED_FIELDS.get(classification['value'], f"{classification['value']}로 설정되었습니다.")
    elif classification['type'] == 'question':
        return "question", None
    else:
        return "answer", None

# 프롬프트 템플릿
PROMPT_TEMPLATE = """
너는 채용 어시스턴트야. 사용자의 답변을 분석해 의도를 파악하고, 질문인지 요청인지 구분해서 필요한 응답을 진행해.

- 사용자가 요청한 "지원 분야"는 아래와 같은 식으로 명확히 처리해줘:
  - UI/UX 디자인
  - 그래픽 디자인
  - Figma 경험 등

- 질문이면 AI답변을 생성하고, 답변이면 다음 항목을 물어봐.

지금까지의 질문 흐름에 따라 대화의 자연스러운 흐름을 유지해.

사용자 입력: {user_input}
현재 필드: {current_field}
"""

# .env 파일 로드
load_dotenv()

# --- Gemini API 설정 추가 시작 ---
import google.generativeai as genai

# 환경 변수에서 Gemini API 키 로드
GEMINI_API_KEY = os.getenv('GOOGLE_API_KEY')

# API 키가 없어도 기본 응답을 반환하도록 수정
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    # Gemini 모델 초기화
    # 'gemini-1.5-pro'는 최신 텍스트 기반 모델입니다.
    model = genai.GenerativeModel('gemini-1.5-pro')
else:
    print("Warning: GOOGLE_API_KEY not found. Using fallback responses.")
    model = None
# --- Gemini API 설정 추가 끝 ---

router = APIRouter()

# 기존 세션 저장소 (normal 모드에서 이제 사용하지 않음, modal_assistant에서만 사용)
sessions = {}

# 모달 어시스턴트 세션 저장소 (기존 로직 유지를 위해 유지)
modal_sessions = {}

class SessionStartRequest(BaseModel):
    page: str
    fields: Optional[List[Dict[str, Any]]] = []
    mode: Optional[str] = "normal"

class SessionStartResponse(BaseModel):
    session_id: str
    question: str
    current_field: str

# ChatbotRequest 모델 수정: session_id를 Optional로, conversation_history 추가
class ChatbotRequest(BaseModel):
    session_id: Optional[str] = None  # 세션 ID는 이제 선택 사항 (Modal/AI Assistant 모드용)
    user_input: str
    # 프론트엔드에서 넘어온 대화 기록
    conversation_history: List[Dict[str, Any]] = Field(default_factory=list)
    current_field: Optional[str] = None
    context: Optional[Dict[str, Any]] = {}
    mode: Optional[str] = "normal"

class ChatbotResponse(BaseModel):
    message: str
    field: Optional[str] = None
    value: Optional[str] = None
    suggestions: Optional[List[str]] = []
    confidence: Optional[float] = None
    items: Optional[List[Dict[str, Any]]] = None  # 선택 가능한 항목들
    show_item_selection: Optional[bool] = False  # 항목 선택 UI 표시 여부

class ConversationRequest(BaseModel):
    session_id: str
    user_input: str
    current_field: str
    filled_fields: Dict[str, Any] = {}
    mode: str = "conversational"

class ConversationResponse(BaseModel):
    message: str
    is_conversation: bool = True
    suggestions: Optional[List[str]] = []
    field: Optional[str] = None
    value: Optional[str] = None
    response_type: str = "conversation"  # "conversation" 또는 "selection"
    selectable_items: Optional[List[Dict[str, str]]] = []  # 선택 가능한 항목들

class GenerateQuestionsRequest(BaseModel):
    current_field: str
    filled_fields: Dict[str, Any] = {}

class FieldUpdateRequest(BaseModel):
    session_id: str
    field: str
    value: str

class SuggestionsRequest(BaseModel):
    field: str
    context: Optional[Dict[str, Any]] = {}

class ValidationRequest(BaseModel):
    field: str
    value: str
    context: Optional[Dict[str, Any]] = {}

class AutoCompleteRequest(BaseModel):
    partial_input: str
    field: str
    context: Optional[Dict[str, Any]] = {}

class RecommendationsRequest(BaseModel):
    current_field: str
    filled_fields: Dict[str, Any] = {}
    context: Optional[Dict[str, Any]] = {}

@router.post("/start", response_model=SessionStartResponse)
async def start_session(request: SessionStartRequest):
    print("[DEBUG] /start 요청:", request)
    try:
        session_id = str(uuid.uuid4())
        if request.mode == "modal_assistant":
            if not request.fields:
                print("[ERROR] /start fields 누락")
                raise HTTPException(status_code=400, detail="모달 어시스턴트 모드에서는 fields가 필요합니다")
            modal_sessions[session_id] = {
                "page": request.page,
                "fields": request.fields,
                "current_field_index": 0,
                "filled_fields": {},
                "conversation_history": [],
                "mode": "modal_assistant"
            }
            first_field = request.fields[0]
            response = SessionStartResponse(
                session_id=session_id,
                question=f"안녕하세요! {request.page} 작성을 도와드리겠습니다. 🤖\n\n먼저 {first_field.get('label', '첫 번째 항목')}에 대해 알려주세요.",
                current_field=first_field.get('key', 'unknown')
            )
            print("[DEBUG] /start 응답:", response)
            return response
        else:
            questions = get_questions_for_page(request.page)
            sessions[session_id] = {
                "page": request.page,
                "questions": questions,
                "current_index": 0,
                "current_field": questions[0]["field"] if questions else None,
                "conversation_history": [],
                "mode": "normal"
            }
            response = SessionStartResponse(
                session_id=session_id,
                question=questions[0]["question"] if questions else "질문이 없습니다.",
                current_field=questions[0]["field"] if questions else None
            )
            print("[DEBUG] /start 응답:", response)
            return response
    except Exception as e:
        print("[ERROR] /start 예외:", e)
        traceback.print_exc()
        raise

@router.post("/start-ai-assistant", response_model=SessionStartResponse)
async def start_ai_assistant(request: SessionStartRequest):
    print("[DEBUG] /start-ai-assistant 요청:", request)
    try:
        session_id = str(uuid.uuid4())
        ai_assistant_fields = [
            {"key": "department", "label": "구인 부서", "type": "text"},
            {"key": "headcount", "label": "채용 인원", "type": "text"},
            {"key": "mainDuties", "label": "업무 내용", "type": "text"},
            {"key": "workHours", "label": "근무 시간", "type": "text"},
            {"key": "locationCity", "label": "근무 위치", "type": "text"},
            {"key": "salary", "label": "급여 조건", "type": "text"},
            {"key": "deadline", "label": "마감일", "type": "text"},
            {"key": "contactEmail", "label": "연락처 이메일", "type": "email"}
        ]
        modal_sessions[session_id] = {
            "page": request.page,
            "fields": ai_assistant_fields,
            "current_field_index": 0,
            "filled_fields": {},
            "conversation_history": [],
            "mode": "ai_assistant"
        }
        first_field = ai_assistant_fields[0]
        response = SessionStartResponse(
            session_id=session_id,
            question=f" AI 도우미를 시작하겠습니다!\n\n먼저 {first_field.get('label', '첫 번째 항목')}에 대해 알려주세요.",
            current_field=first_field.get('key', 'unknown')
        )
        print("[DEBUG] /start-ai-assistant 응답:", response)
        return response
    except Exception as e:
        print("[ERROR] /start-ai-assistant 예외:", e)
        traceback.print_exc()
        raise

@router.post("/ask", response_model=ChatbotResponse)
async def ask_chatbot(request: ChatbotRequest):
    print("[DEBUG] /ask 요청:", request)
    try:
        if request.mode == "normal" or not request.session_id:
            response = await handle_normal_request(request)
        elif request.mode == "modal_assistant":
            response = await handle_modal_assistant_request(request)
        else:
            print("[ERROR] /ask 알 수 없는 모드:", request.mode)
            raise HTTPException(status_code=400, detail="알 수 없는 챗봇 모드입니다.")
        print("[DEBUG] /ask 응답:", response)
        return response
    except Exception as e:
        print("[ERROR] /ask 예외:", e)
        traceback.print_exc()
        raise

@router.post("/conversation")
async def conversation(request: ConversationRequest):
    try:
        print(f"[DEBUG] /conversation 요청: {request}")
        
        # LLM 서비스 인스턴스 생성
        llm_service = LLMService()
        
        # AI 응답 생성
        response = await llm_service.process_user_input(
            page=request.page,
            field=request.current_field,
            user_input=request.user_input,
            conversation_history=request.conversation_history,
            questions=request.questions,
            current_index=request.current_index
        )
        
        # 응답 타입 분석 및 결정
        response_type = "conversation"  # 기본값
        selectable_items = []
        
        # 선택형 응답인지 판단하는 로직
        if response.get("value") is None and response.get("message"):
            message_content = response.get("message", "")
            
            # 선택형 응답 패턴 감지
            selection_patterns = [
                "이 중에서 선택해 주세요",
                "다음 중에서 선택",
                "선택해 주세요",
                "원하는 것을 선택",
                "번호로 선택",
                "1.", "2.", "3.", "4.", "5."  # 번호로 구분된 목록
            ]
            
            # 선택형 응답인지 확인
            is_selection_response = any(pattern in message_content for pattern in selection_patterns)
            
            if is_selection_response:
                response_type = "selection"
                
                # 메시지에서 선택 항목 추출
                lines = message_content.split('\n')
                for line in lines:
                    line = line.strip()
                    if line and (line.startswith(('1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.')) or 
                               line.startswith(('•', '-', '*'))):
                        # 번호나 불릿 제거
                        import re
                        clean_text = re.sub(r'^\d+\.\s*', '', line)
                        clean_text = re.sub(r'^[•\-*]\s*', '', clean_text)
                        clean_text = clean_text.strip()
                        if clean_text:
                            selectable_items.append({
                                "text": clean_text,
                                "value": clean_text
                            })
        
        result = ConversationResponse(
            message=response.get("message", ""),
            is_conversation=response.get("is_conversation", True),
            suggestions=response.get("suggestions", []),
            field=response.get("field"),
            value=response.get("value"),
            response_type=response_type,
            selectable_items=selectable_items
        )
        print("[DEBUG] /conversation 응답:", result)
        return result
        
    except Exception as e:
        print(f"[ERROR] /conversation 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-questions", response_model=Dict[str, Any])
async def generate_contextual_questions(request: GenerateQuestionsRequest):
    """컨텍스트 기반 질문 생성"""
    print("[DEBUG] /generate-questions 요청:", request)
    try:
        questions = await generate_field_questions(
            request.current_field, 
            request.filled_fields
        )
        result = {"questions": questions}
        print("[DEBUG] /generate-questions 응답:", result)
        return result
    except Exception as e:
        print("[ERROR] /generate-questions 예외:", e)
        traceback.print_exc()
        raise

@router.post("/ai-assistant-chat", response_model=ChatbotResponse)
async def ai_assistant_chat(request: ChatbotRequest):
    """AI 도우미 채팅 처리 (session_id 필요)"""
    print("[DEBUG] /ai-assistant-chat 요청:", request)
    if not request.session_id or request.session_id not in modal_sessions:
        print("[ERROR] /ai-assistant-chat 유효하지 않은 세션:", request.session_id)
        raise HTTPException(status_code=400, detail="유효하지 않은 세션입니다")
    
    session = modal_sessions[request.session_id]
    current_field_index = session["current_field_index"]
    fields = session["fields"]
    
    if current_field_index >= len(fields):
        response = ChatbotResponse(
            message="🎉 모든 정보를 입력받았습니다! 채용공고 등록이 완료되었습니다."
        )
        print("[DEBUG] /ai-assistant-chat 응답:", response)
        return response
    
    current_field = fields[current_field_index]
    
    # 대화 히스토리에 사용자 입력 저장
    session["conversation_history"].append({
        "role": "user",
        "content": request.user_input,
        "field": current_field["key"]
    })
    
    # AI 응답 생성 (이 함수는 여전히 시뮬레이션된 응답을 사용합니다)
    ai_response = await generate_ai_assistant_response(request.user_input, current_field, session)
    
    # 대화 히스토리에 AI 응답 저장
    session["conversation_history"].append({
        "role": "assistant",
        "content": ai_response["message"],
        "field": current_field["key"]
    })
    
    # 필드 값이 추출된 경우
    if ai_response.get("value"):
        session["filled_fields"][current_field["key"]] = ai_response["value"]
        
        # 다음 필드로 이동
        session["current_field_index"] += 1
        
        if session["current_field_index"] < len(fields):
            next_field = fields[session["current_field_index"]]
            next_message = f"좋습니다! 이제 {next_field.get('label', '다음 항목')}에 대해 알려주세요."
            ai_response["message"] += f"\n\n{next_message}"
        else:
            ai_response["message"] += "\n\n🎉 모든 정보 입력이 완료되었습니다!"
    
    response = ChatbotResponse(
        message=ai_response["message"],
        field=current_field["key"],
        value=ai_response.get("value"),
        suggestions=ai_response.get("suggestions", []),
        confidence=ai_response.get("confidence", 0.8),
        items=ai_response.get("items"),
        show_item_selection=ai_response.get("show_item_selection")
    )
    print("[DEBUG] /ai-assistant-chat 응답:", response)
    return response

async def handle_modal_assistant_request(request: ChatbotRequest):
    """모달 어시스턴트 모드 처리 (session_id 필요)"""
    print("[DEBUG] ===== handle_modal_assistant_request 시작 =====")
    print("[DEBUG] 요청 데이터:", request)
    print("[DEBUG] user_input:", request.user_input)
    print("[DEBUG] current_field:", request.current_field)
    print("[DEBUG] mode:", request.mode)
    print("[DEBUG] session_id:", request.session_id)
    if not request.session_id or request.session_id not in modal_sessions:
        print("[ERROR] /ai-assistant-chat 유효하지 않은 세션:", request.session_id)
        raise HTTPException(status_code=400, detail="유효하지 않은 세션입니다")
    
    session = modal_sessions[request.session_id]
    current_field_index = session["current_field_index"]
    fields = session["fields"]
    
    if current_field_index >= len(fields):
        response = ChatbotResponse(
            message="모든 정보를 입력받았습니다! 완료 버튼을 눌러주세요. 🎉"
        )
        print("[DEBUG] /ai-assistant-chat 응답:", response)
        return response
    
    current_field = fields[current_field_index]
    
    session["conversation_history"].append({
        "role": "user",
        "content": request.user_input,
        "field": current_field["key"]
    })
    
    # 변경: generate_modal_ai_response 대신 simulate_llm_response를 사용하도록 통합
    # simulate_llm_response는 이제 is_conversation 플래그를 반환할 것임
    # 이 부분은 여전히 시뮬레이션된 LLM 응답을 사용합니다.
    llm_response = await simulate_llm_response(request.user_input, current_field["key"], session)
    
    # 대화 히스토리에 LLM 응답 저장
    session["conversation_history"].append({
        "role": "assistant",
        "content": llm_response["message"],
        "field": current_field["key"] if not llm_response.get("is_conversation", False) else None # 대화형 응답은 특정 필드에 귀속되지 않을 수 있음
    })
    
    response_message = llm_response["message"]
    
    # 명확하지 않은 입력인 경우 먼저 확인
    if llm_response.get("is_unclear", False):
        # 명확하지 않은 입력인 경우 다음 단계로 넘어가지 않음
        print(f"[DEBUG] 명확하지 않은 입력으로 인식됨 - current_field_index 증가하지 않음")
    # 대화형 응답인 경우 (질문에 대한 답변)
    elif llm_response.get("is_conversation", False):
        # 대화형 응답인 경우 다음 단계로 넘어가지 않음
        print(f"[DEBUG] 대화형 응답으로 인식됨 - current_field_index 증가하지 않음")
    # LLM이 필드 값을 추출했다고 판단한 경우 (value가 있고, 명확하지 않은 입력이 아닌 경우)
    elif llm_response.get("value") and not llm_response.get("is_unclear", False):
        # 필드 키를 명시적으로 설정
        field_key = llm_response.get("field", current_field["key"])
        field_value = llm_response["value"]
        
        # 값이 유효한지 확인 (빈 문자열이나 의미없는 값이 아닌지)
        invalid_values = ["ai 채용공고 등록 도우미", "채용공고 등록 도우미", "ai 어시스턴트", "채용공고", "도우미", "ai", ""]
        if field_value and field_value.strip() and field_value.lower() not in invalid_values:
            print(f"[DEBUG] 필드 업데이트 - 키: {field_key}, 값: {field_value}")
            session["filled_fields"][field_key] = field_value
            
            # 다음 필드로 이동
            session["current_field_index"] += 1
            
            if session["current_field_index"] < len(fields):
                next_field = fields[session["current_field_index"]]
                # LLM이 다음 질문을 생성하도록 유도하거나, 여기에서 생성
                next_message = f"\n\n다음으로 {next_field.get('label', '다음 항목')}에 대해 알려주세요."
                response_message += next_message
            else:
                response_message += "\n\n🎉 모든 정보 입력이 완료되었습니다!"
        else:
            print(f"[DEBUG] 유효하지 않은 값으로 인식됨: {field_value}")
            # 유효하지 않은 값이면 다음 단계로 넘어가지 않음
            # 현재 필드에 머물면서 재입력 요청
            print(f"[DEBUG] 유효하지 않은 값으로 인한 재입력 요청 - current_field_index 증가하지 않음")
    else:
        # value가 없거나 다른 경우에도 다음 단계로 넘어가지 않음
        print(f"[DEBUG] 유효한 값이 없음 - current_field_index 증가하지 않음")
    
    response = ChatbotResponse(
        message=response_message,
        field=current_field["key"] if not llm_response.get("is_conversation", True) else None, # 대화형 응답 시 필드 값은 비워둘 수 있음
        value=llm_response.get("value"),
        suggestions=llm_response.get("suggestions", []), # LLM이 제안을 생성할 수 있다면 활용
        confidence=llm_response.get("confidence", 0.8), # LLM이 confidence를 반환할 수 있다면 활용
        items=llm_response.get("items"),
        show_item_selection=llm_response.get("show_item_selection")
    )
    print("[DEBUG] ===== handle_modal_assistant_request 응답 =====")
    print("[DEBUG] 응답 메시지:", response.message)
    print("[DEBUG] 응답 필드:", response.field)
    print("[DEBUG] 응답 값:", response.value)
    print("[DEBUG] 응답 제안:", response.suggestions)
    print("[DEBUG] 응답 신뢰도:", response.confidence)
    print("[DEBUG] ===== handle_modal_assistant_request 완료 =====")
    return response

async def handle_normal_request(request: ChatbotRequest):
    """
    일반 챗봇 요청 처리 (키워드 기반 1차 분류 → LLM 호출 → 응답)
    """
    print("[DEBUG] handle_normal_request 요청:", request)
    user_input = request.user_input
    conversation_history_from_frontend = request.conversation_history

    if not user_input:
        raise HTTPException(status_code=400, detail="사용자 입력이 필요합니다.")

    try:
        # 1) 키워드 기반 1차 분류
        classification = classify_input(user_input)
        print(f"[DEBUG] 분류 결과: {classification}")
        
        # 2) 분류된 결과에 따른 처리
        if classification['type'] == 'field':
            # 필드 값으로 처리
            field_value = classification.get('value', user_input.strip())
            response = ChatbotResponse(
                message=f"{classification['category']}: {field_value}로 설정되었습니다.",
                field=None,
                value=field_value,
                suggestions=[],
                confidence=classification['confidence']
            )
            print("[DEBUG] handle_normal_request 응답 (필드):", response)
            return response
            
        elif classification['type'] == 'question':
            # 3) Gemini API 호출로 답변 생성
            ai_response = await call_gemini_api(user_input, conversation_history_from_frontend)
            response = ChatbotResponse(
                message=ai_response,
                field=None,
                value=None,
                suggestions=[],
                confidence=classification['confidence']
            )
            print("[DEBUG] handle_normal_request 응답 (질문):", response)
            return response
            
        elif classification['type'] == 'chat':
            # 일상 대화 처리
            response = ChatbotResponse(
                message="안녕하세요! 채용 관련 문의사항이 있으시면 언제든 말씀해 주세요.",
                field=None,
                value=None,
                suggestions=[],
                confidence=classification['confidence']
            )
            print("[DEBUG] handle_normal_request 응답 (일상대화):", response)
            return response
            
        else:
            # 답변인 경우 기본 처리 (자동 완성)
            # 다음 질문을 생성하거나 대화를 계속 이어가도록 처리
            next_questions = await generate_field_questions("general", {})
            next_question = next_questions[0] if next_questions else "다른 도움이 필요하시면 언제든 말씀해 주세요."
            
            # 필드별 추천 제안 가져오기
            field_suggestions = get_field_suggestions("general", {})
            
            response = ChatbotResponse(
                message=f"'{user_input}'로 입력하겠습니다.\n\n{next_question}",
                field=None,
                value=user_input.strip(),
                suggestions=field_suggestions,
                confidence=classification['confidence']
            )
            print("[DEBUG] handle_normal_request 응답 (답변):", response)
            return response

    except Exception as e:
        print(f"[ERROR] handle_normal_request 예외: {e}")
        traceback.print_exc()
        response = ChatbotResponse(
            message=f"죄송합니다. 처리 중 오류가 발생했습니다. 다시 시도해 주세요. (오류: {str(e)})",
            field=None,
            value=None
        )
        print("[DEBUG] handle_normal_request 응답 (오류):", response)
        return response

# 이 아래 함수들은 현재 시뮬레이션된 응답 로직을 사용합니다.
# 만약 이 함수들도 실제 Gemini API와 연동하고 싶으시다면,
# 해당 함수 내부에 Gemini API 호출 로직을 추가해야 합니다.
async def generate_conversational_response(user_input: str, current_field: str, filled_fields: Dict[str, Any]) -> Dict[str, Any]:
    """대화형 응답 생성"""
    print("[DEBUG] generate_conversational_response 요청:", user_input, current_field, filled_fields)
    await asyncio.sleep(0.5)
    
    question_keywords = ["어떤", "무엇", "어떻게", "왜", "언제", "어디서", "얼마나", "몇", "무슨"]
    is_question = any(keyword in user_input for keyword in question_keywords) or user_input.endswith("?")
    
    if is_question:
        response = await handle_question_response(user_input, current_field, filled_fields)
        print("[DEBUG] generate_conversational_response 응답 (질문):", response)
        return response
    else:
        response = await handle_answer_response(user_input, current_field, filled_fields)
        print("[DEBUG] generate_conversational_response 응답 (답변):", response)
        return response

async def handle_question_response(user_input: str, current_field: str, filled_fields: Dict[str, Any]) -> Dict[str, Any]:
    """질문에 대한 응답 처리"""
    print("[DEBUG] handle_question_response 요청:", user_input, current_field, filled_fields)
    question_responses = {
        "department": {
            "개발팀": "개발팀은 주로 웹/앱 개발, 시스템 구축, 기술 지원 등을 담당합니다. 프론트엔드, 백엔드, 풀스택 개발자로 구성되어 있으며, 최신 기술 트렌드를 반영한 개발을 진행합니다.",
            "마케팅팀": "마케팅팀은 브랜드 관리, 광고 캠페인 기획, 디지털 마케팅, 콘텐츠 제작, 고객 분석 등을 담당합니다. 온라인/오프라인 마케팅 전략을 수립하고 실행합니다.",
            "영업팀": "영업팀은 신규 고객 발굴, 계약 체결, 고객 관계 관리, 매출 목표 달성 등을 담당합니다. B2B/B2C 영업, 해외 영업 등 다양한 영업 활동을 수행합니다.",
            "디자인팀": "디자인팀은 UI/UX 디자인, 브랜드 디자인, 그래픽 디자인, 웹/앱 디자인 등을 담당합니다. 사용자 경험을 최우선으로 하는 디자인을 제작합니다."
        },
        "headcount": {
            "1명": "현재 업무량과 향후 계획을 고려하여 결정하시면 됩니다. 초기에는 1명으로 시작하고, 필요에 따라 추가 채용을 고려해보세요.",
            "팀 규모": "팀 규모는 업무 특성과 회사 규모에 따라 다릅니다. 소규모 팀(3-5명)부터 대규모 팀(10명 이상)까지 다양하게 구성됩니다.",
            "신입/경력": "업무 특성에 따라 신입/경력을 구분하여 채용하는 것이 일반적입니다. 신입은 성장 잠재력, 경력자는 즉시 투입 가능한 실력을 중시합니다.",
            "계약직/정규직": "프로젝트 기반이면 계약직, 장기적 업무라면 정규직을 고려해보세요. 각각의 장단점을 비교하여 결정하시면 됩니다."
        }
    }
    
    field_responses = question_responses.get(current_field, {})
    
    for keyword, response in field_responses.items():
        if keyword in user_input:
            response_data = {
                "message": response,
                "is_conversation": True,
                "suggestions": list(field_responses.keys())
            }
            print("[DEBUG] handle_question_response 응답:", response_data)
            return response_data
    
    response_data = {
        "message": f"{current_field}에 대한 질문이군요. 더 구체적으로 어떤 부분이 궁금하신지 말씀해 주세요.",
        "is_conversation": True,
        "suggestions": list(field_responses.keys())
    }
    print("[DEBUG] handle_question_response 응답:", response_data)
    return response_data

async def handle_answer_response(user_input: str, current_field: str, filled_fields: Dict[str, Any]) -> Dict[str, Any]:
    """답변 처리"""
    print("[DEBUG] handle_answer_response 요청:", user_input, current_field, filled_fields)
    response_data = {
        "message": f"'{user_input}'로 입력하겠습니다. 다음 질문으로 넘어가겠습니다.",
        "field": current_field,
        "value": user_input,
        "is_conversation": False
    }
    print("[DEBUG] handle_answer_response 응답:", response_data)
    return response_data

async def generate_field_questions(current_field: str, filled_fields: Dict[str, Any]) -> List[str]:
    """필드별 질문 생성"""
    print("[DEBUG] generate_field_questions 요청:", current_field, filled_fields)
    questions_map = {
        "department": [
            "개발팀은 어떤 업무를 하나요?",
            "마케팅팀은 어떤 역할인가요?",
            "영업팀의 주요 업무는?",
            "디자인팀은 어떤 일을 하나요?"
        ],
        "headcount": [
            "1명 채용하면 충분한가요?",
            "팀 규모는 어떻게 되나요?",
            "신입/경력 구분해서 채용하나요?",
            "계약직/정규직 중 어떤가요?"
        ],
        "workType": [
            "웹 개발은 어떤 기술을 사용하나요?",
            "앱 개발은 iOS/Android 둘 다인가요?",
            "디자인은 UI/UX 모두인가요?",
            "마케팅은 온라인/오프라인 모두인가요?"
        ],
        "workHours": [
            "유연근무제는 어떻게 운영되나요?",
            "재택근무 가능한가요?",
            "야근이 많은 편인가요?",
            "주말 근무가 있나요?"
        ],
        "location": [
            "원격근무는 얼마나 가능한가요?",
            "출장이 많은 편인가요?",
            "해외 지사 근무 가능한가요?",
            "지방 근무는 어떤가요?"
        ],
        "salary": [
            "연봉 협의는 언제 하나요?",
            "성과급은 어떻게 지급되나요?",
            "인센티브 제도가 있나요?",
            "연봉 인상은 언제 하나요?"
        ]
    }
    
    questions = questions_map.get(current_field, [
        "이 항목에 대해 궁금한 점이 있으신가요?",
        "더 자세한 설명이 필요하신가요?",
        "예시를 들어 설명해드릴까요?"
    ])
    print("[DEBUG] generate_field_questions 응답:", questions)
    return questions

async def generate_modal_ai_response(user_input: str, field: Dict[str, Any], session: Dict[str, Any]) -> Dict[str, Any]:
    """모달 어시스턴트용 AI 응답 생성 (시뮬레이션)"""
    print("[DEBUG] generate_modal_ai_response 요청:", user_input, field, session)
    field_key = field.get("key", "")
    field_label = field.get("label", "")
    
    responses = {
        "department": {
            "message": "부서 정보를 확인했습니다. 몇 명을 채용하실 예정인가요?",
            "value": user_input,
            "suggestions": ["1명", "2명", "3명", "5명", "10명"],
            "confidence": 0.8
        },
        "headcount": {
            "message": "채용 인원을 확인했습니다. 어떤 업무를 담당하게 될까요?",
            "value": user_input,
            "suggestions": ["개발", "디자인", "마케팅", "영업", "기획"],
            "confidence": 0.9
        },
        "workType": {
            "message": "업무 내용을 확인했습니다. 근무 시간은 어떻게 되나요?",
            "value": user_input,
            "suggestions": ["09:00-18:00", "10:00-19:00", "유연근무제"],
            "confidence": 0.7
        },
        "workHours": {
            "message": "근무 시간을 확인했습니다. 근무 위치는 어디인가요?",
            "value": user_input,
            "suggestions": ["서울", "부산", "대구", "인천", "대전"],
            "confidence": 0.8
        },
        "location": {
            "message": "근무 위치를 확인했습니다. 급여 조건은 어떻게 되나요?",
            "value": user_input,
            "suggestions": ["면접 후 협의", "3000만원", "4000만원", "5000만원"],
            "confidence": 0.6
        },
        "salary": {
            "message": "급여 조건을 확인했습니다. 마감일은 언제인가요?",
            "value": user_input,
            "suggestions": ["2024년 12월 31일", "2024년 11월 30일", "채용 시 마감"],
            "confidence": 0.7
        },
        "deadline": {
            "message": "마감일을 확인했습니다. 연락처 이메일을 알려주세요.",
            "value": user_input,
            "suggestions": ["hr@company.com", "recruit@company.com"],
            "confidence": 0.8
        },
        "email": {
            "message": "이메일을 확인했습니다. 모든 정보 입력이 완료되었습니다!",
            "value": user_input,
            "suggestions": [],
            "confidence": 0.9
        }
    }
    
    response_data = responses.get(field_key, {
        "message": f"{field_label} 정보를 확인했습니다. 다음 질문으로 넘어가겠습니다.",
        "value": user_input,
        "suggestions": [],
        "confidence": 0.5
    })
    print("[DEBUG] generate_modal_ai_response 응답:", response_data)
    return response_data

async def generate_ai_assistant_response(user_input: str, field: Dict[str, Any], session: Dict[str, Any]) -> Dict[str, Any]:
    """AI 도우미용 응답 생성 (개선된 Gemini API 사용)"""
    print("[DEBUG] ===== AI 어시스턴트 응답 생성 시작 =====")
    print("[DEBUG] 사용자 입력:", user_input)
    print("[DEBUG] 현재 필드:", field)
    print("[DEBUG] 세션 정보:", session)
    
    field_key = field.get("key", "")
    field_label = field.get("label", "")
    print(f"[DEBUG] 필드 키: {field_key}, 필드 라벨: {field_label}")
    
    # 1) 키워드 기반 1차 분류 (개선된 분류 함수 사용)
    classification = classify_input_with_priority(user_input, field_key)
    print(f"[DEBUG] 분류 결과: {classification}")
    print(f"[DEBUG] 분류 타입: {classification.get('type')}")
    print(f"[DEBUG] 분류 카테고리: {classification.get('category')}")
    print(f"[DEBUG] 분류 값: {classification.get('value')}")
    print(f"[DEBUG] 신뢰도: {classification.get('confidence')}")
    
    # 2) 분류된 결과에 따른 처리
    if classification['type'] == 'question':
        # 질문인 경우 Gemini API 호출
        try:
            ai_assistant_context = f"""
현재 채용 공고 작성 중입니다. 현재 필드: {field_label} ({field_key})

사용자 질문: {user_input}

이 질문에 대해 채용 공고 작성에 도움이 되는 실무적인 답변을 제공해주세요.
"""
            ai_response = await call_gemini_api(ai_assistant_context)
            
            # 응답을 항목별로 분할
            items = parse_response_items(ai_response)
            
            response = {
                "message": ai_response,
                "value": None,  # 질문이므로 value는 None
                "field": current_field,
                "suggestions": [],
                "confidence": classification['confidence'],
                "items": items,
                "show_item_selection": True  # 항목 선택 UI 표시
            }
            print(f"[DEBUG] 질문 응답 (항목 선택 포함): {response}")
            return response
            
        except Exception as e:
            print(f"[ERROR] Gemini API 호출 실패: {e}")
            # 오프라인 응답으로 대체
            response = {
                "message": f"'{user_input}'에 대한 답변을 제공해드리겠습니다. 현재 필드 '{field_label}'에 대한 정보를 입력해주세요.",
                "value": None,
                "field": current_field,
                "suggestions": [],
                "confidence": 0.5
            }
            return response
    elif classification['type'] == 'chat':
        # 일상 대화 처리
        return {
            "message": "안녕하세요! 채용 공고 작성에 도와드리고 있습니다. 현재 {field_label}에 대한 정보를 입력해주세요.",
            "value": None,
            "field": current_field,
            "suggestions": [],
            "confidence": classification['confidence']
        }
        print(f"[DEBUG] 일상 대화 응답: {response}")
        return response
    else:
        # 답변인 경우 (개선된 처리)
        # classification에서 추출된 값이 있으면 사용, 없으면 user_input에서 추출 시도
        if classification.get('value'):
            field_value = classification['value']
            field_category = classification.get('category', field_key)
        else:
            # classification에서 값이 없으면 user_input에서 추출 시도
            field_config = get_field_config(field_key)
            field_value = extract_field_value(user_input, field_key, field_config)
            field_category = field_key
        
        print(f"[DEBUG] 답변 처리 결과 - 필드: {field_category}, 값: {field_value}")
        
        # 필드 업데이트 후 다음 질문 자동 생성
        next_question = ""
        next_suggestions = []
        
        # 필드별 다음 질문 매핑
        field_questions = {
            "department": {
                "question": "몇 명을 채용하실 예정인가요?",
                "suggestions": ["1명", "2명", "3명", "5명", "10명"]
            },
            "headcount": {
                "question": "어떤 업무를 담당하게 될까요?",
                "suggestions": ["개발", "디자인", "마케팅", "영업", "기획", "고객지원"]
            },
            "mainDuties": {
                "question": "근무 시간은 어떻게 되나요?",
                "suggestions": ["09:00-18:00", "10:00-19:00", "유연근무제", "시차출근제"]
            },
            "workHours": {
                "question": "근무 요일은 어떻게 되나요?",
                "suggestions": ["월-금", "월-토", "주5일", "주6일"]
            },
            "workDays": {
                "question": "근무 위치는 어디인가요?",
                "suggestions": ["서울", "부산", "대구", "인천", "대전", "광주", "울산"]
            },
            "locationCity": {
                "question": "구체적인 지역을 알려주세요.",
                "suggestions": ["강남구", "서초구", "마포구", "종로구", "중구"]
            },
            "locationDistrict": {
                "question": "급여 조건은 어떻게 되나요?",
                "suggestions": ["면접 후 협의", "3000만원", "4000만원", "5000만원", "6000만원"]
            },
            "salary": {
                "question": "마감일은 언제인가요?",
                "suggestions": ["2024년 12월 31일", "2024년 11월 30일", "채용 시 마감", "상시채용"]
            },
            "deadline": {
                "question": "연락처 이메일을 알려주세요.",
                "suggestions": ["hr@company.com", "recruit@company.com", "인사팀 이메일"]
            }
        }
        
        # 현재 필드에 대한 다음 질문이 있는지 확인
        if field_key in field_questions:
            next_question = field_questions[field_key]["question"]
            next_suggestions = field_questions[field_key]["suggestions"]
        
        # 응답 메시지에 다음 질문 포함
        if next_question:
            response_message = f"'{field_label}'에 대해 '{field_value}'로 입력하겠습니다. {next_question}"
        else:
            response_message = f"'{field_label}'에 대해 '{field_value}'로 입력하겠습니다."
        
        response = {
            "message": response_message,
            "value": field_value,
            "field": field_category,  # 분류된 필드명 사용
            "suggestions": next_suggestions,
            "confidence": classification['confidence'],
            "next_question": next_question
        }
        print(f"[DEBUG] ===== AI 어시스턴트 응답 생성 완료 =====")
        print(f"[DEBUG] 최종 결과: {response}")
        print("[DEBUG] ===== AI 어시스턴트 응답 생성 완료 =====")
        return response

async def simulate_llm_response(user_input: str, current_field: str, session: Dict[str, Any]) -> Dict[str, Any]:
    """
    키워드 기반 1차 분류 → LLM 호출 → 응답 처리 (개선된 버전)
    """
    print("[DEBUG] ===== simulate_llm_response 시작 =====")
    print("[DEBUG] user_input:", user_input)
    print("[DEBUG] current_field:", current_field)
    print("[DEBUG] session mode:", session.get("mode"))
    
    await asyncio.sleep(0.5) # 실제 LLM API 호출 시뮬레이션

    # 현재 처리 중인 필드의 사용자 친화적인 레이블 가져오기
    current_field_label = ""
    if session.get("mode") == "modal_assistant":
        fields_config = session.get("fields", [])
        for f in fields_config:
            if f.get("key") == current_field:
                current_field_label = f.get("label", current_field)
                break
    elif session.get("mode") == "normal":
        questions_config = session.get("questions", [])
        for q in questions_config:
            if q.get("field") == current_field:
                current_field_label = q.get("question", current_field).replace("을/를 알려주세요.", "").replace("은/는 몇 명인가요?", "").strip()
                break
    
    # 컨텍스트를 고려한 분류 (개선된 버전)
    classification = classify_input_with_priority(user_input, current_field)
    print(f"[DEBUG] 분류 결과: {classification}")
    print(f"[DEBUG] 분류 타입: {classification.get('type')}")
    print(f"[DEBUG] 분류 카테고리: {classification.get('category')}")
    print(f"[DEBUG] 분류 값: {classification.get('value')}")
    print(f"[DEBUG] 신뢰도: {classification.get('confidence')}")
    
    # 2) 분류된 결과에 따른 처리
    if classification['type'] == 'question':
        # 질문인 경우 Gemini API 호출
        try:
            # 대화 히스토리를 고려한 컨텍스트 생성
            conversation_context = ""
            if session.get("conversation_history"):
                recent_messages = session["conversation_history"][-4:]  # 최근 4개 메시지만 사용
                conversation_context = "\n".join([
                    f"{msg['role']}: {msg['content']}" 
                    for msg in recent_messages
                ])
            
            ai_assistant_context = f"""
현재 채용 공고 작성 중입니다. 현재 필드: {current_field_label} ({current_field})

최근 대화 내용:
{conversation_context}

사용자 질문: {user_input}

이 질문에 대해 채용 공고 작성에 도움이 되는 실무적인 답변을 제공해주세요.
답변 후에는 현재 필드 '{current_field_label}'에 대한 정보를 입력해주시면 됩니다.
"""
            ai_response = await call_gemini_api(ai_assistant_context)
            
            # 응답을 항목별로 분할
            items = parse_response_items(ai_response)
            
            response = {
                "message": ai_response,
                "value": None,  # 질문이므로 value는 None
                "field": current_field,
                "suggestions": [],
                "confidence": classification['confidence'],
                "items": items,
                "show_item_selection": True,  # 항목 선택 UI 표시
                "is_conversation": True  # 대화형 응답임을 표시
            }
            print(f"[DEBUG] 질문 응답 (대화형): {response}")
            return response
            
        except Exception as e:
            print(f"[ERROR] Gemini API 호출 실패: {e}")
            # 오프라인 응답으로 대체
            response = {
                "message": f"'{user_input}'에 대한 답변을 제공해드리겠습니다. 현재 필드 '{current_field_label}'에 대한 정보를 입력해주세요.",
                "value": None,
                "field": current_field,
                "suggestions": [],
                "confidence": 0.5
            }
            return response
    elif classification['type'] == 'conversational_answer':
        # 대화형 입력에서 맥락/키워드를 캐치하여 필드 값 추출 시도
        try:
            # 대화 히스토리를 고려한 컨텍스트 생성
            conversation_context = ""
            if session.get("conversation_history"):
                recent_messages = session["conversation_history"][-4:]  # 최근 4개 메시지만 사용
                conversation_context = "\n".join([
                    f"{msg['role']}: {msg['content']}"
                    for msg in recent_messages
                ])
            
            # LLM에게 대화형 입력에서 필드 값을 추출하도록 요청
            extraction_prompt = f"""
현재 채용 공고 작성 중입니다. 현재 필드: {current_field_label} ({current_field})

최근 대화 내용:
{conversation_context}

사용자 입력: {user_input}

이 대화형 입력에서 '{current_field_label}'에 대한 정보를 추출해주세요.
만약 관련 정보가 없다면 "관련 정보 없음"이라고 답해주세요.
추출된 정보만 간단히 답해주세요.
"""
            extracted_response = await call_gemini_api(extraction_prompt)
            
            # 추출된 응답이 유효한지 확인
            if extracted_response and extracted_response.strip() and "관련 정보 없음" not in extracted_response:
                # 추출된 값을 필드에 맞게 가공
                field_config = get_field_config(current_field)
                processed_value = extract_field_value(extracted_response, current_field, field_config)
                
                response = {
                    "message": f"대화 내용에서 '{current_field_label}' 정보를 확인했습니다: {processed_value}",
                    "value": processed_value,
                    "field": current_field,
                    "suggestions": [],
                    "confidence": classification['confidence'],
                    "is_conversation": False  # 필드 값이 추출되었으므로 대화형이 아님
                }
                print(f"[DEBUG] 대화형 입력에서 필드 값 추출 성공: {response}")
                return response
            else:
                # 관련 정보가 없는 경우 대화형 응답
                response = {
                    "message": f"대화 내용을 확인했습니다. 현재 {current_field_label}에 대한 정보를 입력해주세요.",
                    "value": None,
                    "field": current_field,
                    "suggestions": [],
                    "confidence": classification['confidence'],
                    "is_conversation": True
                }
                print(f"[DEBUG] 대화형 입력에서 관련 정보 없음: {response}")
                return response
                
        except Exception as e:
            print(f"[ERROR] 대화형 입력 처리 중 오류: {e}")
            # 오류 발생 시 대화형 응답으로 처리
            response = {
                "message": f"대화 내용을 확인했습니다. 현재 {current_field_label}에 대한 정보를 입력해주세요.",
                "value": None,
                "field": current_field,
                "suggestions": [],
                "confidence": classification['confidence'],
                "is_conversation": True
            }
            return response
    elif classification['type'] == 'chat':
        # 일상 대화 처리
        response = {
            "message": f"안녕하세요! 채용 공고 작성을 도와드리고 있습니다. 현재 {current_field_label}에 대한 정보를 입력해주세요.",
            "value": None,
            "field": current_field,
            "suggestions": [],
            "confidence": classification['confidence']
        }
        print(f"[DEBUG] 일상 대화 응답: {response}")
        return response
    elif classification['type'] == 'unclear':
        # 명확하지 않은 입력 처리 - 다시 말씀해주세요
        field_suggestions = get_field_suggestions(current_field, {})
        response = {
            "message": f"죄송합니다. '{user_input}'이 무엇을 의미하는지 명확하지 않습니다. 현재 {current_field_label}에 대해 다시 말씀해주세요. 예시: {', '.join(field_suggestions[:3])}",
            "value": None,
            "field": current_field,
            "suggestions": field_suggestions,
            "confidence": classification['confidence'],
            "is_unclear": True  # 명확하지 않은 입력임을 표시
        }
        print(f"[DEBUG] 명확하지 않은 입력 응답: {response}")
        return response
    else:
        # 답변인 경우 (개선된 처리)
        # classification에서 추출된 값이 있으면 사용, 없으면 user_input에서 추출 시도
        if classification.get('value'):
            field_value = classification['value']
            field_category = classification.get('category', current_field)
        else:
            # classification에서 값이 없으면 user_input에서 추출 시도
            field_config = get_field_config(current_field)
            field_value = extract_field_value(user_input, current_field, field_config)
            field_category = current_field
        
        print(f"[DEBUG] 답변 처리 결과 - 필드: {field_category}, 값: {field_value}")
        
        # 값이 유효한지 확인 (빈 문자열이나 의미없는 값이 아닌지)
        invalid_values = ["ai 채용공고 등록 도우미", "채용공고 등록 도우미", "ai 어시스턴트", "채용공고", "도우미", "ai"]
        if not field_value or not field_value.strip() or field_value.lower() in invalid_values:
            print(f"[DEBUG] 유효하지 않은 값으로 인식됨: {field_value}")
            # 유효하지 않은 값이면 명확하지 않은 입력으로 처리
            field_suggestions = get_field_suggestions(current_field, {})
            response = {
                "message": f"죄송합니다. '{user_input}'이 무엇을 의미하는지 명확하지 않습니다. 현재 {current_field_label}에 대해 다시 말씀해주세요. 예시: {', '.join(field_suggestions[:3])}",
                "value": None,
                "field": current_field,
                "suggestions": field_suggestions,
                "confidence": 0.7,
                "is_unclear": True
            }
            print(f"[DEBUG] 유효하지 않은 값으로 인한 명확하지 않은 입력 응답: {response}")
            return response
        
        # 필드별 다음 질문 매핑 (AI 어시스턴트 필드 순서에 맞춤)
        field_questions = {
            "department": {
                "question": "몇 명을 채용하실 예정인가요?",
                "suggestions": ["1명", "2명", "3명", "5명", "10명"]
            },
            "headcount": {
                "question": "어떤 업무를 담당하게 될까요?",
                "suggestions": ["개발", "디자인", "마케팅", "영업", "기획", "고객지원"]
            },
            "mainDuties": {
                "question": "근무 시간은 어떻게 되나요?",
                "suggestions": ["09:00-18:00", "10:00-19:00", "유연근무제", "시차출근제"]
            },
            "workHours": {
                "question": "근무 위치는 어디인가요?",
                "suggestions": ["서울", "부산", "대구", "인천", "대전", "광주", "울산"]
            },
            "locationCity": {
                "question": "급여 조건은 어떻게 되나요?",
                "suggestions": ["면접 후 협의", "3000만원", "4000만원", "5000만원", "6000만원"]
            },
            "salary": {
                "question": "마감일은 언제인가요?",
                "suggestions": ["2024년 12월 31일", "2024년 11월 30일", "채용 시 마감", "상시채용"]
            },
            "deadline": {
                "question": "연락처 이메일을 알려주세요.",
                "suggestions": ["hr@company.com", "recruit@company.com", "인사팀 이메일"]
            },
            "contactEmail": {
                "question": "모든 정보 입력이 완료되었습니다!",
                "suggestions": []
            }
        }
        
        # 현재 필드에 대한 다음 질문이 있는지 확인
        next_question = ""
        next_suggestions = []
        if current_field in field_questions:
            next_question = field_questions[current_field]["question"]
            next_suggestions = field_questions[current_field]["suggestions"]
        
        # 응답 메시지에 다음 질문 포함
        if next_question:
            response_message = f"'{current_field_label}'에 대해 '{field_value}'로 입력하겠습니다. {next_question}"
        else:
            response_message = f"'{current_field_label}'에 대해 '{field_value}'로 입력하겠습니다."
        
        response = {
            "message": response_message,
            "value": field_value,
            "field": field_category,  # 분류된 필드명 사용
            "suggestions": next_suggestions,
            "confidence": classification['confidence'],
            "next_question": next_question
        }
        print(f"[DEBUG] ===== simulate_llm_response 결과 =====")
        print(f"[DEBUG] 최종 결과: {response}")
        print("[DEBUG] ===== simulate_llm_response 완료 =====")
        return response

async def call_gemini_api(prompt: str, conversation_history: List[Dict[str, Any]] = None) -> str:
    """
    Gemini API 호출 함수 (RAG 적용)
    """
    try:
        if not model:
            return "AI 서비스를 사용할 수 없습니다. 다시 시도해 주세요."
        
        # --- RAG 로직 추가 시작 ---
        # 1. 사용자 질문을 기반으로 가장 관련성 높은 문서 검색
        relevant_context = await find_relevant_document(prompt)
        
        # 2. 검색된 문서를 컨텍스트로 프롬프트에 추가
        rag_prompt = f"""
        당신은 채용 전문 어시스턴트입니다. 사용자가 채용 공고 작성이나 채용 관련 질문을 할 때 전문적이고 실용적인 답변을 제공해주세요.

        **추가 정보:**
        아래에 제공된 정보를 활용하여 답변의 정확성과 신뢰도를 높여주세요.
        ---
        {relevant_context}
        ---

        **주의사항:**
        - AI 모델에 대한 설명은 하지 마세요
        - 채용 관련 실무적인 조언을 제공하세요
        - 구체적이고 실용적인 답변을 해주세요
        - 한국어로 답변해주세요
        - 모든 답변은 핵심만 간단하게 요약해서 2~3줄 이내로 작성해주세요
        - 불필요한 설명은 생략하고, 요점 위주로 간결하게 답변해주세요
        - '주요 업무'를 작성할 때는 지원자 입장에서 직무 이해도가 높아지도록 구체적인 동사(예: 개발, 분석, 관리 등)를 사용하세요
        - 각 업무는 "무엇을 한다 → 왜 한다" 구조로, 기대 성과까지 간결히 포함해서 자연스럽고 명확하게 서술하세요
        - 번호가 있는 항목(1, 2, 3 등)은 각 줄마다 줄바꿈하여 출력해주세요

        **특별 지시:** 사용자가 '적용해줘', '입력해줘', '이걸로 해줘' 등의 선택적 명령어를 입력하면,  
        직전 AI가 제시한 내용을 그대로 적용하는 동작으로 이해하고,  
        사용자가 추가 설명을 요청하지 않는 이상 답변을 간단히 요약하며 다음 단계로 자연스럽게 넘어가세요.

        **사용자 질문:** {prompt}
        """
        # --- RAG 로직 추가 끝 ---

        # 대화 히스토리 구성
        messages = []
        if conversation_history:
            for msg in conversation_history:
                role = 'user' if msg.get('type') == 'user' else 'model'
                messages.append({"role": role, "parts": [{"text": msg.get('content', '')}]})
        
        # 컨텍스트가 포함된 프롬프트 생성
        messages.append({"role": "user", "parts": [{"text": rag_prompt}]})
        
        # Gemini API 호출
        response = await model.generate_content_async(
            messages,
            safety_settings=[
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_NONE"
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH", 
                    "threshold": "BLOCK_NONE"
                },
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_NONE"
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_NONE"
                }
            ]
        )
        
        return response.text
        
    except Exception as e:
        print(f"[ERROR] Gemini API 호출 실패: {e}")
        traceback.print_exc()
        return f"AI 응답을 가져오는 데 실패했습니다. 다시 시도해 주세요. (오류: {str(e)})"

@router.post("/suggestions")
async def get_suggestions(request: SuggestionsRequest):
    """필드별 제안 가져오기"""
    print("[DEBUG] /suggestions 요청:", request)
    suggestions = get_field_suggestions(request.field, request.context)
    response = {"suggestions": suggestions}
    print("[DEBUG] /suggestions 응답:", response)
    return response

@router.post("/validate")
async def validate_field(request: ValidationRequest):
    """필드 값 검증"""
    print("[DEBUG] /validate 요청:", request)
    validation_result = validate_field_value(request.field, request.value, request.context)
    response = validation_result
    print("[DEBUG] /validate 응답:", response)
    return response

@router.post("/autocomplete")
async def smart_autocomplete(request: AutoCompleteRequest):
    """스마트 자동 완성"""
    print("[DEBUG] /autocomplete 요청:", request)
    suggestions = get_autocomplete_suggestions(request.partial_input, request.field, request.context)
    response = {"completions": completions}
    print("[DEBUG] /autocomplete 응답:", response)
    return response

@router.post("/recommendations")
async def get_recommendations(request: RecommendationsRequest):
    """컨텍스트 기반 추천"""
    print("[DEBUG] /recommendations 요청:", request)
    recommendations = get_contextual_recommendations(request.current_field, request.filled_fields, request.context)
    response = {"recommendations": recommendations}
    print("[DEBUG] /recommendations 응답:", response)
    return response

@router.post("/update-field")
async def update_field_in_realtime(request: FieldUpdateRequest):
    """실시간 필드 업데이트"""
    print("[DEBUG] /update-field 요청:", request)
    if request.session_id in modal_sessions:
        modal_sessions[request.session_id]["filled_fields"][request.field] = request.value
        response = {"status": "success", "message": "필드가 업데이트되었습니다."}
        print("[DEBUG] /update-field 응답:", response)
        return response
    else:
        print("[ERROR] /update-field 유효하지 않은 세션:", request.session_id)
        raise HTTPException(status_code=400, detail="유효하지 않은 세션입니다")

@router.post("/end")
async def end_session(request: dict):
    """세션 종료"""
    print("[DEBUG] /end 요청:", request)
    session_id = request.get("session_id")
    if session_id in sessions:
        del sessions[session_id]
    if session_id in modal_sessions:
        del modal_sessions[session_id]
    response = {"status": "success", "message": "세션이 종료되었습니다."}
    print("[DEBUG] /end 응답:", response)
    return response

def get_questions_for_page(page: str) -> List[Dict[str, Any]]:
    """페이지별 질문 목록"""
    print("[DEBUG] get_questions_for_page 요청:", page)
    questions_map = {
        "job_posting": [
            {"field": "department", "question": "구인 부서를 알려주세요."},
            {"field": "headcount", "question": "채용 인원은 몇 명인가요?"},
            {"field": "mainDuties", "question": "어떤 업무를 담당하게 되나요?"},
            {"field": "workHours", "question": "근무 시간은 어떻게 되나요?"},
            {"field": "locationCity", "question": "근무 위치는 어디인가요?"},
            {"field": "salary", "question": "급여 조건은 어떻게 되나요?"},
            {"field": "deadline", "question": "마감일은 언제인가요?"},
            {"field": "contactEmail", "question": "연락처 이메일을 알려주세요."}
        ]
    }
    questions = questions_map.get(page, [])
    print("[DEBUG] get_questions_for_page 응답:", questions)
    return questions

def get_field_suggestions(field: str, context: Dict[str, Any]) -> List[str]:
    """필드별 제안 목록"""
    print("[DEBUG] get_field_suggestions 요청:", field, context)
    suggestions_map = {
        "department": ["개발", "기획", "마케팅", "디자인", "인사", "영업"],
        "headcount": ["1명", "2명", "3명", "5명", "10명"],
        "mainDuties": [
            "신규 웹 서비스 개발 및 기존 시스템 유지보수를 담당하여 사용자 경험을 개선하고 서비스 안정성을 확보합니다.",
            "사용자 리서치 및 제품 기획을 통해 고객 니즈를 파악하고, 데이터 기반 의사결정으로 제품 경쟁력을 향상시킵니다.",
            "브랜드 마케팅 전략 수립 및 실행을 통해 브랜드 인지도를 높이고, 타겟 고객층의 참여도를 증대시킵니다.",
            "모바일 앱 개발 및 플랫폼 최적화를 통해 사용자 편의성을 향상시키고, 앱스토어 순위 개선을 달성합니다.",
            "데이터 분석 및 인사이트 도출을 통해 비즈니스 성과를 측정하고, 마케팅 캠페인 효과를 최적화합니다."
        ],
        "workType": ["웹 개발", "앱 개발", "디자인", "마케팅", "영업"],
        "workHours": ["09:00-18:00", "10:00-19:00", "유연근무제"],
        "location": ["서울", "부산", "대구", "인천", "대전"],
        "salary": ["면접 후 협의", "3000만원", "4000만원", "5000만원"],
        "deadline": ["2024년 12월 31일", "2024년 11월 30일", "채용 시 마감"],
        "email": ["hr@company.com", "recruit@company.com"]
    }
    suggestions = suggestions_map.get(field, [])
    print("[DEBUG] get_field_suggestions 응답:", suggestions)
    return suggestions

def validate_field_value(field: str, value: str, context: Dict[str, Any]) -> Dict[str, Any]:
    """필드 값 검증"""
    print("[DEBUG] validate_field_value 요청:", field, value, context)
    if field == "email" and "@" not in value:
        response = {"valid": False, "message": "올바른 이메일 형식을 입력해주세요."}
        print("[DEBUG] validate_field_value 응답 (이메일 형식 오류):", response)
        return response
    elif field == "headcount" and not any(char.isdigit() for char in value):
        response = {"valid": False, "message": "숫자를 포함한 인원 수를 입력해주세요."}
        print("[DEBUG] validate_field_value 응답 (헤드카운트 숫자 오류):", response)
        return response
    else:
        response = {"valid": True, "message": "올바른 형식입니다."}
        print("[DEBUG] validate_field_value 응답 (유효):", response)
        return response

def get_autocomplete_suggestions(partial_input: str, field: str, context: Dict[str, Any]) -> List[str]:
    """자동 완성 제안"""
    print("[DEBUG] get_autocomplete_suggestions 요청:", partial_input, field, context)
    suggestions = get_field_suggestions(field, context)
    completions = [s for s in suggestions if partial_input.lower() in s.lower()]
    print("[DEBUG] get_autocomplete_suggestions 응답:", completions)
    return completions

def get_contextual_recommendations(current_field: str, filled_fields: Dict[str, Any], context: Dict[str, Any]) -> List[str]:
    """현재 필드에 대한 컨텍스트 기반 추천사항 생성"""
    recommendations = []
    
    if current_field == "mainDuties":
        recommendations = [
            "개발 및 유지보수",
            "코드 리뷰 및 품질 관리",
            "기술 문서 작성",
            "팀 협업 및 커뮤니케이션"
        ]
    elif current_field == "requirements":
        recommendations = [
            "관련 경험 3년 이상",
            "학사 학위 이상",
            "팀워크 능력",
            "문제 해결 능력"
        ]
    
    return recommendations

def parse_response_items(response_text: str) -> List[Dict[str, Any]]:
    """LLM 응답을 항목별로 분할하여 선택 가능한 형태로 변환"""
    items = []
    
    # 줄바꿈으로 분할
    lines = response_text.strip().split('\n')
    current_item = ""
    item_counter = 1
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # 번호가 있는 항목인지 확인 (1., 2., 3. 등)
        if re.match(r'^\d+\.', line):
            # 이전 항목이 있으면 저장
            if current_item:
                items.append({
                    "id": f"item_{item_counter}",
                    "text": current_item.strip(),
                    "selected": False
                })
                item_counter += 1
            
            # 새 항목 시작
            current_item = line
        else:
            # 번호가 없는 줄은 현재 항목에 추가
            if current_item:
                current_item += " " + line
            else:
                # 첫 번째 항목인 경우
                current_item = line
    
    # 마지막 항목 저장
    if current_item:
        items.append({
            "id": f"item_{item_counter}",
            "text": current_item.strip(),
            "selected": False
        })
    
    # 항목이 없으면 전체 텍스트를 하나의 항목으로 처리
    if not items:
        items.append({
            "id": "item_1",
            "text": response_text.strip(),
            "selected": False
        })
    
    return items

@router.post("/chat")
async def chat_endpoint(request: ChatbotRequest):
    """
    키워드 기반 1차 분류 → LLM 호출 → 응답 처리 API
    """
    print("[DEBUG] /chat 요청:", request)
    
    try:
        user_input = request.user_input
        conversation_history = request.conversation_history
        
        if not user_input:
            raise HTTPException(status_code=400, detail="사용자 입력이 필요합니다.")
        
        # 1) 키워드 기반 1차 분류
        classification = classify_input(user_input)
        print(f"[DEBUG] /chat 분류 결과: {classification}")
        
        # 2) 분류된 결과에 따른 처리
        if classification['type'] == 'field':
            # 필드 값으로 처리
            field_value = classification.get('value', user_input.strip())
            response = {
                "type": "field",
                "content": f"{classification['category']}: {field_value}로 설정되었습니다.",
                "value": field_value,
                "confidence": classification['confidence']
            }
            
        elif classification['type'] == 'question':
            # 3) Gemini API 호출로 답변 생성
            ai_response = await call_gemini_api(user_input, conversation_history)
            response = {
                "type": "answer",
                "content": ai_response,
                "confidence": classification['confidence']
            }
            
        elif classification['type'] == 'chat':
            # 일상 대화 처리
            response = {
                "type": "chat",
                "content": "안녕하세요! 채용 관련 문의사항이 있으시면 언제든 말씀해 주세요.",
                "confidence": classification['confidence']
            }
            
        else:
            # 답변인 경우 기본 처리 (자동 완성)
            response = {
                "type": "answer",
                "content": f"'{user_input}'로 입력하겠습니다. 다음 단계로 진행하겠습니다.",
                "value": user_input.strip(),
                "confidence": classification['confidence']
            }
        
        print("[DEBUG] /chat 응답:", response)
        return response
        
    except Exception as e:
        print(f"[ERROR] /chat 예외: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"처리 중 오류가 발생했습니다: {str(e)}")

def classify_input_with_priority(text: str, current_field: str = None) -> dict:
    """
    개선된 분류 로직: 명확한 조건에 해당하지 않으면 다시 말씀해주세요
    1단계: 명확한 질문 감지
    2단계: 현재 필드에 대한 명확한 답변 감지
    2.5단계: 대화형 입력에서 맥락/키워드 캐치 시도
    3단계: 명확하지 않은 경우 "다시 말씀해주세요" 응답
    """
    text_lower = text.lower()
    text_length = len(text.strip())
    
    print(f"[DEBUG] ===== classify_input_with_priority 시작 =====")
    print(f"[DEBUG] 입력 텍스트: {text}")
    print(f"[DEBUG] 현재 필드: {current_field}")
    
    # 1단계: 명확한 질문 감지
    question_indicators = [
        # 의문사
        "어떻게", "왜", "무엇", "뭐", "언제", "어디", "어느", "어떤", "무슨",
        # 질문 어미
        "있을까", "있나요", "인가요", "일까", "될까", "할까", "어때", "어떠",
        # 질문 조사
        "?", "인가", "일까", "될까", "할까",
        # 구체적 질문 패턴
        "몇 명", "몇명", "얼마나", "어느 정도", "어떤 정도",
        # 추천/제안 요청
        "추천", "제안", "추천좀", "제안좀", "추천해", "제안해", "추천해줘", "제안해줘",
        "추천해주세요", "제안해주세요", "추천해주시면", "제안해주시면",
        # 정보 요청
        "알려줘", "보여줘", "도와줘", "좀해", "좀 해", "알려주세요", "보여주세요", "도와주세요",
        # 대화형 질문 패턴
        "그럼", "그러면", "혹시", "예를 들어", "어떤가", "좋을까", "될까", "할까",
        "어떤가요", "좋을까요", "될까요", "할까요", "어떻게요", "어떤지", "어떤지요"
    ]
    
    # 명확한 질문 키워드가 포함되어 있거나 "?"로 끝나는 경우
    if any(indicator in text_lower for indicator in question_indicators) or text.strip().endswith("?"):
        matched_indicators = [ind for ind in question_indicators if ind in text_lower]
        print(f"[DEBUG] 1단계 - 명확한 질문 감지: {matched_indicators}")
        return {'type': 'question', 'category': 'clear_question', 'confidence': 0.95}
    
    # 2단계: 현재 필드에 대한 명확한 답변 감지
    if current_field:
        field_config = get_field_config(current_field)
        field_keywords = get_field_keywords(current_field)
        
        # 현재 필드와 관련된 키워드가 포함되어 있는지 확인
        matched_field_keywords = [kw for kw in field_keywords if kw in text_lower]
        
        if matched_field_keywords:
            print(f"[DEBUG] 2단계 - 필드 관련 키워드 감지: {matched_field_keywords}")
            
            # 추가 검증: 실제로 해당 필드에 대한 답변인지 확인
            if is_valid_answer_for_field(text, current_field):
                extracted_value = extract_field_value(text, current_field, field_config)
                print(f"[DEBUG] 2단계 - 명확한 답변으로 분류, 추출값: {extracted_value}")
                return {
                    'type': 'answer',
                    'category': current_field,
                    'value': extracted_value,
                    'confidence': 0.9
                }
            else:
                print(f"[DEBUG] 2단계 - 키워드는 있지만 유효하지 않은 답변")
        else:
            print(f"[DEBUG] 2단계 - 필드 관련 키워드 없음")
    else:
        # 현재 필드가 없는 경우, 더 정교한 키워드 매칭 시도
        print(f"[DEBUG] 2단계 - 현재 필드가 없음, 정교한 키워드 매칭 시도")
        
        # 우선순위가 높은 필드부터 검색 (더 구체적인 키워드를 가진 필드 우선)
        priority_fields = ['mainDuties', 'headcount', 'salary', 'workHours', 'locationCity', 'deadline', 'contactEmail', 'department']
        
        # mainDuties 관련 구체적 키워드 먼저 확인 (우선순위 최고)
        mainduties_specific_keywords = ['웹개발', '앱개발', '모바일개발', '서버개발', '프론트엔드', '백엔드', '풀스택', 
                                      'UI/UX', 'UI디자인', 'UX디자인', '그래픽디자인', '편집디자인', '패키지디자인',
                                      '브랜드마케팅', '디지털마케팅', '콘텐츠마케팅', 'SNS마케팅', '퍼포먼스마케팅',
                                      '데이터분석', 'AI개발', '프로그래밍', '코딩']
        
        if any(kw in text_lower for kw in mainduties_specific_keywords):
            field_config = get_field_config('mainDuties')
            extracted_value = extract_field_value(text, 'mainDuties', field_config)
            print(f"[DEBUG] 2단계 - mainDuties 필드 구체적 키워드로 분류, 추출값: {extracted_value}")
            return {
                'type': 'answer',
                'category': 'mainDuties',
                'value': extracted_value,
                'confidence': 0.95
            }
        
        # headcount 관련 키워드 확인 (우선순위 높음)
        headcount_keywords = ['명', '인원', '사람', '1명', '2명', '3명', '4명', '5명', '6명', '7명', '8명', '9명', '10명',
                            '한 명', '두 명', '세 명', '네 명', '다섯 명', '여섯 명', '일곱 명', '여덟 명', '아홉 명', '열 명']
        if any(kw in text_lower for kw in headcount_keywords):
            field_config = get_field_config('headcount')
            extracted_value = extract_field_value(text, 'headcount', field_config)
            print(f"[DEBUG] 2단계 - headcount 필드 키워드로 분류, 추출값: {extracted_value}")
            return {
                'type': 'answer',
                'category': 'headcount',
                'value': extracted_value,
                'confidence': 0.9
            }
        
        # workHours 관련 키워드 확인
        workhours_keywords = ['시', '분', '시간', '09:00', '10:00', '18:00', '19:00', '유연근무', '재택근무', '시차출근',
                            '오전', '오후', '아침', '저녁', '평일', '주말', '주중']
        if any(kw in text_lower for kw in workhours_keywords):
            field_config = get_field_config('workHours')
            extracted_value = extract_field_value(text, 'workHours', field_config)
            print(f"[DEBUG] 2단계 - workHours 필드 키워드로 분류, 추출값: {extracted_value}")
            return {
                'type': 'answer',
                'category': 'workHours',
                'value': extracted_value,
                'confidence': 0.9
            }
        
        for field in priority_fields:
            field_keywords = get_field_keywords(field)
            matched_field_keywords = [kw for kw in field_keywords if kw in text_lower]
            
            if matched_field_keywords:
                print(f"[DEBUG] 2단계 - {field} 필드 키워드 감지: {matched_field_keywords}")
                field_config = get_field_config(field)
                
                if is_valid_answer_for_field(text, field):
                    extracted_value = extract_field_value(text, field, field_config)
                    print(f"[DEBUG] 2단계 - {field} 필드 명확한 답변으로 분류, 추출값: {extracted_value}")
                    return {
                        'type': 'answer',
                        'category': field,
                        'value': extracted_value,
                        'confidence': 0.85
                    }
    
    # 2.5단계: 대화형 입력에서 맥락/키워드 캐치 시도 (개선된 로직)
    if text_length > 5:  # 충분한 길이의 대화형 입력인 경우 (current_field 조건 제거)
        print(f"[DEBUG] 2.5단계 - 대화형 입력에서 맥락/키워드 캐치 시도")
        
        # 혼합형 입력인지 확인 (답변 + 질문)
        has_answer_part = False
        has_question_part = False
        
        # 답변 부분이 있는지 확인
        field_config = get_field_config(current_field)
        field_keywords = get_field_keywords(current_field)
        matched_field_keywords = [kw for kw in field_keywords if kw in text_lower]
        
        if matched_field_keywords:
            has_answer_part = True
            print(f"[DEBUG] 2.5단계 - 답변 부분 감지: {matched_field_keywords}")
        
        # 질문 부분이 있는지 확인
        if any(indicator in text_lower for indicator in question_indicators) or text.strip().endswith("?"):
            has_question_part = True
            print(f"[DEBUG] 2.5단계 - 질문 부분 감지")
        
        # 혼합형 입력인 경우
        if has_answer_part and has_question_part:
            print(f"[DEBUG] 2.5단계 - 혼합형 입력으로 분류")
            return {
                'type': 'conversational_answer',
                'category': 'mixed_input',
                'confidence': 0.8
            }
        
        # 대화형 답변인 경우
        elif has_answer_part:
            print(f"[DEBUG] 2.5단계 - 대화형 답변으로 분류")
            return {
                'type': 'conversational_answer',
                'category': 'conversational_answer',
                'confidence': 0.7
            }
        
        # 대화형 질문인 경우
        elif has_question_part:
            print(f"[DEBUG] 2.5단계 - 대화형 질문으로 분류")
            return {
                'type': 'question',
                'category': 'conversational_question',
                'confidence': 0.7
            }
        
        # 일반 대화형 입력인 경우
        else:
            print(f"[DEBUG] 2.5단계 - 일반 대화형 입력으로 분류")
            return {
                'type': 'conversational_answer',
                'category': 'context_extraction',
                'confidence': 0.6
            }
    
    # 3단계: 명확하지 않은 경우 - 다시 말씀해주세요
    print(f"[DEBUG] 3단계 - 명확하지 않은 입력, 다시 말씀해주세요 응답")
    return {'type': 'unclear', 'category': 'clarification_needed', 'confidence': 0.8}

def get_field_keywords(field: str) -> list:
    """필드별 키워드 반환 (대화형 입력 고려)"""
    field_keywords = {
        'department': [
            '개발팀', '마케팅팀', '영업팀', '디자인팀', '기획팀', '인사팀', 
            '개발자', '마케터', '영업사원', '디자이너', '기획자', '인사담당자',
            '프로그래머', '코더', 'UX디자이너', 'UI디자이너', '그래픽디자이너'
        ],
        'headcount': [
            '명', '인원', '사람', '1명', '2명', '3명', '4명', '5명', '6명', '7명', '8명', '9명', '10명',
            '한 명', '두 명', '세 명', '네 명', '다섯 명', '여섯 명', '일곱 명', '여덟 명', '아홉 명', '열 명'
        ],
        'mainDuties': [
            '프로그래밍', '코딩', '웹개발', '앱개발', '백엔드', '프론트엔드', '풀스택',
            'UI/UX', '그래픽디자인', '브랜딩', '광고', '홍보', '콘텐츠', 'SNS',
            '고객관리', '매출관리', '전략기획', '사업기획', '제품기획',
            '웹개발', '앱개발', '모바일개발', '서버개발', '데이터분석', 'AI개발',
            'UI디자인', 'UX디자인', '그래픽디자인', '편집디자인', '패키지디자인',
            '브랜드마케팅', '디지털마케팅', '콘텐츠마케팅', 'SNS마케팅', '퍼포먼스마케팅'
        ],
        'workHours': [
            '시', '분', '시간', '09:00', '10:00', '18:00', '19:00', '유연근무', '재택근무', '시차출근',
            '오전', '오후', '아침', '저녁', '평일', '주말', '주중'
        ],
        'locationCity': [
            '서울', '부산', '대구', '인천', '대전', '광주', '울산', '세종', 
            '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
            '강남', '강북', '서초', '송파', '마포', '용산', '영등포', '동대문', '중구'
        ],
        'salary': [
            '만원', '원', '연봉', '월급', '급여', '보수', '임금', '면접', '협의',
            '3000', '4000', '5000', '6000', '7000', '8000', '9000', '10000'
        ],
        'deadline': [
            '년', '월', '일', '마감', '지원', '채용', '마감일', '상시채용', '채용시마감',
            '2024', '2025', '12월', '11월', '10월', '9월'
        ],
        'contactEmail': [
            '@', '이메일', 'email', '메일', 'mail', 'hr', 'recruit', '인사', '채용'
        ]
    }
    return field_keywords.get(field, [])

def get_field_config(field: str) -> dict:
    """필드별 설정 반환"""
    field_configs = {
        'department': {'extract_value': True},
        'headcount': {'extract_value': True, 'extract_number': True},
        'mainDuties': {'extract_value': True},
        'workHours': {'extract_value': True},
        'location': {'extract_value': True},
        'salary': {'extract_value': True, 'extract_number': True},
        'deadline': {'extract_value': True},
        'contactEmail': {'extract_value': True}
    }
    return field_configs.get(field, {})

def has_field_keywords(text: str, field: str) -> bool:
    """텍스트에 해당 필드의 키워드가 포함되어 있는지 확인"""
    keywords = get_field_keywords(field)
    text_lower = text.lower()
    return any(kw in text_lower for kw in keywords)

async def generate_ai_assistant_response(user_input: str, field: Dict[str, Any], session: Dict[str, Any]) -> Dict[str, Any]:
    """AI 도우미용 응답 생성 (개선된 Gemini API 사용)"""
    print("[DEBUG] ===== AI 어시스턴트 응답 생성 시작 =====")
    print("[DEBUG] 사용자 입력:", user_input)
    print("[DEBUG] 현재 필드:", field)
    print("[DEBUG] 세션 정보:", session)
    
    field_key = field.get("key", "")
    field_label = field.get("label", "")
    print(f"[DEBUG] 필드 키: {field_key}, 필드 라벨: {field_label}")
    
    # 1) 키워드 기반 1차 분류
    classification = classify_input(user_input)
    print(f"[DEBUG] 분류 결과: {classification}")
    print(f"[DEBUG] 분류 타입: {classification.get('type')}")
    print(f"[DEBUG] 분류 카테고리: {classification.get('category')}")
    print(f"[DEBUG] 분류 값: {classification.get('value')}")
    print(f"[DEBUG] 신뢰도: {classification.get('confidence')}")
    
    # 2) 분류된 결과에 따른 처리
    if classification['type'] == 'question':
        # 질문인 경우 Gemini API 호출
        try:
            ai_assistant_context = f"""
현재 채용 공고 작성 중입니다. 현재 필드: {field_label} ({field_key})

사용자 질문: {user_input}

이 질문에 대해 채용 공고 작성에 도움이 되는 실무적인 답변을 제공해주세요.
"""
            ai_response = await call_gemini_api(ai_assistant_context)
            
            # 응답을 항목별로 분할
            items = parse_response_items(ai_response)
            
            response = {
                "message": ai_response,
                "value": None,  # 질문이므로 value는 None
                "field": field_key,
                "suggestions": [],
                "confidence": classification['confidence'],
                "items": items,
                "show_item_selection": True  # 항목 선택 UI 표시
            }
            print(f"[DEBUG] 질문 응답 (항목 선택 포함): {response}")
            return response
            
        except Exception as e:
            print(f"[ERROR] Gemini API 호출 실패: {e}")
            # 오프라인 응답으로 대체
            response = {
                "message": f"'{user_input}'에 대한 답변을 제공해드리겠습니다. 현재 필드 '{field_label}'에 대한 정보를 입력해주세요.",
                "value": None,
                "field": field_key,
                "suggestions": [],
                "confidence": 0.5
            }
            return response
    elif classification['type'] == 'chat':
        # 일상 대화 처리
        response = {
            "message": f"안녕하세요! 채용 공고 작성에 도와드리고 있습니다. 현재 {field_label}에 대한 정보를 입력해주세요.",
            "value": None,
            "field": field_key,
            "suggestions": [],
            "confidence": classification['confidence']
        }
        print(f"[DEBUG] 일상 대화 응답: {response}")
        return response
    else:
        # 답변인 경우 (개선된 처리)
        field_value = classification.get('value', user_input)
        print(f"[DEBUG] 답변 처리 결과 - 필드: {field_key}, 값: {field_value}")
        
        response = {
            "message": f"'{field_label}'에 대해 '{field_value}'로 입력하겠습니다.",
            "value": field_value,
            "field": field_key,
            "suggestions": [],
            "confidence": classification['confidence']
        }
        print(f"[DEBUG] ===== AI 어시스턴트 응답 생성 완료 =====")
        print(f"[DEBUG] 최종 결과: {response}")
        print("[DEBUG] ===== AI 어시스턴트 응답 생성 완료 =====")
        return response
