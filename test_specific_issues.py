import requests
import json

def test_specific_issues():
    """특정 문제점들을 테스트하는 함수"""
    
    base_url = "http://localhost:8000/api/chatbot"
    
    # 먼저 세션 시작
    try:
        start_response = requests.post(
            f"{base_url}/start-ai-assistant",
            json={
                "page": "recruitment",
                "fields": [],
                "mode": "modal_assistant"
            },
            headers={"Content-Type": "application/json"}
        )
        
        if start_response.status_code != 200:
            print(f"❌ 세션 시작 실패: {start_response.status_code} - {start_response.text}")
            return
        
        session_data = start_response.json()
        session_id = session_data["session_id"]
        print(f"✅ 세션 시작 성공: {session_id}")
        
    except Exception as e:
        print(f"❌ 세션 시작 오류: {e}")
        return
    
    # 테스트 케이스들
    test_cases = [
        # mainDuties 분류 테스트
        {"input": "웹개발", "expected_field": "mainDuties"},
        {"input": "UI/UX 디자인", "expected_field": "mainDuties"},
        {"input": "SNS 마케팅", "expected_field": "mainDuties"},
        {"input": "그래픽디자인", "expected_field": "mainDuties"},
        
        # headcount 추출 테스트
        {"input": "인원은 2명 정도로 생각하고 있어", "expected_field": "headcount", "expected_value": "2명"},
        {"input": "한 명 정도", "expected_field": "headcount", "expected_value": "1명"},
        {"input": "두 명 정도", "expected_field": "headcount", "expected_value": "2명"},
        
        # workHours 추출 테스트
        {"input": "근무시간은 오전 9시부터 오후 6시까지야", "expected_field": "workHours", "expected_value": "09:00-18:00"},
        {"input": "9시부터 6시까지", "expected_field": "workHours", "expected_value": "09:00-18:00"},
    ]
    
    print("\n=== 특정 문제점 테스트 시작 ===\n")
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"테스트 {i}: {test_case['input']}")
        
        try:
            response = requests.post(
                f"{base_url}/ai-assistant-chat",
                json={
                    "session_id": session_id,
                    "user_input": test_case['input'],
                    "conversation_history": [],
                    "mode": "modal_assistant"
                },
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"응답: {result}")
                
                # 예상 필드 확인
                if 'expected_field' in test_case:
                    if result.get('field') == test_case['expected_field']:
                        print(f"✅ 필드 분류 성공: {test_case['expected_field']}")
                    else:
                        print(f"❌ 필드 분류 실패: 예상 {test_case['expected_field']}, 실제 {result.get('field')}")
                
                # 예상 값 확인
                if 'expected_value' in test_case:
                    if result.get('value') == test_case['expected_value']:
                        print(f"✅ 값 추출 성공: {test_case['expected_value']}")
                    else:
                        print(f"❌ 값 추출 실패: 예상 {test_case['expected_value']}, 실제 {result.get('value')}")
                
            else:
                print(f"❌ API 오류: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"❌ 테스트 오류: {e}")
        
        print("-" * 50)
        
        # 잠시 대기 (서버 로그 확인용)
        import time
        time.sleep(1)

if __name__ == "__main__":
    test_specific_issues() 