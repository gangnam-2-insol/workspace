import requests
import json
import time
from datetime import datetime

# 테스트 설정
BASE_URL = "http://localhost:8000/api/chatbot/chat"
SESSION_ID = f"test_session_{datetime.now().strftime('%Y%m%d%H%M%S')}"

# 테스트 케이스 정의 (100개)
test_cases = [
    # 1. 직접적인 답변 (명확한 필드 값) - 20개
    {"input": "개발팀", "expected": "department"},
    {"input": "3명", "expected": "headcount"},
    {"input": "웹개발", "expected": "mainDuties"},
    {"input": "09:00-18:00", "expected": "workHours"},
    {"input": "서울", "expected": "locationCity"},
    {"input": "5000만원", "expected": "salary"},
    {"input": "2024년 12월 31일", "expected": "deadline"},
    {"input": "hr@company.com", "expected": "contactEmail"},
    {"input": "디자인팀", "expected": "department"},
    {"input": "5명", "expected": "headcount"},
    {"input": "UI/UX 디자인", "expected": "mainDuties"},
    {"input": "10:00-19:00", "expected": "workHours"},
    {"input": "부산", "expected": "locationCity"},
    {"input": "4000만원", "expected": "salary"},
    {"input": "2024년 11월 30일", "expected": "deadline"},
    {"input": "design@company.com", "expected": "contactEmail"},
    {"input": "마케팅팀", "expected": "department"},
    {"input": "2명", "expected": "headcount"},
    {"input": "SNS 마케팅", "expected": "mainDuties"},
    {"input": "08:30-17:30", "expected": "workHours"},
    
    # 2. 대화형 답변 (맥락에서 추출 가능한 정보) - 20개
    {"input": "우리 회사는 개발팀에서 일할 사람을 찾고 있어", "expected": "department"},
    {"input": "인원은 2명 정도로 생각하고 있어", "expected": "headcount"},
    {"input": "주로 웹 개발과 앱 개발을 담당하게 될 거야", "expected": "mainDuties"},
    {"input": "근무시간은 오전 9시부터 오후 6시까지야", "expected": "workHours"},
    {"input": "서울 강남구에 있는 회사야", "expected": "locationCity"},
    {"input": "연봉은 5000만원 정도로 생각하고 있어", "expected": "salary"},
    {"input": "마감일은 올해 12월 말까지야", "expected": "deadline"},
    {"input": "지원은 hr@company.com으로 받을 예정이야", "expected": "contactEmail"},
    {"input": "IT 회사라서 개발자가 필요해", "expected": "department"},
    {"input": "신입 2명, 경력 1명 총 3명 뽑을 예정이야", "expected": "headcount"},
    {"input": "프론트엔드와 백엔드 개발을 담당하게 될 거야", "expected": "mainDuties"},
    {"input": "유연근무제를 운영하고 있어서 자유롭게 출근할 수 있어", "expected": "workHours"},
    {"input": "강남역 근처에 있는 스타트업이야", "expected": "locationCity"},
    {"input": "신입은 3000만원, 경력은 5000만원 정도로 생각하고 있어", "expected": "salary"},
    {"input": "상시채용으로 진행할 예정이야", "expected": "deadline"},
    {"input": "recruit@startup.com으로 지원받을 거야", "expected": "contactEmail"},
    {"input": "디자인 회사에서 일할 사람을 구해요", "expected": "department"},
    {"input": "경력자 1명 뽑을 예정입니다", "expected": "headcount"},
    {"input": "브랜딩과 패키지 디자인을 담당하게 됩니다", "expected": "mainDuties"},
    
    # 3. 질문/요청 (추천, 제안 등) - 15개
    {"input": "개발팀 추천해줘", "expected": "question"},
    {"input": "인원 몇 명이 좋을까?", "expected": "question"},
    {"input": "주요 업무는 뭐가 좋을까?", "expected": "question"},
    {"input": "근무시간 어떻게 정할까?", "expected": "question"},
    {"input": "어디 지역이 좋을까?", "expected": "question"},
    {"input": "연봉은 얼마가 적당할까?", "expected": "question"},
    {"input": "마감일 언제로 하면 좋을까?", "expected": "question"},
    {"input": "이메일 주소 어떻게 정할까?", "expected": "question"},
    {"input": "디자인팀 주요 업무 3개만 추천좀", "expected": "question"},
    {"input": "연봉 범위 알려줘", "expected": "question"},
    {"input": "근무시간 추천해줘", "expected": "question"},
    {"input": "지역 추천해줘", "expected": "question"},
    {"input": "인원수 제안해줘", "expected": "question"},
    {"input": "마감일 제안해줘", "expected": "question"},
    {"input": "이메일 주소 제안해줘", "expected": "question"},
    
    # 4. 불명확한 입력 - 10개
    {"input": "안녕하세요", "expected": "unclear"},
    {"input": "그냥", "expected": "unclear"},
    {"input": "음...", "expected": "unclear"},
    {"input": "잘 모르겠어", "expected": "unclear"},
    {"input": "아무거나", "expected": "unclear"},
    {"input": "그래", "expected": "unclear"},
    {"input": "좋아", "expected": "unclear"},
    {"input": "알겠어", "expected": "unclear"},
    {"input": "네", "expected": "unclear"},
    {"input": "아", "expected": "unclear"},
    
    # 5. 혼합형 입력 (답변과 질문이 섞인 경우) - 15개
    {"input": "개발팀인데 인원은 몇 명이 좋을까?", "expected": "conversational_answer"},
    {"input": "웹개발 하는데 연봉은 얼마가 적당할까?", "expected": "conversational_answer"},
    {"input": "서울에 있는데 근무시간은 어떻게 정할까?", "expected": "conversational_answer"},
    {"input": "3명 뽑을 건데 주요 업무는 뭐가 좋을까?", "expected": "conversational_answer"},
    {"input": "09:00-18:00 근무인데 어디 지역이 좋을까?", "expected": "conversational_answer"},
    {"input": "5000만원 연봉인데 마감일은 언제로 하면 좋을까?", "expected": "conversational_answer"},
    {"input": "hr@company.com으로 받을 건데 인원은 몇 명이 좋을까?", "expected": "conversational_answer"},
    {"input": "디자인팀인데 연봉은 얼마가 적당할까?", "expected": "conversational_answer"},
    {"input": "UI/UX 디자인 하는데 근무시간은 어떻게 정할까?", "expected": "conversational_answer"},
    {"input": "부산에 있는데 인원은 몇 명이 좋을까?", "expected": "conversational_answer"},
    {"input": "2명 뽑을 건데 지역은 어디가 좋을까?", "expected": "conversational_answer"},
    {"input": "10:00-19:00 근무인데 연봉은 얼마가 적당할까?", "expected": "conversational_answer"},
    {"input": "4000만원 연봉인데 주요 업무는 뭐가 좋을까?", "expected": "conversational_answer"},
    {"input": "design@company.com으로 받을 건데 근무시간은 어떻게 정할까?", "expected": "conversational_answer"},
    {"input": "마케팅팀인데 인원은 몇 명이 좋을까?", "expected": "conversational_answer"},
    
    # 6. 다양한 표현 방식 - 10개
    {"input": "개발자 구해요", "expected": "department"},
    {"input": "프로그래머 2명", "expected": "headcount"},
    {"input": "코딩 담당", "expected": "mainDuties"},
    {"input": "오전 9시 출근", "expected": "workHours"},
    {"input": "강남구", "expected": "locationCity"},
    {"input": "연봉 4000만원", "expected": "salary"},
    {"input": "채용시 마감", "expected": "deadline"},
    {"input": "채용 담당자 메일", "expected": "contactEmail"},
    {"input": "디자이너 구해요", "expected": "department"},
    {"input": "그래픽 디자이너 1명", "expected": "headcount"},
    
    # 7. 추가 대화형 답변 - 10개
    {"input": "우리 회사는 IT 회사라서 개발팀이 필요해", "expected": "department"},
    {"input": "신입 2명, 경력 1명 총 3명 뽑을 예정이야", "expected": "headcount"},
    {"input": "프론트엔드와 백엔드 개발을 담당하게 될 거야", "expected": "mainDuties"},
    {"input": "유연근무제를 운영하고 있어서 자유롭게 출근할 수 있어", "expected": "workHours"},
    {"input": "강남역 근처에 있는 스타트업이야", "expected": "locationCity"},
    {"input": "신입은 3000만원, 경력은 5000만원 정도로 생각하고 있어", "expected": "salary"},
    {"input": "상시채용으로 진행할 예정이야", "expected": "deadline"},
    {"input": "recruit@startup.com으로 지원받을 거야", "expected": "contactEmail"},
    {"input": "디자인 회사에서 일할 사람을 구해요", "expected": "department"},
    {"input": "경력자 1명 뽑을 예정입니다", "expected": "headcount"},
]

