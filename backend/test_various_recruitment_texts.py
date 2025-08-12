#!/usr/bin/env python3
"""
다양한 채용공고 문장 테스트 스크립트
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from chatbot.core.context_classifier import classify_context, is_recruitment_text

def generate_test_cases():
    """다양한 채용공고 문장 생성"""
    
    test_cases = [
        # 1. 개발자 채용공고 (원본과 유사)
        {
            "text": "저희 팀은 원활한 협업과 소통을 중시하는 환경에서, 문제 해결에 능한 개발자를 찾고 있습니다. 다양한 프로젝트 경험과 함께, 코드 품질을 유지하고 개선하는 데 관심이 많은 분을 우대합니다. 개발 과정에서 발생하는 이슈에 대해 능동적으로 대응하며, 새로운 기술 도입에도 적극적인 태도를 가진 분이면 좋겠습니다. 협업툴 및 버전관리 시스템(Git) 사용 경험은 필수이며, 팀워크를 중요시하는 분들의 많은 지원 바랍니다.",
            "expected": True,
            "description": "개발자 채용공고 (원본)"
        },
        
        # 2. 디자이너 채용공고
        {
            "text": "창의적이고 혁신적인 디자인 솔루션을 제공할 수 있는 UI/UX 디자이너를 모집합니다. 사용자 중심의 디자인 사고와 함께, 다양한 디자인 툴(Figma, Sketch, Adobe Creative Suite) 활용 능력을 갖춘 분을 찾고 있습니다. 프로젝트 기획부터 완성까지 전 과정에 참여하며, 사용자 피드백을 반영한 개선 작업을 수행합니다. 디자인 시스템 구축 경험이 있으시면 우대하며, 팀과의 원활한 소통이 가능한 분들의 지원을 기다립니다.",
            "expected": True,
            "description": "UI/UX 디자이너 채용공고"
        },
        
        # 3. 마케터 채용공고
        {
            "text": "디지털 마케팅 전략을 수립하고 실행할 수 있는 마케팅 전문가를 찾고 있습니다. 온라인 광고, SNS 마케팅, 콘텐츠 마케팅 등 다양한 채널을 활용한 통합 마케팅 캠페인 경험이 있는 분을 우대합니다. 데이터 분석을 통한 마케팅 성과 측정 및 최적화 능력이 필요하며, 시장 트렌드를 파악하고 새로운 마케팅 기법을 도입하는 데 관심이 많은 분이면 좋겠습니다. Google Analytics, Facebook Ads 등 마케팅 툴 활용 경험이 필수입니다.",
            "expected": True,
            "description": "디지털 마케터 채용공고"
        },
        
        # 4. 기획자 채용공고
        {
            "text": "사용자 경험을 중심으로 한 서비스 기획 및 제품 기획을 담당할 PM(Product Manager)을 모집합니다. 시장 조사, 사용자 리서치, 경쟁사 분석을 통한 서비스 기획 능력과 함께, 개발팀과의 원활한 협업을 통해 아이디어를 실제 서비스로 구현하는 경험이 있는 분을 찾고 있습니다. 데이터 기반의 의사결정과 A/B 테스트 설계 및 분석 능력이 필요하며, 사용자 피드백을 수집하고 반영하는 프로세스 관리 경험이 있으시면 우대합니다.",
            "expected": True,
            "description": "PM(Product Manager) 채용공고"
        },
        
        # 5. 운영자 채용공고
        {
            "text": "서비스 운영 및 고객 지원을 담당할 운영 전문가를 찾고 있습니다. 고객 문의 응대, 서비스 모니터링, 운영 데이터 분석을 통한 서비스 개선 제안 능력이 필요합니다. 고객 만족도 향상을 위한 프로세스 개선 및 매뉴얼 작성 경험이 있으시면 우대하며, 다양한 고객층과의 소통 능력과 문제 해결 능력을 갖춘 분이면 좋겠습니다. CRM 시스템 활용 경험과 고객 데이터 분석 능력이 필수입니다.",
            "expected": True,
            "description": "서비스 운영자 채용공고"
        },
        
        # 6. 데이터 분석가 채용공고
        {
            "text": "빅데이터 분석 및 인사이트 도출을 담당할 데이터 분석가를 모집합니다. SQL, Python, R 등을 활용한 데이터 분석 및 시각화 능력과 함께, 머신러닝 기법을 활용한 예측 모델링 경험이 있는 분을 찾고 있습니다. 비즈니스 문제를 데이터 기반으로 해결하는 능력과 함께, 분석 결과를 비즈니스 담당자에게 명확하게 전달할 수 있는 커뮤니케이션 능력이 필요합니다. Tableau, Power BI 등 데이터 시각화 툴 활용 경험이 우대됩니다.",
            "expected": True,
            "description": "데이터 분석가 채용공고"
        },
        
        # 7. 보안 전문가 채용공고
        {
            "text": "정보보안 및 사이버 보안을 담당할 보안 전문가를 찾고 있습니다. 네트워크 보안, 애플리케이션 보안, 인프라 보안 등 다양한 영역의 보안 위험을 식별하고 대응할 수 있는 능력이 필요합니다. 보안 취약점 분석 및 침입 탐지 시스템 운영 경험이 있으시면 우대하며, 보안 정책 수립 및 보안 교육 진행 경험이 있는 분이면 좋겠습니다. CISSP, CEH 등 보안 관련 자격증 보유자 및 보안 사고 대응 경험이 필수입니다.",
            "expected": True,
            "description": "보안 전문가 채용공고"
        },
        
        # 8. 영업 담당자 채용공고
        {
            "text": "기업 고객 대상 영업 및 파트너십 구축을 담당할 영업 전문가를 모집합니다. B2B 영업 경험과 함께, 고객 니즈 분석을 통한 맞춤형 솔루션 제안 능력이 있는 분을 찾고 있습니다. 영업 파이프라인 관리 및 계약 협상 경험이 필요하며, 고객과의 장기적인 관계 구축을 통한 재계약 및 업셀링 능력이 있으시면 우대합니다. CRM 시스템 활용 경험과 영업 성과 분석 능력이 필수이며, 팀워크를 중시하는 분들의 지원을 기다립니다.",
            "expected": True,
            "description": "B2B 영업 담당자 채용공고"
        },
        
        # 9. 인사 담당자 채용공고
        {
            "text": "인사 관리 및 조직 문화 구축을 담당할 인사 전문가를 찾고 있습니다. 채용, 교육, 성과 관리, 보상 등 전반적인 인사 업무 경험과 함께, 조직 문화 개선 및 직원 만족도 향상을 위한 프로그램 기획 및 운영 능력이 필요합니다. 인사 관련 법규에 대한 이해와 함께, 다양한 세대와 배경을 가진 직원들과의 소통 능력을 갖춘 분이면 좋겠습니다. HRIS 시스템 활용 경험과 인사 데이터 분석 능력이 우대됩니다.",
            "expected": True,
            "description": "인사 담당자 채용공고"
        },
        
        # 10. 품질 관리자 채용공고
        {
            "text": "제품 및 서비스 품질 관리를 담당할 QA(Quality Assurance) 전문가를 모집합니다. 소프트웨어 테스트 계획 수립 및 실행, 버그 관리, 품질 메트릭 분석 능력과 함께, 자동화 테스트 도구 활용 경험이 있는 분을 찾고 있습니다. 개발팀과의 협업을 통한 품질 향상 프로세스 개선 능력이 필요하며, 사용자 관점에서의 테스트 시나리오 작성 및 실행 경험이 있으시면 우대합니다. Selenium, JUnit 등 테스트 도구 활용 능력이 필수입니다.",
            "expected": True,
            "description": "QA 전문가 채용공고"
        }
    ]
    
    return test_cases

def test_recruitment_texts():
    """채용공고 문장들 테스트"""
    
    test_cases = generate_test_cases()
    
    print("🧪 다양한 채용공고 문장 테스트 시작\n")
    
    correct_count = 0
    total_count = len(test_cases)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"📝 테스트 {i}: {test_case['description']}")
        print(f"입력: {test_case['text'][:100]}{'...' if len(test_case['text']) > 100 else ''}")
        
        # 맥락 분류 실행
        result = classify_context(test_case['text'])
        
        print(f"결과: 점수 {result.total_score:.2f}, 채용: {result.is_recruitment}, 신뢰도: {result.confidence:.2f}")
        
        # 카테고리별 점수 요약
        category_summary = {}
        for category, score in result.category_scores.items():
            if score > 0:
                category_summary[category] = score
        
        print(f"주요 카테고리: {category_summary}")
        
        # 예상 결과와 비교
        is_correct = result.is_recruitment == test_case['expected']
        if is_correct:
            correct_count += 1
            print("✅ 정확")
        else:
            print(f"❌ 오류 (예상: {test_case['expected']}, 실제: {result.is_recruitment})")
        
        print("-" * 80)
    
    # 최종 결과
    accuracy = (correct_count / total_count) * 100
    print(f"\n🎯 테스트 결과: {correct_count}/{total_count} 정확 ({accuracy:.1f}%)")
    
    if accuracy >= 90:
        print("✅ 맥락 분류기가 매우 정확하게 작동합니다!")
    elif accuracy >= 80:
        print("✅ 맥락 분류기가 정상적으로 작동합니다!")
    else:
        print("⚠️ 맥락 분류기 성능 개선이 필요합니다.")

def analyze_detailed_results():
    """상세 분석"""
    test_cases = generate_test_cases()
    
    print("\n🔍 상세 분석 결과\n")
    
    # 카테고리별 평균 점수
    category_totals = {}
    category_counts = {}
    
    for test_case in test_cases:
        result = classify_context(test_case['text'])
        
        for category, score in result.category_scores.items():
            if category not in category_totals:
                category_totals[category] = 0
                category_counts[category] = 0
            
            if score > 0:
                category_totals[category] += score
                category_counts[category] += 1
    
    print("📊 카테고리별 평균 점수:")
    for category in category_totals:
        if category_counts[category] > 0:
            avg_score = category_totals[category] / category_counts[category]
            print(f"  - {category}: {avg_score:.2f}점 (활성화: {category_counts[category]}/{len(test_cases)})")
    
    # 점수 분포 분석
    score_ranges = {
        "높음 (10점 이상)": 0,
        "중간 (5-10점)": 0,
        "낮음 (5점 미만)": 0
    }
    
    for test_case in test_cases:
        result = classify_context(test_case['text'])
        
        if result.total_score >= 10:
            score_ranges["높음 (10점 이상)"] += 1
        elif result.total_score >= 5:
            score_ranges["중간 (5-10점)"] += 1
        else:
            score_ranges["낮음 (5점 미만)"] += 1
    
    print(f"\n📈 점수 분포:")
    for range_name, count in score_ranges.items():
        percentage = (count / len(test_cases)) * 100
        print(f"  - {range_name}: {count}개 ({percentage:.1f}%)")

if __name__ == "__main__":
    print("🚀 다양한 채용공고 문장 테스트 시작\n")
    
    # 기본 테스트
    test_recruitment_texts()
    
    # 상세 분석
    analyze_detailed_results()
