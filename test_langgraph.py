#!/usr/bin/env python3
"""
LangGraph 시스템 테스트 스크립트
"""

import asyncio
import requests
import json

# API 기본 URL
API_BASE_URL = "http://localhost:8000"

def test_langgraph_info():
    """LangGraph 시스템 정보 테스트"""
    print("🔍 LangGraph 시스템 정보 확인 중...")
    
    try:
        response = requests.get(f"{API_BASE_URL}/langgraph-info")
        data = response.json()
        
        print(f"✅ 응답 상태: {response.status_code}")
        print(f"📋 시스템 정보:")
        print(json.dumps(data, indent=2, ensure_ascii=False))
        
        if data.get("available"):
            print("🎉 LangGraph 시스템이 정상적으로 작동 중입니다!")
            return True
        else:
            print("❌ LangGraph 시스템을 사용할 수 없습니다.")
            return False
            
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        return False

def test_langgraph_chat(user_input):
    """LangGraph 채팅 테스트"""
    print(f"\n💬 LangGraph 채팅 테스트: '{user_input}'")
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/langgraph-chat",
            json={
                "user_input": user_input,
                "conversation_history": []
            }
        )
        
        data = response.json()
        
        print(f"✅ 응답 상태: {response.status_code}")
        print(f"🤖 AI 응답:")
        print(data.get("message", "응답 없음"))
        
        return True
        
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        return False

def test_comparison():
    """기존 시스템과 LangGraph 시스템 비교 테스트"""
    print("\n🔄 시스템 비교 테스트")
    
    test_inputs = [
        "최신 개발 트렌드 알려줘",
        "연봉 4000만원의 월급은 얼마야?",
        "채용공고 작성해줘",
        "저장된 채용공고 보여줘",
        "안녕하세요"
    ]
    
    for user_input in test_inputs:
        print(f"\n{'='*50}")
        print(f"테스트 입력: {user_input}")
        print(f"{'='*50}")
        
        # 기존 시스템 테스트
        print("\n📋 기존 Agent 시스템:")
        try:
            response = requests.post(
                f"{API_BASE_URL}/test-mode-chat",
                json={
                    "user_input": user_input,
                    "conversation_history": []
                }
            )
            data = response.json()
            print(f"응답: {data.get('message', '응답 없음')[:100]}...")
        except Exception as e:
            print(f"오류: {e}")
        
        # LangGraph 시스템 테스트
        print("\n🚀 LangGraph 시스템:")
        try:
            response = requests.post(
                f"{API_BASE_URL}/langgraph-chat",
                json={
                    "user_input": user_input,
                    "conversation_history": []
                }
            )
            data = response.json()
            print(f"응답: {data.get('message', '응답 없음')[:100]}...")
        except Exception as e:
            print(f"오류: {e}")

def main():
    """메인 테스트 함수"""
    print("🚀 LangGraph 시스템 테스트 시작")
    print("="*60)
    
    # 1. 시스템 정보 확인
    if not test_langgraph_info():
        print("❌ LangGraph 시스템 정보 확인 실패. 서버가 실행 중인지 확인해주세요.")
        return
    
    # 2. 개별 채팅 테스트
    test_cases = [
        "최신 개발 트렌드 알려줘",
        "연봉 4000만원의 월급은 얼마야?",
        "채용공고 작성해줘",
        "저장된 채용공고 보여줘",
        "안녕하세요"
    ]
    
    for test_input in test_cases:
        test_langgraph_chat(test_input)
        print("-" * 40)
    
    # 3. 시스템 비교 테스트
    test_comparison()
    
    print("\n🎉 LangGraph 시스템 테스트 완료!")

if __name__ == "__main__":
    main()
