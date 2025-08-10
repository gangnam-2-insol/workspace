# -*- coding: utf-8 -*-
import requests
import json

def test_general_chat():
    """일반 대화 테스트"""
    url = "http://localhost:8080/api/chatbot/test-mode-chat"
    
    # 테스트할 질문들
    test_questions = [
        "안녕하세요",
        "도움말",
        "감사합니다"
    ]
    
    for question in test_questions:
        print(f"\n=== 테스트 질문: {question} ===")
        
        try:
            payload = {
                "user_input": question,
                "conversation_history": []
            }
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ 성공: {result.get('message', '응답 없음')}")
            else:
                print(f"❌ 오류: HTTP {response.status_code}")
                print(f"응답: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("❌ 서버 연결 실패 - 서버가 실행 중인지 확인하세요")
        except requests.exceptions.Timeout:
            print("❌ 요청 시간 초과")
        except Exception as e:
            print(f"❌ 예외 발생: {e}")

if __name__ == "__main__":
    test_general_chat()