def run_test(test_case, test_number):
    """개별 테스트 실행"""
    user_input = test_case["input"]
    expected = test_case["expected"]
    
    print(f"[테스트 {test_number}] 입력: '{user_input}'")
    
    try:
        payload = {
            "user_input": user_input,
            "mode": "modal_assistant",
            "session_id": SESSION_ID
        }
        
        response = requests.post(BASE_URL, json=payload, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        
        print(f"  응답: {result.get('message', 'N/A')}")
        print(f"  필드: {result.get('field', 'N/A')}")
        print(f"  값: {result.get('value', 'N/A')}")
        print(f"  타입: {result.get('type', 'N/A')}")
        
        return {
            "test_number": test_number,
            "input": user_input,
            "expected": expected,
            "response": result,
            "success": True,
            "error": None
        }
        
    except Exception as e:
        print(f"  오류: {str(e)}")
        return {
            "test_number": test_number,
            "input": user_input,
            "expected": expected,
            "response": None,
            "success": False,
            "error": str(e)
        }

def main():
    """메인 테스트 실행"""
    print("=== Modal Assistant 100회 테스트 시작 ===")
    print(f"세션 ID: {SESSION_ID}")
    print()
    
    test_results = []
    success_count = 0
    total_count = 0
    
    for i, test_case in enumerate(test_cases, 1):
        total_count += 1
        result = run_test(test_case, i)
        test_results.append(result)
        
        if result["success"]:
            success_count += 1
        
        print()
        time.sleep(0.5)  # 서버 부하 방지
    
    # 결과 요약
    print("=== 테스트 결과 요약 ===")
    print(f"총 테스트: {total_count}")
    print(f"성공: {success_count}")
    print(f"실패: {total_count - success_count}")
    print(f"성공률: {(success_count / total_count) * 100:.2f}%")
    
    # 실패한 테스트 상세 정보
    failed_tests = [r for r in test_results if not r["success"]]
    if failed_tests:
        print()
        print("=== 실패한 테스트 상세 ===")
        for failed_test in failed_tests:
            print(f"[테스트 {failed_test['test_number']}] {failed_test['input']} - {failed_test['error']}")
    
    # 결과를 파일로 저장
    results_file = f"test_results_100_{datetime.now().strftime('%Y%m%d%H%M%S')}.json"
    with open(results_file, 'w', encoding='utf-8') as f:
        json.dump(test_results, f, ensure_ascii=False, indent=2)
    
    print()
    print(f"상세 결과가 {results_file} 파일에 저장되었습니다.")

if __name__ == "__main__":
    main() 