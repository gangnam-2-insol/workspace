import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faStar, 
  faMapMarkerAlt, 
  faBriefcase,
  faCheckCircle,
  faEye,
  faDownload,
  faEnvelope,
  faCog,
  faDesktop,
  faChartLine,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import './Recommendations.css';
import { TalentService } from '../services/TalentService';

// 인재 데이터 타입
interface Talent {
  id: number;
  name: string;
  position: string;
  experience: string;
  location: string;
  skills: string[];
  matchRate: number;
  avatar: string;
  description: string;
  rating: number;
  portfolioScore: number;
  profileText: string;
  recommendationReason: string;
}

// 확장된 인재 데이터 (30개) - 초기 데이터
const initialTalents: Talent[] = [
  {
    id: 1, name: '김개발', position: '시니어 프론트엔드 개발자', experience: '5년', location: '서울 강남구',
    skills: ['React', 'TypeScript', 'Next.js', 'Styled-Components'], matchRate: 96, 
    avatar: 'https://via.placeholder.com/60', rating: 4.8, portfolioScore: 92,
    description: '사용자 경험을 최우선으로 생각하는 프론트엔드 개발자입니다.',
    profileText: '사용자 경험을 최우선으로 생각하는 프론트엔드 개발자입니다. React와 TypeScript를 활용한 웹 애플리케이션 개발에 전문성을 가지고 있으며, 성능 최적화와 접근성을 중시합니다.',
    recommendationReason: 'React 전문성과 TypeScript 숙련도가 뛰어나며, 팀 프로젝트 경험이 풍부합니다.'
  },
  {
    id: 2, name: '이백엔드', position: '백엔드 개발자', experience: '4년', location: '서울 서초구',
    skills: ['Java', 'Spring Boot', 'MySQL', 'AWS'], matchRate: 92,
    avatar: 'https://via.placeholder.com/60', rating: 4.9, portfolioScore: 88,
    description: '확장 가능한 서버 아키텍처 설계와 구현에 전문성을 가진 개발자입니다.',
    profileText: '확장 가능한 서버 아키텍처 설계와 구현에 전문성을 가진 백엔드 개발자입니다. 대용량 트래픽 처리와 데이터베이스 최적화 경험이 풍부합니다.',
    recommendationReason: '대규모 서비스 개발 경험과 성능 최적화 역량이 우수합니다.'
  },
  {
    id: 3, name: '박디자인', position: 'UI/UX 디자이너', experience: '3년', location: '서울 마포구',
    skills: ['Figma', 'Adobe XD', 'Sketch', 'Principle'], matchRate: 88,
    avatar: 'https://via.placeholder.com/60', rating: 4.7, portfolioScore: 90,
    description: '사용자 중심의 디자인 사고를 바탕으로 직관적인 인터페이스를 설계합니다.',
    profileText: '사용자 중심의 디자인 사고를 바탕으로 직관적이고 매력적인 인터페이스를 설계합니다. 프로토타이핑과 사용성 테스트에 특히 강점을 가지고 있습니다.',
    recommendationReason: '사용자 경험 설계 능력이 뛰어나고 프로토타이핑 스킬이 우수합니다.'
  },
  {
    id: 4, name: '최데이터', position: '데이터 분석가', experience: '6년', location: '서울 영등포구',
    skills: ['Python', 'R', 'SQL', 'Tableau'], matchRate: 90,
    avatar: 'https://via.placeholder.com/60', rating: 4.8, portfolioScore: 94,
    description: '빅데이터 분석과 머신러닝을 활용한 비즈니스 인사이트 도출 전문가입니다.',
    profileText: '빅데이터 분석과 머신러닝을 활용한 비즈니스 인사이트 도출에 전문성을 가지고 있습니다. 통계적 분석과 예측 모델링에 강점을 보입니다.',
    recommendationReason: '고급 데이터 분석 기술과 비즈니스 이해도가 매우 높습니다.'
  },
  {
    id: 5, name: '정풀스택', position: '풀스택 개발자', experience: '7년', location: '서울 송파구',
    skills: ['React', 'Node.js', 'MongoDB', 'Express'], matchRate: 94,
    avatar: 'https://via.placeholder.com/60', rating: 4.9, portfolioScore: 96,
    description: '프론트엔드부터 백엔드까지 전체 스택을 아우르는 개발자입니다.',
    profileText: '프론트엔드부터 백엔드까지 전체 스택을 아우르는 개발자입니다. 실시간 웹 애플리케이션과 API 설계에 특히 뛰어난 역량을 보입니다.',
    recommendationReason: '전체 스택 개발 능력과 실시간 시스템 구축 경험이 풍부합니다.'
  },
  {
    id: 6, name: '강모바일', position: '모바일 개발자', experience: '4년', location: '서울 강서구',
    skills: ['React Native', 'Flutter', 'Swift', 'Kotlin'], matchRate: 87,
    avatar: 'https://via.placeholder.com/60', rating: 4.6, portfolioScore: 89,
    description: '크로스플랫폼 모바일 앱 개발에 전문성을 가진 개발자입니다.',
    profileText: '크로스플랫폼 모바일 앱 개발에 전문성을 가진 개발자입니다. 네이티브와 하이브리드 앱 모두에 경험이 있으며, 성능 최적화에 능숙합니다.',
    recommendationReason: '모바일 앱 개발 전문성과 크로스플랫폼 경험이 우수합니다.'
  },
  {
    id: 7, name: '윤클라우드', position: 'DevOps 엔지니어', experience: '5년', location: '서울 용산구',
    skills: ['AWS', 'Docker', 'Kubernetes', 'Jenkins'], matchRate: 91,
    avatar: 'https://via.placeholder.com/60', rating: 4.8, portfolioScore: 93,
    description: '클라우드 인프라 구축과 자동화에 전문성을 가진 엔지니어입니다.',
    profileText: '클라우드 인프라 구축과 자동화에 전문성을 가진 DevOps 엔지니어입니다. CI/CD 파이프라인 구성과 모니터링 시스템 운영에 능숙합니다.',
    recommendationReason: '클라우드 인프라 운영과 자동화 기술이 매우 뛰어납니다.'
  },
  {
    id: 8, name: '임프로덕트', position: '프로덕트 매니저', experience: '6년', location: '서울 강남구',
    skills: ['Product Strategy', 'User Research', 'A/B Testing', 'Jira'], matchRate: 89,
    avatar: 'https://via.placeholder.com/60', rating: 4.7, portfolioScore: 91,
    description: '데이터 기반의 프로덕트 전략 수립과 실행 전문가입니다.',
    profileText: '데이터 기반의 프로덕트 전략 수립과 실행에 전문성을 가진 프로덕트 매니저입니다. 사용자 리서치와 시장 분석을 통한 제품 개선에 강점을 보입니다.',
    recommendationReason: '프로덕트 전략 수립과 데이터 분석 능력이 우수합니다.'
  },
  {
    id: 9, name: '한보안', position: '보안 엔지니어', experience: '8년', location: '서울 서초구',
    skills: ['Network Security', 'Penetration Testing', 'CISSP'], matchRate: 93,
    avatar: 'https://via.placeholder.com/60', rating: 4.9, portfolioScore: 95,
    description: '네트워크 보안과 침투 테스트 전문가입니다.',
    profileText: '네트워크 보안과 침투 테스트 전문가입니다. 보안 취약점 분석과 대응 시스템 구축에 풍부한 경험을 가지고 있습니다.',
    recommendationReason: '고급 보안 기술과 침투 테스트 경험이 매우 풍부합니다.'
  },
  {
    id: 10, name: '조게임', position: '게임 개발자', experience: '4년', location: '경기 성남시',
    skills: ['Unity', 'C#', 'Blender', 'Maya'], matchRate: 85,
    avatar: 'https://via.placeholder.com/60', rating: 4.5, portfolioScore: 87,
    description: 'Unity를 활용한 모바일 게임 개발 전문가입니다.',
    profileText: 'Unity를 활용한 모바일 게임 개발에 전문성을 가진 개발자입니다. 3D 그래픽스와 실시간 멀티플레이어 게임 구현에 경험이 있습니다.',
    recommendationReason: '게임 개발 전문성과 3D 그래픽스 기술이 뛰어납니다.'
  },
  {
    id: 11, name: '신AI', position: 'AI 엔지니어', experience: '3년', location: '서울 강남구',
    skills: ['Python', 'TensorFlow', 'PyTorch', 'OpenCV'], matchRate: 95,
    avatar: 'https://via.placeholder.com/60', rating: 4.8, portfolioScore: 92,
    description: '머신러닝과 딥러닝을 활용한 AI 솔루션 개발 전문가입니다.',
    profileText: '머신러닝과 딥러닝을 활용한 AI 솔루션 개발에 전문성을 가진 엔지니어입니다. 컴퓨터 비전과 자연어 처리 분야에 특히 강점을 보입니다.',
    recommendationReason: 'AI/ML 기술 전문성과 실무 적용 능력이 우수합니다.'
  },
  {
    id: 12, name: '배블록체인', position: '블록체인 개발자', experience: '2년', location: '서울 서초구',
    skills: ['Solidity', 'Web3.js', 'Ethereum', 'Smart Contracts'], matchRate: 83,
    avatar: 'https://via.placeholder.com/60', rating: 4.4, portfolioScore: 85,
    description: '이더리움 기반의 스마트 컨트랙트 개발 전문가입니다.',
    profileText: '이더리움 기반의 스마트 컨트랙트 개발과 DeFi 프로토콜 구현에 전문성을 가진 개발자입니다. 블록체인 기술의 실무 적용에 관심이 많습니다.',
    recommendationReason: '블록체인 기술과 스마트 컨트랙트 개발 경험이 있습니다.'
  },
  {
    id: 13, name: '오QA', position: 'QA 엔지니어', experience: '5년', location: '서울 마포구',
    skills: ['Selenium', 'Jest', 'Cypress', 'Postman'], matchRate: 86,
    avatar: 'https://via.placeholder.com/60', rating: 4.6, portfolioScore: 88,
    description: '자동화 테스트 구축과 품질 관리 전문가입니다.',
    profileText: '자동화 테스트 구축과 품질 관리에 전문성을 가진 QA 엔지니어입니다. 테스트 전략 수립과 테스트 케이스 설계에 뛰어난 역량을 보입니다.',
    recommendationReason: '테스트 자동화와 품질 관리 프로세스가 우수합니다.'
  },
  {
    id: 14, name: '장그로스', position: '그로스 해커', experience: '4년', location: '서울 강남구',
    skills: ['Google Analytics', 'A/B Testing', 'SQL', 'Growth Hacking'], matchRate: 88,
    avatar: 'https://via.placeholder.com/60', rating: 4.7, portfolioScore: 90,
    description: '데이터 기반의 성장 전략 수립과 실행 전문가입니다.',
    profileText: '데이터 기반의 성장 전략 수립과 실행에 전문성을 가진 그로스 해커입니다. 사용자 획득과 리텐션 개선에 특화된 경험을 가지고 있습니다.',
    recommendationReason: '성장 전략과 데이터 분석 기반 최적화 능력이 뛰어납니다.'
  },
  {
    id: 15, name: '유영상', position: '영상 편집자', experience: '6년', location: '서울 홍대',
    skills: ['Premiere Pro', 'After Effects', 'DaVinci Resolve'], matchRate: 84,
    avatar: 'https://via.placeholder.com/60', rating: 4.6, portfolioScore: 93,
    description: '고품질 영상 콘텐츠 제작과 모션 그래픽 디자인 전문가입니다.',
    profileText: '고품질 영상 콘텐츠 제작과 모션 그래픽 디자인에 전문성을 가진 편집자입니다. 브랜드 영상과 광고 콘텐츠 제작 경험이 풍부합니다.',
    recommendationReason: '영상 편집과 모션 그래픽 제작 기술이 매우 뛰어납니다.'
  },
  {
    id: 16, name: '노브랜드', position: '브랜드 디자이너', experience: '5년', location: '서울 성동구',
    skills: ['Brand Identity', 'Adobe Creative Suite', 'Typography'], matchRate: 82, 
    avatar: 'https://via.placeholder.com/60', rating: 4.5, portfolioScore: 89,
    description: '브랜드 아이덴티티 구축과 시각적 브랜딩 전문가입니다.',
    profileText: '브랜드 아이덴티티 구축과 시각적 브랜딩에 전문성을 가진 디자이너입니다. 로고 디자인과 브랜드 가이드라인 제작에 특별한 강점을 보입니다.',
    recommendationReason: '브랜드 디자인과 아이덴티티 구축 능력이 우수합니다.'
  },
  {
    id: 17, name: '도콘텐츠', position: '콘텐츠 기획자', experience: '4년', location: '서울 마포구',
    skills: ['Content Strategy', 'Copywriting', 'SEO'], matchRate: 81,
    avatar: 'https://via.placeholder.com/60', rating: 4.4, portfolioScore: 86,
    description: '다양한 플랫폼을 위한 콘텐츠 기획과 제작 전문가입니다.',
    profileText: '다양한 플랫폼을 위한 콘텐츠 기획과 제작에 전문성을 가진 기획자입니다. SEO 최적화와 소셜 미디어 전략 수립에 경험이 있습니다.',
    recommendationReason: '콘텐츠 전략과 크리에이티브 기획 능력이 뛰어납니다.'
  },
  {
    id: 18, name: '류하드웨어', position: '하드웨어 엔지니어', experience: '7년', location: '경기 수원시',
    skills: ['PCB Design', 'Embedded Systems', 'Arduino'], matchRate: 89,
    avatar: 'https://via.placeholder.com/60', rating: 4.7, portfolioScore: 91,
    description: '임베디드 시스템과 PCB 설계 전문가입니다.',
    profileText: '임베디드 시스템과 PCB 설계에 전문성을 가진 하드웨어 엔지니어입니다. IoT 디바이스 개발과 프로토타입 제작에 풍부한 경험을 가지고 있습니다.',
    recommendationReason: '하드웨어 설계와 임베디드 시스템 개발 경험이 풍부합니다.'
  },
  {
    id: 19, name: '김테크라이터', position: '테크니컬 라이터', experience: '4년', location: '서울 강남구',
    skills: ['Technical Writing', 'Documentation', 'API Documentation'], matchRate: 85,
    avatar: 'https://via.placeholder.com/60', rating: 4.6, portfolioScore: 87,
    description: '기술 문서 작성과 개발자 문서화 전문가입니다.',
    profileText: '기술 문서 작성과 개발자 문서화에 전문성을 가진 테크니컬 라이터입니다. API 문서와 사용자 가이드 제작에 특화된 경험을 가지고 있습니다.',
    recommendationReason: '기술 문서 작성과 커뮤니케이션 능력이 매우 우수합니다.'
  },
  {
    id: 20, name: '송스크럼마스터', position: '스크럼 마스터', experience: '6년', location: '서울 서초구',
    skills: ['Scrum', 'Agile', 'Jira', 'Team Facilitation'], matchRate: 88,
    avatar: 'https://via.placeholder.com/60', rating: 4.8, portfolioScore: 92,
    description: '애자일 방법론과 스크럼 프로세스 운영 전문가입니다.',
    profileText: '애자일 방법론과 스크럼 프로세스 운영에 전문성을 가진 스크럼 마스터입니다. 팀 퍼실리테이션과 프로젝트 관리에 뛰어난 역량을 보입니다.',
    recommendationReason: '애자일 프로세스 운영과 팀 관리 능력이 탁월합니다.'
  },
  {
    id: 21, name: '전사이버보안', position: '사이버 보안 분석가', experience: '5년', location: '서울 용산구',
    skills: ['Incident Response', 'Forensics', 'SIEM'], matchRate: 91,
    avatar: 'https://via.placeholder.com/60', rating: 4.9, portfolioScore: 94,
    description: '사이버 보안 사고 대응과 위협 분석 전문가입니다.',
    profileText: '사이버 보안 사고 대응과 위협 분석에 전문성을 가진 보안 분석가입니다. 디지털 포렌식과 악성코드 분석에 특별한 강점을 보입니다.',
    recommendationReason: '사이버 보안 전문성과 사고 대응 능력이 매우 뛰어납니다.'
  },
  {
    id: 22, name: '차VR/AR', position: 'VR/AR 개발자', experience: '3년', location: '서울 강남구',
    skills: ['Unity', 'Unreal Engine', 'ARCore', 'ARKit'], matchRate: 86,
    avatar: 'https://via.placeholder.com/60', rating: 4.5, portfolioScore: 88,
    description: '가상현실과 증강현실 애플리케이션 개발 전문가입니다.',
    profileText: '가상현실과 증강현실 애플리케이션 개발에 전문성을 가진 개발자입니다. 몰입형 경험 설계와 3D 인터랙션 구현에 특화되어 있습니다.',
    recommendationReason: 'VR/AR 기술과 3D 개발 경험이 우수합니다.'
  },
  {
    id: 23, name: '허웹디자이너', position: '웹 디자이너', experience: '4년', location: '서울 마포구',
    skills: ['HTML/CSS', 'JavaScript', 'Responsive Design'], matchRate: 83,
    avatar: 'https://via.placeholder.com/60', rating: 4.4, portfolioScore: 85,
    description: '웹 표준과 반응형 디자인 전문가입니다.',
    profileText: '웹 표준과 반응형 디자인에 전문성을 가진 웹 디자이너입니다. 사용자 친화적인 인터페이스와 크로스 브라우저 호환성에 특히 주의를 기울입니다.',
    recommendationReason: '웹 표준과 반응형 디자인 구현 능력이 뛰어납니다.'
  },
  {
    id: 24, name: '고데이터사이언티스트', position: '데이터 사이언티스트', experience: '5년', location: '서울 서초구',
    skills: ['Python', 'Machine Learning', 'Deep Learning'], matchRate: 92,
    avatar: 'https://via.placeholder.com/60', rating: 4.8, portfolioScore: 93,
    description: '머신러닝과 통계적 분석을 활용한 데이터 사이언스 전문가입니다.',
    profileText: '머신러닝과 통계적 분석을 활용한 데이터 사이언스에 전문성을 가진 사이언티스트입니다. 예측 모델링과 데이터 시각화에 특별한 강점을 보입니다.',
    recommendationReason: '고급 데이터 분석과 머신러닝 모델링 능력이 탁월합니다.'
  },
  {
    id: 25, name: '문사운드디자이너', position: '사운드 디자이너', experience: '6년', location: '서울 홍대',
    skills: ['Pro Tools', 'Logic Pro', 'Ableton Live'], matchRate: 80,
    avatar: 'https://via.placeholder.com/60', rating: 4.6, portfolioScore: 90,
    description: '게임과 영상을 위한 사운드 디자인 전문가입니다.',
    profileText: '게임과 영상을 위한 사운드 디자인에 전문성을 가진 디자이너입니다. 오디오 포스트 프로덕션과 음향 효과 제작에 풍부한 경험을 가지고 있습니다.',
    recommendationReason: '사운드 디자인과 오디오 제작 기술이 매우 뛰어납니다.'
  },
  {
    id: 26, name: '구광고기획자', position: '디지털 마케터', experience: '4년', location: '서울 강남구',
    skills: ['Google Ads', 'Facebook Ads', 'SEO/SEM'], matchRate: 87,
    avatar: 'https://via.placeholder.com/60', rating: 4.7, portfolioScore: 89,
    description: '디지털 마케팅과 온라인 광고 운영 전문가입니다.',
    profileText: '디지털 마케팅과 온라인 광고 운영에 전문성을 가진 마케터입니다. 퍼포먼스 마케팅과 전환율 최적화에 특화된 경험을 가지고 있습니다.',
    recommendationReason: '디지털 마케팅과 광고 운영 능력이 우수합니다.'
  },
  {
    id: 27, name: '서번역가', position: '기술 번역가', experience: '5년', location: '서울 용산구',
    skills: ['Technical Translation', 'Localization', 'CAT Tools'], matchRate: 79,
    avatar: 'https://via.placeholder.com/60', rating: 4.5, portfolioScore: 91,
    description: '기술 문서와 소프트웨어 현지화 전문가입니다.',
    profileText: '기술 문서와 소프트웨어 현지화에 전문성을 가진 번역가입니다. 다국어 지원과 문화적 적응에 특별한 관심과 경험을 가지고 있습니다.',
    recommendationReason: '기술 번역과 현지화 경험이 매우 풍부합니다.'
  },
  {
    id: 28, name: '강빅데이터', position: '빅데이터 엔지니어', experience: '6년', location: '서울 서초구',
    skills: ['Hadoop', 'Spark', 'Kafka', 'Elasticsearch'], matchRate: 93,
    avatar: 'https://via.placeholder.com/60', rating: 4.9, portfolioScore: 95,
    description: '대용량 데이터 처리와 분석 파이프라인 구축 전문가입니다.',
    profileText: '대용량 데이터 처리와 분석 파이프라인 구축에 전문성을 가진 빅데이터 엔지니어입니다. 실시간 데이터 스트리밍과 분산 처리에 특화되어 있습니다.',
    recommendationReason: '빅데이터 처리와 분산 시스템 구축 능력이 탁월합니다.'
  },
  {
    id: 29, name: '이IoT', position: 'IoT 개발자', experience: '4년', location: '경기 성남시',
    skills: ['IoT Platforms', 'MQTT', 'LoRaWAN'], matchRate: 85,
    avatar: 'https://via.placeholder.com/60', rating: 4.6, portfolioScore: 87,
    description: 'IoT 플랫폼 개발과 센서 네트워크 구축 전문가입니다.',
    profileText: 'IoT 플랫폼 개발과 센서 네트워크 구축에 전문성을 가진 개발자입니다. 엣지 컴퓨팅과 저전력 통신 프로토콜에 특별한 경험을 가지고 있습니다.',
    recommendationReason: 'IoT 시스템 개발과 센서 네트워크 구축 경험이 우수합니다.'
  },
  {
    id: 30, name: '김로보틱스', position: '로보틱스 엔지니어', experience: '7년', location: '서울 강서구',
    skills: ['ROS', 'Computer Vision', 'Control Systems'], matchRate: 90,
    avatar: 'https://via.placeholder.com/60', rating: 4.8, portfolioScore: 94,
    description: '로봇 제어 시스템과 자율 주행 기술 전문가입니다.',
    profileText: '로봇 제어 시스템과 자율 주행 기술에 전문성을 가진 로보틱스 엔지니어입니다. 컴퓨터 비전과 머신러닝을 활용한 지능형 로봇 개발에 경험이 있습니다.',
    recommendationReason: '로보틱스와 자율 주행 기술 전문성이 매우 뛰어납니다.'
  }
];

