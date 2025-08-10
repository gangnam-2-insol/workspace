#!/usr/bin/env python3
"""
LangGraph 테스트 스크립트
"""

import sys
import os

def test_langgraph_import():
    """LangGraph 모듈들이 제대로 import되는지 테스트"""
    try:
        print("🔍 LangGraph 모듈 import 테스트 중...")
        
        # 기본 langgraph import 테스트
        import langgraph
        print(f"✅ langgraph import 성공")
        
        # langgraph.graph import 테스트
        from langgraph.graph import StateGraph, END
        print("✅ langgraph.graph import 성공")
        
        # langgraph.checkpoint import 테스트
        from langgraph.checkpoint.memory import MemorySaver
        print("✅ langgraph.checkpoint import 성공")
        
        # langgraph.prebuilt import 테스트
        from langgraph.prebuilt import ToolNode
        print("✅ langgraph.prebuilt import 성공")
        
        return True
        
    except ImportError as e:
        print(f"❌ LangGraph import 실패: {e}")
        return False
    except Exception as e:
        print(f"❌ 예상치 못한 오류: {e}")
        return False

def test_simple_graph():
    """간단한 LangGraph 워크플로우 테스트"""
    try:
        print("\n🔍 간단한 LangGraph 워크플로우 테스트 중...")
        
        from langgraph.graph import StateGraph, END
        from typing import TypedDict, Annotated
        
        # 상태 정의
        class State(TypedDict):
            messages: list
            count: int
        
        # 노드 함수들
        def start(state: State) -> State:
            print("🚀 시작 노드 실행")
            return {"messages": ["안녕하세요!"], "count": 1}
        
        def process(state: State) -> State:
            print("⚙️ 처리 노드 실행")
            messages = state["messages"] + [f"처리 완료! 카운트: {state['count']}"]
            return {"messages": messages, "count": state["count"] + 1}
        
        def end(state: State) -> State:
            print("🏁 종료 노드 실행")
            messages = state["messages"] + ["테스트 완료!"]
            return {"messages": messages, "count": state["count"]}
        
        # 그래프 생성
        workflow = StateGraph(State)
        
        # 노드 추가
        workflow.add_node("start", start)
        workflow.add_node("process", process)
        workflow.add_node("end", end)
        
        # 엣지 추가
        workflow.set_entry_point("start")
        workflow.add_edge("start", "process")
        workflow.add_edge("process", "end")
        workflow.add_edge("end", END)
        
        # 그래프 컴파일
        app = workflow.compile()
        
        # 실행
        result = app.invoke({"messages": [], "count": 0})
        
        print("✅ LangGraph 워크플로우 실행 성공!")
        print(f"📊 결과: {result}")
        
        return True
        
    except Exception as e:
        print(f"❌ LangGraph 워크플로우 테스트 실패: {e}")
        return False

def test_agent_system():
    """기존 agent_system.py의 LangGraph 기능 테스트"""
    try:
        print("\n🔍 Agent System LangGraph 테스트 중...")
        
        # langgraph_agent_system.py에서 필요한 함수들 import
        from langgraph_agent_system import create_langgraph_workflow, AgentState
        
        # 워크플로우 생성
        workflow = create_langgraph_workflow()
        
        # 초기 상태
        initial_state = AgentState(
            user_input="안녕하세요",
            conversation_history=[],
            intent="",
            tool_result="",
            final_response="",
            error="",
            current_node="",
            next_node="",
            metadata={}
        )
        
        # 실행
        result = workflow.invoke(initial_state)
        
        print("✅ Agent System LangGraph 테스트 성공!")
        print(f"📊 결과: {result}")
        
        return True
        
    except Exception as e:
        print(f"❌ Agent System LangGraph 테스트 실패: {e}")
        return False

def main():
    """메인 테스트 함수"""
    print("🧪 LangGraph 테스트 시작\n")
    
    # 1. Import 테스트
    import_success = test_langgraph_import()
    
    # 2. 간단한 그래프 테스트
    graph_success = test_simple_graph()
    
    # 3. Agent System 테스트
    agent_success = test_agent_system()
    
    # 결과 요약
    print("\n" + "="*50)
    print("📋 LangGraph 테스트 결과 요약")
    print("="*50)
    print(f"Import 테스트: {'✅ 성공' if import_success else '❌ 실패'}")
    print(f"간단한 그래프 테스트: {'✅ 성공' if graph_success else '❌ 실패'}")
    print(f"Agent System 테스트: {'✅ 성공' if agent_success else '❌ 실패'}")
    
    if all([import_success, graph_success, agent_success]):
        print("\n🎉 모든 LangGraph 테스트가 성공했습니다!")
        return True
    else:
        print("\n⚠️ 일부 테스트가 실패했습니다.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
