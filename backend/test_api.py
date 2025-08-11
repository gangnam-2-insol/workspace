#!/usr/bin/env python3
"""
API 엔드포인트 테스트 스크립트
"""

import requests
import json

def test_api_endpoints():
    """API 엔드포인트를 테스트합니다."""
    
    base_url = "http://localhost:8000"
    
    test_cases = [
        {
            "endpoint": "/api/chatbot/test-mode-chat",
            "data": {
                "user_input": "최신 개발 트렌드 알려줘",
                "conversation_history": []
            },
            "description": "테스트중 모드 - 검색 요청"
        },
        {
            "endpoint": "/api/chatbot/test-mode-chat",
            "data": {
                "user_input": "연봉 4000만원의 월급",
                "conversation_history": []
            },
            "description": "테스트중 모드 - 계산 요청"
        },
        {
            "endpoint": "/api/chatbot/test-mode-chat",
            "data": {
                "user_input": "저장된 채용공고 보여줘",
                "conversation_history": []
            },
            "description": "테스트중 모드 - DB 조회 요청"
        },
        {
            "endpoint": "/api/chatbot/test-mode-chat",
            "data": {
                "user_input": "안녕하세요",
                "conversation_history": []
            },
            "description": "테스트중 모드 - 일반 대화"
        },
        {
            "endpoint": "/api/chatbot/test-mode-chat",
            "data": {
                "user_input": "개발자 뽑아요",
                "conversation_history": []
            },
            "description": "테스트중 모드 - 채용공고 작성"
        },
        {
            "endpoint": "/api/chatbot/test-mode-chat",
            "data": {
                "user_input": "프론트엔드 개발자 채용공고 작성해줘",
                "conversation_history": []
            },
            "description": "테스트중 모드 - 구체적 채용공고 작성"
        }
    ]
    
    print("🧪 API 엔드포인트 테스트 시작\n")
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"테스트 {i}: {test_case['description']}")
        print(f"엔드포인트: {test_case['endpoint']}")
        print(f"입력: {test_case['data']['user_input']}")
        
        try:
            response = requests.post(
                f"{base_url}{test_case['endpoint']}",
                json=test_case['data'],
                headers={"Content-Type": "application/json"}
            )
            
            print(f"상태 코드: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"응답:")
                print(data.get('message', data)[:200] + "..." if len(data.get('message', data)) > 200 else data.get('message', data))
            else:
                print(f"오류: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("❌ 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.")
            break
        except Exception as e:
            print(f"테스트 실패: {str(e)}")
        
        print("-" * 50)
    
    print("✅ API 테스트 완료!")

if __name__ == "__main__":
    test_api_endpoints()
