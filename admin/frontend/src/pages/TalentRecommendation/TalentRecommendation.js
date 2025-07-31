import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  FiUsers, 
  FiEye, 
  FiMessageSquare, 
  FiDownload,
  FiFilter,
  FiSettings,
  FiUser,
  FiCode,
  FiGitBranch,
  FiMapPin,
  FiClock,
  FiCpu,
  FiTrendingUp,
  FiRefreshCw
} from 'react-icons/fi';
import { TalentService } from '../../services/TalentService';
import DetailModal, {
  DetailSection,
  SectionTitle,
  DetailGrid,
  DetailItem,
  DetailLabel,
  DetailValue,
  DetailText
} from '../../components/DetailModal/DetailModal';

// 새로운 3분할 레이아웃 컨테이너
const TalentContainer = styled.div`
  display: flex;
  height: calc(100vh - 120px);
  gap: 24px;
  padding: 24px;
`;

// 왼쪽 추천 조건 설정 패널
const ConditionPanel = styled.div`
  width: 300px;
  background: white;
  border-radius: var(--border-radius);
  padding: 24px;
  box-shadow: var(--shadow-light);
  border: 1px solid var(--border-color);
  overflow-y: auto;
`;

// 메인 컨텐츠 영역 (가운데+오른쪽)
const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

// 상단 정보 입력창 섹션
const InputSection = styled.div`
  background: white;
  border-radius: var(--border-radius);
  padding: 24px;
  box-shadow: var(--shadow-light);
  border: 1px solid var(--border-color);
`;

// 인재 목록 섹션
const TalentListSection = styled.div`
  flex: 1;
  background: white;
  border-radius: var(--border-radius);
  padding: 24px;
  box-shadow: var(--shadow-light);
  border: 1px solid var(--border-color);
  overflow-y: auto;
`;

const LocalSectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Button = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  
  &.primary {
    background: var(--primary-color);
    color: white;
  }
  
  &.secondary {
    background: white;
    color: var(--text-primary);
    border: 1px solid var(--border-color);
  }
  
  &.small {
    padding: 8px 16px;
    font-size: 12px;
  }
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-light);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

// 새로운 버튼 형태의 인재 목록
const TalentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TalentButton = styled(motion.button)`
  width: 100%;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 16px;
  text-align: left;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  &:hover {
    border-color: var(--primary-color);
    box-shadow: var(--shadow-light);
    transform: translateY(-1px);
  }
  
  &.selected {
    border-color: var(--primary-color);
    background: rgba(99, 102, 241, 0.05);
  }
`;

const TalentButtonContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
`;

const TalentName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
`;

const TalentBrief = styled.div`
  font-size: 14px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 16px;
`;

const AIMatchScore = styled.div`
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => {
    const score = props.score;
    if (score >= 95) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    if (score >= 90) return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    if (score >= 85) return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
    if (score >= 80) return 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
    if (score >= 75) return 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)';
    return 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
  }};
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 4px;
`;

// 조건 설정 패널 관련 스타일
const ConditionGroup = styled.div`
  margin-bottom: 24px;
`;

const ConditionLabel = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 14px;
  margin-bottom: 8px;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 14px;
  resize: vertical;
  min-height: 80px;
  margin-bottom: 8px;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 14px;
  margin-bottom: 8px;
  background: white;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CheckboxItem = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
  
  input[type="checkbox"] {
    margin: 0;
  }
`;

// 상세 정보 패널 스타일
const DetailPanel = styled(motion.div)`
  position: absolute;
  top: 0;
  right: 0;
  width: 400px;
  height: 100%;
  background: white;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-medium);
  border: 1px solid var(--border-color);
  padding: 24px;
  overflow-y: auto;
  z-index: 10;
`;

const ActionButton = styled.button`
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: white;
  cursor: pointer;
  font-size: 12px;
  transition: var(--transition);
  display: flex;
  align-items: center;
  gap: 4px;
  
  &:hover {
    background: var(--background-secondary);
    border-color: var(--primary-color);
  }
  
  &.primary {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
  }
`;

const TalentActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
`;