const Recommendations: React.FC = () => {
  const [selectedTalent, setSelectedTalent] = useState<Talent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [newTalent, setNewTalent] = useState({
    name: '',
    position: '',
    experience: '',
    location: '',
    skills: '',
    profileText: ''
  });
  const [talents, setTalents] = useState<Talent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    position: '',
    minExperience: '',
    location: '',
    skills: ''
  });

  // 초기 데이터 로드
  useEffect(() => {
    loadTalents();
  }, []);

  const loadTalents = async () => {
    try {
      setIsLoading(true);
      const talentsData = await TalentService.getAllTalents();
      setTalents(talentsData);
    } catch (error) {
      console.error('인재 목록 로드 실패:', error);
      // 실패 시 초기 데이터 사용
      setTalents(initialTalents);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterTalent = async () => {
    if (!newTalent.name.trim() || !newTalent.position.trim()) {
      alert('이름과 직무는 필수 입력 항목입니다.');
      return;
    }

    try {
      setIsRegistering(true);
      
      const skillsArray = newTalent.skills.split(',').map(skill => skill.trim()).filter(skill => skill);
      
      const talentData = {
        name: newTalent.name,
        position: newTalent.position,
        experience: newTalent.experience || '신입',
        location: newTalent.location || '위치 미입력',
        skills: skillsArray,
        profileText: newTalent.profileText || '등록된 소개가 없습니다.'
      };

      const registeredTalent = await TalentService.createTalent(talentData);
      
      // 목록에 새 인재 추가
      setTalents([registeredTalent, ...talents]);
      
      // 폼 초기화
      setNewTalent({
        name: '',
        position: '',
        experience: '',
        location: '',
        skills: '',
        profileText: ''
      });

      // 모달 닫기
      setIsRegisterModalOpen(false);
      alert('인재 정보가 성공적으로 등록되었습니다!');
      
    } catch (error) {
      console.error('인재 등록 실패:', error);
      alert('인재 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsRegistering(false);
    }
  };

  const filteredTalents = talents.filter(talent => {
    const matchesSearch = searchTerm === '' || 
      talent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      talent.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      talent.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPosition = filters.position === '' || 
      talent.position.toLowerCase().includes(filters.position.toLowerCase());
    
    const matchesLocation = filters.location === '' || 
      talent.location.toLowerCase().includes(filters.location.toLowerCase());
    
    const matchesSkills = filters.skills === '' || 
      talent.skills.some(skill => skill.toLowerCase().includes(filters.skills.toLowerCase()));
    
    return matchesSearch && matchesPosition && matchesLocation && matchesSkills;
  }).sort((a, b) => b.matchRate - a.matchRate);

  return (
    <div className="talent-container">
      {/* 왼쪽 인재 검색 필터 */}
      <div className="condition-panel">
        <h3 className="section-title">
          <FontAwesomeIcon icon={faCog} />
          인재 검색 필터
        </h3>
        
        <div className="condition-group">
          <label>직무</label>
          <input 
            type="text" 
            placeholder="예: 프론트엔드 개발자"
            value={filters.position}
            onChange={(e) => setFilters({...filters, position: e.target.value})}
          />
      </div>

        <div className="condition-group">
          <label>최소 경력</label>
          <input 
            type="text" 
            placeholder="예: 3년"
            value={filters.minExperience}
            onChange={(e) => setFilters({...filters, minExperience: e.target.value})}
          />
      </div>

        <div className="condition-group">
          <label>지역</label>
          <input 
            type="text" 
            placeholder="예: 서울"
            value={filters.location}
            onChange={(e) => setFilters({...filters, location: e.target.value})}
          />
          </div>

        <div className="condition-group">
          <label>필수 기술</label>
          <input 
            type="text" 
            placeholder="예: React, TypeScript"
            value={filters.skills}
            onChange={(e) => setFilters({...filters, skills: e.target.value})}
          />
        </div>
      </div>

            {/* 메인 컨텐츠 */}
      <div className="main-content">
        {/* 인재 목록 */}
        <div className="talent-list-section">
          <div className="talent-list-header">
            <h3 className="section-title">
              <FontAwesomeIcon icon={faUser} />
              등록된 인재 목록 ({filteredTalents.length}명)
            </h3>
            <div className="header-controls">
              <button 
                className="btn primary register-btn"
                onClick={() => setIsRegisterModalOpen(true)}
              >
                <FontAwesomeIcon icon={faCheckCircle} />
                인재 정보 등록
              </button>
              <input
                type="text"
                placeholder="이름, 직무, 기술로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
                    </div>
                  </div>

          <div className="talent-list">
            {isLoading ? (
              <div className="loading-container">
                <FontAwesomeIcon icon={faSpinner} spin />
                <span>인재 목록을 불러오는 중...</span>
              </div>
            ) : filteredTalents.length === 0 ? (
              <p className="no-talent-message">조건에 맞는 인재가 없습니다.</p>
            ) : (
              filteredTalents.map((talent) => (
              <button
                key={talent.id}
                className="talent-button"
                onClick={() => {
                  setSelectedTalent(talent);
                  setIsModalOpen(true);
                }}
              >
                <div className="talent-info">
                  <h4 className="talent-name">{talent.name}</h4>
                  <div className="talent-brief">
                    <span>{talent.position}</span>
                    <span>
                      <FontAwesomeIcon icon={faBriefcase} /> {talent.experience} 경력
                    </span>
                    <span>
                      <FontAwesomeIcon icon={faMapMarkerAlt} /> {talent.location}
                      </span>
                  </div>
                </div>
                <div className={`ai-match-score score-${Math.floor(talent.matchRate / 10)}`}>
                  <FontAwesomeIcon icon={faStar} />
                  {talent.matchRate}% 매칭률
                    </div>
              </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 상세 모달 */}
      {isModalOpen && selectedTalent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{selectedTalent.name} 인재 상세</h2>
              <button 
                className="close-button"
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
      </div>

            <div className="modal-body">
              <div className="info-section">
                <h4>기본 정보</h4>
                <p><strong>직무:</strong> {selectedTalent.position}</p>
                <p><strong>경력:</strong> {selectedTalent.experience}</p>
                <p><strong>지역:</strong> {selectedTalent.location}</p>
                <p><strong>AI 매칭 점수:</strong> {selectedTalent.matchRate}%</p>
                <p><strong>평점:</strong> {selectedTalent.rating}/5.0</p>
              </div>

              <div className="info-section">
                <h4>기술 스택</h4>
                <div className="tags">
                  {selectedTalent.skills.map((skill, index) => (
                    <span key={index} className="tag">{skill}</span>
                  ))}
                </div>
            </div>
            
              <div className="info-section">
                <h4>프로필</h4>
                <p>{selectedTalent.profileText}</p>
            </div>
            
              <div className="info-section">
                <h4>추천 이유</h4>
                <p>{selectedTalent.recommendationReason}</p>
                  </div>

              <div className="modal-actions">
                <button className="btn primary">
                  <FontAwesomeIcon icon={faEnvelope} />
                  연락하기
                </button>
                <button className="btn">
                  <FontAwesomeIcon icon={faEye} />
                  포트폴리오
                </button>
                <button className="btn">
                  <FontAwesomeIcon icon={faDownload} />
                  이력서
                    </button>
                  </div>
                </div>
              </div>
            </div>
         )}

         {/* 인재 등록 모달 */}
         {isRegisterModalOpen && (
           <div className="modal-overlay" onClick={() => setIsRegisterModalOpen(false)}>
             <div className="modal-content register-modal" onClick={(e) => e.stopPropagation()}>
               <button className="modal-close-button" onClick={() => setIsRegisterModalOpen(false)}>&times;</button>
               <h2>
                 <FontAwesomeIcon icon={faUser} />
                 인재 정보 등록
               </h2>
               
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
                 <div className="condition-group">
                   <label>이름 *</label>
                   <input
                     type="text"
                     placeholder="홍길동"
                     value={newTalent.name}
                     onChange={(e) => setNewTalent({...newTalent, name: e.target.value})}
                   />
            </div>
            
                 <div className="condition-group">
                   <label>직무 *</label>
                   <input
                     type="text"
                     placeholder="프론트엔드 개발자"
                     value={newTalent.position}
                     onChange={(e) => setNewTalent({...newTalent, position: e.target.value})}
                   />
            </div>
            
                 <div className="condition-group">
                   <label>경력</label>
                   <input
                     type="text"
                     placeholder="3년 (없으면 '신입')"
                     value={newTalent.experience}
                     onChange={(e) => setNewTalent({...newTalent, experience: e.target.value})}
                   />
            </div>
            
                 <div className="condition-group">
                   <label>지역</label>
                   <input
                     type="text"
                     placeholder="서울 강남구"
                     value={newTalent.location}
                     onChange={(e) => setNewTalent({...newTalent, location: e.target.value})}
                   />
            </div>
          </div>
               
               <div className="condition-group">
                 <label>기술 스택</label>
                 <input
                   type="text"
                   placeholder="React, TypeScript, JavaScript (쉼표로 구분)"
                   value={newTalent.skills}
                   onChange={(e) => setNewTalent({...newTalent, skills: e.target.value})}
                 />
        </div>
               
               <div className="condition-group">
                 <label>프로필 소개</label>
                 <textarea
                   value={newTalent.profileText}
                   onChange={(e) => setNewTalent({...newTalent, profileText: e.target.value})}
                   placeholder="본인의 경험, 강점, 관심 분야 등을 자유롭게 작성해주세요..."
                   rows={4}
                 />
      </div>

               <div className="modal-actions">
                 <button 
                   className="btn primary"
                   onClick={handleRegisterTalent}
                   disabled={isRegistering}
                 >
                   <FontAwesomeIcon icon={isRegistering ? faSpinner : faCheckCircle} spin={isRegistering} />
                   {isRegistering ? '등록 중...' : '등록하기'}
                 </button>
                 <button 
                   className="btn"
                   onClick={() => setIsRegisterModalOpen(false)}
                 >
                   취소
        </button>
      </div>
             </div>
           </div>
         )}
    </div>
  );
};

export default Recommendations; 