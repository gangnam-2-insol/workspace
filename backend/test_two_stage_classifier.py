"""
2단계 분류 시스템 테스트
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from chatbot.core.two_stage_classifier import two_stage_classifier

def test_two_stage_classifier():
    """2단계 분류 시스템 테스트"""
    
    # 테스트 케이스들
    test_cases = [
        {
            "name": "명확한 채용공고 (1차에서 확정)",
            "text": "프론트엔드 개발자를 모집합니다. React와 TypeScript 경험이 2년 이상인 분을 우대합니다. 이력서와 자기소개서를 제출해주세요. 연봉은 3000만원부터 시작합니다."
        },
        {
            "name": "애매한 채용공고 (2차 필요)",
            "text": "프론트엔드 개발자 모집 공고입니다. React와 Typescript를 활용한 웹 애플리케이션 개발 경험이 2년 이상인 분을 우대하며, 사용자 경험(UX) 개선에 관심이 많고 세심한 UI 구현 능력을 갖춘 분을 찾고 있습니다. 애자일(Agile) 개발 환경에 적응력이 좋고, 팀 내 협업 및 코드 리뷰에 적극적으로 참여할 수 있는 분이면 더욱 좋습니다. 자바스크립트 라이브러리 및 최신 트렌드에 대한 이해도가 높은 지원자를 환영합니다."
        },
        {
            "name": "일반 대화",
            "text": "안녕하세요! 오늘 날씨가 정말 좋네요. 뭐하고 계세요?"
        },
        {
            "name": "기술 질문",
            "text": "React와 Vue 중에서 어떤 것이 더 좋을까요? 각각의 장단점을 알려주세요."
        },
        {
            "name": "간단한 채용 문의",
            "text": "개발자 연봉이 얼마나 되나요?"
        }
    ]
    
    print("🚀 2단계 분류 시스템 테스트 시작\n")
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"📋 테스트 케이스 {i}: {test_case['name']}")
        print(f"📝 입력 텍스트: {test_case['text']}")
        print("-" * 80)
        
        # 2단계 분류 실행
        result = two_stage_classifier.classify_text(test_case['text'])
        
        print(f"✅ 분류 결과:")
        print(f"   채용공고 여부: {result['is_recruitment']}")
        print(f"   신뢰도: {result['confidence']:.2f}")
        print(f"   사용된 단계: {result['stage']}")
        print(f"   1차 점수: {result.get('first_stage_score', 'N/A')}")
        
        if result['fields']:
            print(f"   추출된 필드:")
            for key, value in result['fields'].items():
                print(f"     {key}: {value}")
        
        print("=" * 80)
        print()

if __name__ == "__main__":
    test_two_stage_classifier()