const SkillTag = styled.span`
  display: inline-block;
  padding: 4px 8px;
  background: var(--background-secondary);
  border-radius: 12px;
  font-size: 11px;
  color: var(--text-secondary);
  margin-right: 6px;
  margin-bottom: 6px;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  font-size: 14px;
  color: var(--text-secondary);
  
  svg {
    animation: spin 1s linear infinite;
    margin-right: 8px;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const AnalysisResult = styled.div`
  background: rgba(99, 102, 241, 0.05);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: var(--border-radius);
  padding: 16px;
  margin-top: 16px;
  
  h4 {
    color: var(--primary-color);
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 600;
  }
  
  p {
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: 8px;
  }
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
`;

const Tag = styled.span`
  padding: 4px 8px;
  background: var(--primary-color);
  color: white;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
`;

// AI 기반 매칭을 위한 공통 시스템/기술 스택 데이터베이스
const commonSystems = {
  frontend: ['React', 'Vue.js', 'Angular', 'JavaScript', 'TypeScript', 'HTML5', 'CSS3', 'SASS', 'Webpack', 'Responsive Design'],
  backend: ['Node.js', 'Spring Boot', 'Django', 'Express.js', 'FastAPI', 'REST API', 'GraphQL', 'Microservices'],
  database: ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Oracle', 'SQL Server', 'DynamoDB'],
  cloud: ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'GitLab CI/CD', 'Terraform'],
  tools: ['Git', 'GitHub', 'Jira', 'Confluence', 'Slack', 'Figma', 'Adobe XD'],
  languages: ['JavaScript', 'Python', 'Java', 'C#', 'Go', 'Rust', 'TypeScript', 'PHP'],
  mobile: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Ionic'],
  ai: ['TensorFlow', 'PyTorch', 'scikit-learn', 'Pandas', 'NumPy', 'OpenCV', 'NLP'],
  security: ['OAuth', 'JWT', 'SSL/TLS', 'HTTPS', 'Encryption', 'Penetration Testing'],
  testing: ['Jest', 'Cypress', 'Selenium', 'Unit Testing', 'Integration Testing', 'TDD', 'BDD']
};

// AI 기반 매칭 알고리즘
const calculateAIMatchScore = (talent, requirements = {}) => {
  let score = 50; // 기본 점수
  let matchedSystems = 0;
  let totalRequiredSystems = 0;

  // 공통 시스템 매치 계산
  Object.keys(commonSystems).forEach(category => {
    const categorySkills = commonSystems[category];
    const talentSkills = talent.skills || [];
    const requiredSkills = requirements[category] || [];
    
    // 카테고리별 매치 점수 계산
    const matchedInCategory = categorySkills.filter(skill => 
      talentSkills.some(talentSkill => 
        talentSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(talentSkill.toLowerCase())
      )
    ).length;
    
    matchedSystems += matchedInCategory;
    totalRequiredSystems += categorySkills.length;
  });

  // 매치율에 따른 점수 조정
  const matchRatio = totalRequiredSystems > 0 ? matchedSystems / totalRequiredSystems : 0;
  score += matchRatio * 45; // 최대 45점 추가

  // 경력에 따른 보너스
  const experienceYears = parseInt(talent.experience) || 0;
  if (experienceYears >= 5) score += 10;
  else if (experienceYears >= 3) score += 5;
  else if (experienceYears >= 1) score += 2;

  // 포트폴리오 점수 반영
  if (talent.portfolioScore) {
    score += (talent.portfolioScore - 70) * 0.2;
  }

  // 최근 활동 보너스
  const lastActive = new Date(talent.lastActive);
  const daysSinceActive = (new Date() - lastActive) / (1000 * 60 * 60 * 24);
  if (daysSinceActive <= 7) score += 5;
  else if (daysSinceActive <= 30) score += 2;

  return Math.min(Math.max(Math.round(score), 0), 100);
};

// AI 프로필 분석 함수
const analyzeUserProfile = (profileText) => {
  // 시뮬레이션된 AI 분석
  const keywords = profileText.toLowerCase().split(/\s+/);
  
  const personality = [];
  const abilities = [];
  const techKeywords = [];
  
  // 성격 분석
  if (keywords.some(k => ['creative', '창의', '혁신', 'innovative'].includes(k))) {
    personality.push('창의적');
  }
  if (keywords.some(k => ['team', '협업', 'collaboration', '팀워크'].includes(k))) {
    personality.push('협업 지향적');
  }
  if (keywords.some(k => ['leadership', '리더십', '관리', 'manage'].includes(k))) {
    personality.push('리더십');
  }
  if (keywords.some(k => ['detail', '세심', '꼼꼼', 'careful'].includes(k))) {
    personality.push('세심함');
  }

  // 능력 분석
  Object.keys(commonSystems).forEach(category => {
    const categorySkills = commonSystems[category];
    const matched = categorySkills.filter(skill => 
      keywords.some(k => k.includes(skill.toLowerCase()))
    );
    if (matched.length > 0) {
      abilities.push(category);
      techKeywords.push(...matched);
    }
  });

  return {
    personality,
    abilities,
    keywords: [...new Set(techKeywords)],
    analysisDate: new Date().toISOString()
  };
};

// 새로운 AI 기반 인재 데이터
const talents = [
  {
    id: 1,
    name: '김철수',
    position: '시니어 프론트엔드 개발자',
    experience: '5년',
    education: '컴퓨터공학과',
    location: '서울',
    skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Redux', 'GraphQL', 'Jest', 'AWS', 'Docker'],
    portfolio: 'https://github.com/kimcs',
    lastActive: '2024-01-15',
    portfolioScore: 92,
    interviewScore: 88,
    aiProfile: {
      personality: ['창의적', '협업 지향적'],
      abilities: ['frontend', 'tools', 'cloud'],
      keywords: ['React', 'TypeScript', 'AWS', 'Docker']
    },
    profileText: '5년간 React 생태계에서 다양한 프로젝트를 수행해온 프론트엔드 개발자입니다. TypeScript와 Next.js를 활용한 모던 웹 개발에 전문성을 가지고 있으며, AWS 클라우드 환경에서의 배포 경험이 풍부합니다.',
    recommendationReason: 'React 생태계 전문성과 클라우드 경험이 뛰어나며, 현대적인 개발 스택에 능숙합니다.'
  },
  {
    id: 2,
    name: '이영희',
    position: '백엔드 아키텍트',
    experience: '7년',
    education: '소프트웨어공학과',
    location: '경기',
    skills: ['Node.js', 'Python', 'Django', 'PostgreSQL', 'Docker', 'Kubernetes', 'Redis', 'GraphQL', 'Microservices'],
    portfolio: 'https://github.com/leeyh',
    lastActive: '2024-01-14',
    portfolioScore: 89,
    interviewScore: 92,
    aiProfile: {
      personality: ['리더십', '세심함'],
      abilities: ['backend', 'database', 'cloud'],
      keywords: ['Node.js', 'Python', 'PostgreSQL', 'Kubernetes']
    },
    profileText: '대규모 시스템 설계와 마이크로서비스 아키텍처 구축 경험이 있는 백엔드 전문가입니다. 성능 최적화와 확장성 있는 시스템 구축에 전문성을 가지고 있습니다.',
    recommendationReason: '시스템 아키텍처 설계 능력이 뛰어나고, 대용량 트래픽 처리 경험이 풍부합니다.'
  },
  {
    id: 3,
    name: '박민수',
    position: 'UI/UX 디자이너',
    experience: '4년',
    education: '디자인학과',
    location: '서울',
    skills: ['Figma', 'Adobe XD', 'Sketch', 'InVision', 'Principle', 'HTML5', 'CSS3', 'JavaScript', 'React'],
    portfolio: 'https://behance.net/parkms',
    lastActive: '2024-01-13',
    portfolioScore: 85,
    interviewScore: 78,
    aiProfile: {
      personality: ['창의적', '세심함'],
      abilities: ['frontend', 'tools'],
      keywords: ['Figma', 'React', 'JavaScript', 'CSS3']
    },
    profileText: '사용자 중심의 디자인과 프론트엔드 개발 지식을 모두 갖춘 UI/UX 디자이너입니다. 디자인 시스템 구축과 개발자와의 협업에 능숙합니다.',
    recommendationReason: '디자인과 개발 지식을 모두 갖춘 융합형 인재로, 개발팀과의 협업이 원활합니다.'
  },
  {
    id: 4,
    name: '정수진',
    position: '데이터 사이언티스트',
    experience: '6년',
    education: '통계학과',
    location: '부산',
    skills: ['Python', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'SQL', 'AWS', 'Docker', 'Kubernetes'],
    portfolio: 'https://github.com/jungsj',
    lastActive: '2024-01-12',
    portfolioScore: 94,
    interviewScore: 91,
    aiProfile: {
      personality: ['세심함', '리더십'],
      abilities: ['ai', 'cloud', 'database'],
      keywords: ['Python', 'TensorFlow', 'AWS', 'SQL']
    },
    profileText: 'ML/DL 모델 개발과 대용량 데이터 처리에 전문성을 가진 데이터 사이언티스트입니다. 클라우드 환경에서의 AI 서비스 구축 경험이 풍부합니다.',
    recommendationReason: 'AI/ML 전문 지식과 실무 경험이 뛰어나며, 클라우드 기반 AI 서비스 구축 능력이 우수합니다.'
  },
  {
    id: 5,
    name: '최하늘',
    position: '풀스택 개발자',
    experience: '3년',
    education: '컴퓨터공학과',
    location: '대구',
    skills: ['React', 'Node.js', 'Express.js', 'MongoDB', 'TypeScript', 'Docker', 'AWS', 'Git'],
    portfolio: 'https://github.com/choihn',
    lastActive: '2024-01-16',
    portfolioScore: 87,
    interviewScore: 85,
    aiProfile: {
      personality: ['협업 지향적', '창의적'],
      abilities: ['frontend', 'backend', 'database', 'cloud'],
      keywords: ['React', 'Node.js', 'MongoDB', 'AWS']
    },
    profileText: '프론트엔드와 백엔드를 모두 아우르는 풀스택 개발자로, 스타트업 환경에서 빠른 프로토타이핑과 MVP 개발 경험이 있습니다.',
    recommendationReason: '전체적인 개발 프로세스를 이해하고 있어 다양한 프로젝트에 유연하게 대응 가능합니다.'
  }
].map(talent => ({
  ...talent,
  aiMatchScore: calculateAIMatchScore(talent)
}));

const TalentRecommendation = () => {
  const [selectedTalent, setSelectedTalent] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userProfile, setUserProfile] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    position: '',
    experience: '',
    location: '',
    skills: []
  });
  const [talentsData, setTalentsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [originalTalents, setOriginalTalents] = useState([]);
  const [sortedTalents, setSortedTalents] = useState([]);

  // 초기 데이터 로드
  useEffect(() => {
    loadAllTalents();
  }, []);

  const loadAllTalents = async () => {
    try {
      setIsLoading(true);
      console.log('MongoDB에서 인재 데이터를 불러오는 중...');
      const apiTalents = await TalentService.getAllTalents();
      
      // API에서 데이터를 가져왔다면 사용
      if (apiTalents && apiTalents.length > 0) {
        console.log(`✅ MongoDB에서 ${apiTalents.length}명의 인재 데이터를 성공적으로 로드했습니다.`);
        setTalentsData(apiTalents);
        setOriginalTalents(apiTalents);
        setSortedTalents(apiTalents);
      } else {
        // API 데이터가 없으면 기본 데이터 사용
        console.log('⚠️ MongoDB에 데이터가 없어 기본 샘플 데이터를 사용합니다.');
        setTalentsData(talents);
        setOriginalTalents(talents);
        setSortedTalents(talents);
      }
    } catch (error) {
      console.error('❌ MongoDB 연결 실패:', error);
      console.log('🔄 기본 샘플 데이터로 전환합니다. Admin Backend 서버 상태를 확인해주세요.');
      // API 실패 시 기본 데이터 사용
      setTalentsData(talents);
      setOriginalTalents(talents);
      setSortedTalents(talents);
    } finally {
      setIsLoading(false);
    }
  };

  // AI 프로필 분석 실행
  const handleAnalyzeProfile = async () => {
    if (!userProfile.trim()) return;
    
    setIsAnalyzing(true);
    
    try {
      // AI 매칭 API 호출
      const matchedTalents = await TalentService.matchTalents(userProfile);
      
      // 분석 결과 설정
      const result = analyzeUserProfile(userProfile);
      setAnalysisResult(result);
      
      // 매칭된 인재로 목록 업데이트
      setSortedTalents(matchedTalents);
      
    } catch (error) {
      console.error('AI 분석 실패:', error);
      // 실패 시 로컬 분석 결과 사용
      const result = analyzeUserProfile(userProfile);
      setAnalysisResult(result);
      
      // 기존 방식으로 매칭 점수 계산
      const currentTalents = talentsData.length > 0 ? talentsData : talents;
      const updatedTalents = currentTalents.map(talent => ({
        ...talent,
        aiMatchScore: calculateAIMatchScore(talent, result)
      })).sort((a, b) => b.aiMatchScore - a.aiMatchScore);
      
      setSortedTalents(updatedTalents);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetToAllTalents = () => {
    const currentOriginalTalents = originalTalents.length > 0 ? originalTalents : talents;
    setSortedTalents(currentOriginalTalents);
    setAnalysisResult(null);
    setUserProfile('');
  };

  // 필터링된 인재 목록
  const filteredTalents = sortedTalents.filter(talent => {
    return (
      (!searchTerm || 
        talent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        talent.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        talent.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      ) &&
      (!filters.position || talent.position.includes(filters.position)) &&
      (!filters.experience || talent.experience === filters.experience) &&
      (!filters.location || talent.location === filters.location)
    );
  });

  return (
    <TalentContainer>
      {/* 왼쪽 추천 조건 설정 패널 */}
      <ConditionPanel>
        <LocalSectionTitle>
          <FiSettings />
          추천 조건 설정
        </LocalSectionTitle>
        
        <ConditionGroup>
          <ConditionLabel>직무 분야</ConditionLabel>
          <Select
            value={filters.position}
            onChange={(e) => setFilters({...filters, position: e.target.value})}
          >
            <option value="">전체</option>
            <option value="프론트엔드">프론트엔드</option>
            <option value="백엔드">백엔드</option>
            <option value="풀스택">풀스택</option>
            <option value="데이터">데이터</option>
            <option value="디자이너">디자이너</option>
          </Select>
        </ConditionGroup>

        <ConditionGroup>
          <ConditionLabel>경력 년수</ConditionLabel>
          <Select
            value={filters.experience}
            onChange={(e) => setFilters({...filters, experience: e.target.value})}
          >
            <option value="">전체</option>
            <option value="1년">1년</option>
            <option value="2년">2년</option>
            <option value="3년">3년</option>
            <option value="4년">4년</option>
            <option value="5년">5년</option>
            <option value="6년">6년</option>
            <option value="7년">7년 이상</option>
          </Select>
        </ConditionGroup>

        <ConditionGroup>
          <ConditionLabel>근무지</ConditionLabel>
          <Select
            value={filters.location}
            onChange={(e) => setFilters({...filters, location: e.target.value})}
          >
            <option value="">전체</option>
            <option value="서울">서울</option>
            <option value="경기">경기</option>
            <option value="부산">부산</option>
            <option value="대구">대구</option>
            <option value="인천">인천</option>
          </Select>
        </ConditionGroup>

        <ConditionGroup>
          <ConditionLabel>필수 기술</ConditionLabel>
          <CheckboxGroup>
            {['React', 'Node.js', 'Python', 'AWS', 'Docker', 'TypeScript'].map(skill => (
              <CheckboxItem key={skill}>
                <input
                  type="checkbox"
                  checked={filters.skills.includes(skill)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFilters({...filters, skills: [...filters.skills, skill]});
                    } else {
                      setFilters({...filters, skills: filters.skills.filter(s => s !== skill)});
                    }
                  }}
                />
                {skill}
              </CheckboxItem>
            ))}
          </CheckboxGroup>
        </ConditionGroup>

        <Button 
          className="primary"
          style={{ width: '100%', marginTop: '16px' }}
          onClick={() => {
            // 필터 적용 로직
            console.log('필터 적용:', filters);
          }}
        >
            <FiFilter />
          필터 적용
          </Button>
      </ConditionPanel>

      {/* 메인 컨텐츠 영역 */}
      <MainContent>
        {/* 상단 정보 입력창 섹션 */}
        <InputSection>
          <LocalSectionTitle>
            <FiCpu />
            AI 인재 매칭 시스템
          </LocalSectionTitle>
          
          <ConditionGroup>
            <ConditionLabel>프로필 정보 입력 (AI 분석용)</ConditionLabel>
            <TextArea
              value={userProfile}
              onChange={(e) => setUserProfile(e.target.value)}
              placeholder="회사 정보, 프로젝트 내용, 필요한 기술 스택, 업무 환경 등을 자유롭게 입력해주세요. AI가 분석하여 최적의 인재를 추천해드립니다."
              rows={4}
            />
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Button 
                className="primary"
                onClick={handleAnalyzeProfile}
                disabled={isAnalyzing || !userProfile.trim()}
              >
                {isAnalyzing ? <FiRefreshCw /> : <FiCpu />}
                {isAnalyzing ? 'AI 분석 중...' : 'AI 분석 시작'}
          </Button>
          <Button onClick={resetToAllTalents} style={{ backgroundColor: '#6c757d' }}>
            <FiUsers />
            전체 인재 보기
          </Button>

              <Input
          type="text"
                placeholder="이름, 직무, 기술로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ margin: 0, flex: 1 }}
              />
            </div>
          </ConditionGroup>

          {isAnalyzing && (
            <LoadingSpinner>
              <FiRefreshCw />
              프로필을 AI로 분석하고 최적의 인재를 찾고 있습니다...
            </LoadingSpinner>
          )}

          {analysisResult && (
            <AnalysisResult>
              <h4>AI 분석 결과</h4>
              <p><strong>성격 특성:</strong></p>
              <TagList>
                {analysisResult.personality.map((trait, index) => (
                  <Tag key={index}>{trait}</Tag>
                ))}
              </TagList>
              <p><strong>기술 분야:</strong></p>
              <TagList>
                {analysisResult.abilities.map((ability, index) => (
                  <Tag key={index}>{ability}</Tag>
                ))}
              </TagList>
              <p><strong>핵심 키워드:</strong></p>
              <TagList>
                {analysisResult.keywords.slice(0, 8).map((keyword, index) => (
                  <Tag key={index}>{keyword}</Tag>
                ))}
              </TagList>
            </AnalysisResult>
          )}
        </InputSection>

        {/* 인재 목록 섹션 */}
        <TalentListSection style={{ position: 'relative' }}>
          <LocalSectionTitle>
            <FiUsers />
            {analysisResult ? 'AI 매칭 인재 목록' : '전체 인재 목록'} ({filteredTalents.length}명)
            {analysisResult && (
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                - AI 매칭 점수 기준 정렬
              </span>
            )}
          </LocalSectionTitle>

          <TalentList>
            {isLoading ? (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '60px 20px',
                color: '#666'
              }}>
                <FiRefreshCw style={{ fontSize: '24px', marginBottom: '12px', animation: 'spin 1s linear infinite' }} />
                <span>인재 목록을 불러오는 중...</span>
              </div>
            ) : filteredTalents.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px 20px', 
                color: '#666', 
                fontSize: '16px'
              }}>
                {analysisResult ? 'AI 매칭 조건에 맞는 인재가 없습니다.' : '등록된 인재가 없습니다.'}
              </div>
            ) : (
              filteredTalents.map((talent, index) => (
              <TalentButton
                key={talent.id}
                className={selectedTalent?.id === talent.id ? 'selected' : ''}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => {
                setSelectedTalent(talent);
                setIsDetailModalOpen(true);
                }}
              >
                <TalentButtonContent>
                  <TalentName>{talent.name}</TalentName>
                  <TalentBrief>
                    <span><FiUser /> {talent.position}</span>
                    <span><FiClock /> {talent.experience}</span>
                    <span><FiMapPin /> {talent.location}</span>
                    <span><FiCode /> {talent.skills.slice(0, 3).join(', ')}</span>
                  </TalentBrief>
                </TalentButtonContent>
                <AIMatchScore score={talent.matchRate || talent.aiMatchScore || 70}>
                  <FiTrendingUp />
                  {talent.matchRate || talent.aiMatchScore || 70}% AI 매치
                </AIMatchScore>
              </TalentButton>
              ))
            )}
          </TalentList>

          {filteredTalents.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: 'var(--text-secondary)' 
            }}>
              검색 조건에 맞는 인재가 없습니다.
            </div>
          )}
        </TalentListSection>
      </MainContent>

      {/* 인재 상세보기 모달 */}
      <DetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedTalent(null);
        }}
        title={selectedTalent ? `${selectedTalent.name} 인재 상세` : ''}
        onEdit={() => {
          console.log('인재 정보 수정:', selectedTalent);
        }}
        onDelete={() => {
          console.log('인재 정보 삭제:', selectedTalent);
        }}
      >
        {selectedTalent && (
          <>
            <DetailSection>
              <SectionTitle>AI 매칭 정보</SectionTitle>
              <DetailGrid>
                <DetailItem>
                  <DetailLabel>AI 매칭 점수</DetailLabel>
                  <DetailValue>
                    <AIMatchScore score={selectedTalent.aiMatchScore} style={{ margin: 0 }}>
                      {selectedTalent.aiMatchScore}%
                    </AIMatchScore>
                  </DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>성격 특성</DetailLabel>
                  <DetailValue>
                    {selectedTalent.aiProfile.personality.join(', ')}
                  </DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>전문 분야</DetailLabel>
                  <DetailValue>
                    {selectedTalent.aiProfile.abilities.join(', ')}
                  </DetailValue>
                </DetailItem>
              </DetailGrid>
            </DetailSection>

            <DetailSection>
              <SectionTitle>기본 정보</SectionTitle>
              <DetailGrid>
                <DetailItem>
                  <DetailLabel>이름</DetailLabel>
                  <DetailValue>{selectedTalent.name}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>직무</DetailLabel>
                  <DetailValue>{selectedTalent.position}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>경력</DetailLabel>
                  <DetailValue>{selectedTalent.experience}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>학력</DetailLabel>
                  <DetailValue>{selectedTalent.education}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>지역</DetailLabel>
                  <DetailValue>{selectedTalent.location}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>포트폴리오</DetailLabel>
                  <DetailValue>
                    <a href={selectedTalent.portfolio} target="_blank" rel="noopener noreferrer">
                      {selectedTalent.portfolio}
                    </a>
                  </DetailValue>
                </DetailItem>
              </DetailGrid>
            </DetailSection>

            <DetailSection>
              <SectionTitle>기술 스택</SectionTitle>
              <DetailText>
                {selectedTalent.skills.map((skill, index) => (
                  <SkillTag key={index}>{skill}</SkillTag>
                ))}
              </DetailText>
            </DetailSection>

            <DetailSection>
              <SectionTitle>프로필 소개</SectionTitle>
              <DetailText>{selectedTalent.profileText}</DetailText>
            </DetailSection>

            <DetailSection>
              <SectionTitle>추천 이유</SectionTitle>
              <DetailText>{selectedTalent.recommendationReason}</DetailText>
            </DetailSection>

            <TalentActions>
              <ActionButton className="primary">
                <FiMessageSquare />
                연락하기
              </ActionButton>
              <ActionButton>
                <FiDownload />
                이력서 다운로드
              </ActionButton>
              <ActionButton>
                <FiGitBranch />
                포트폴리오 보기
              </ActionButton>
            </TalentActions>
          </>
        )}
      </DetailModal>
    </TalentContainer>
  );
};

export default TalentRecommendation; 