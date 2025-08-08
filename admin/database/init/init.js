// MongoDB 초기화 스크립트
db = db.getSiblingDB('hireme');

// 사용자 컬렉션 생성 및 샘플 데이터
db.createCollection('users');
db.users.insertMany([
  {
    username: "admin",
    email: "admin@hireme.com",
    role: "admin",
    created_at: new Date()
  },
  {
    username: "user1",
    email: "user1@example.com",
    role: "user",
    created_at: new Date()
  },
  {
    username: "user2", 
    email: "user2@example.com",
    role: "user",
    created_at: new Date()
  }
]);

// 이력서 컬렉션 생성 및 샘플 데이터
db.createCollection('resumes');
db.resumes.insertMany([
  {
    user_id: "user1",
    title: "프론트엔드 개발자 이력서",
    content: "React, TypeScript, Node.js 경험...",
    status: "pending",
    created_at: new Date()
  },
  {
    user_id: "user2",
    title: "백엔드 개발자 이력서", 
    content: "Python, FastAPI, MongoDB 경험...",
    status: "approved",
    created_at: new Date()
  }
]);

// 면접 컬렉션 생성 및 샘플 데이터
db.createCollection('interviews');
db.interviews.insertMany([
  {
    user_id: "user1",
    company: "테크컴퍼니",
    position: "프론트엔드 개발자",
    date: new Date("2024-01-15T10:00:00Z"),
    status: "scheduled",
    created_at: new Date()
  },
  {
    user_id: "user2",
    company: "스타트업",
    position: "백엔드 개발자", 
    date: new Date("2024-01-20T14:00:00Z"),
    status: "completed",
    created_at: new Date()
  }
]);

// 포트폴리오 컬렉션 생성 및 샘플 데이터
db.createCollection('portfolios');
db.portfolios.insertMany([
  {
    user_id: "user1",
    title: "React 프로젝트",
    description: "React와 TypeScript를 사용한 웹 애플리케이션",
    github_url: "https://github.com/user1/react-project",
    status: "active",
    created_at: new Date()
  },
  {
    user_id: "user2",
    title: "FastAPI 백엔드",
    description: "FastAPI와 MongoDB를 사용한 REST API",
    github_url: "https://github.com/user2/fastapi-project",
    status: "active", 
    created_at: new Date()
  }
]);

// 인재 컬렉션 생성 및 샘플 데이터
db.createCollection('talents');
db.talents.insertMany([
  {
    name: '김철수',
    position: '시니어 프론트엔드 개발자',
    experience: '5년',
    location: '서울',
    skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Redux', 'GraphQL', 'Jest', 'AWS', 'Docker'],
    lastActive: '2024-01-15',
    portfolioScore: 92,
    aiProfile: {
      personality: ['창의적', '협업 지향적'],
      abilities: ['frontend', 'tools', 'cloud'],
      keywords: ['React', 'TypeScript', 'AWS', 'Docker']
    },
    profileText: '5년간 React 생태계에서 다양한 프로젝트를 수행해온 프론트엔드 개발자입니다. TypeScript와 Next.js를 활용한 모던 웹 개발에 전문성을 가지고 있으며, AWS 클라우드 환경에서의 배포 경험이 풍부합니다.',
    recommendationReason: 'React 생태계 전문성과 클라우드 경험이 뛰어나며, 현대적인 개발 스택에 능숙합니다.',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    name: '이영희',
    position: '백엔드 아키텍트',
    experience: '7년',
    location: '경기',
    skills: ['Node.js', 'Python', 'Django', 'PostgreSQL', 'Docker', 'Kubernetes', 'Redis', 'GraphQL', 'Microservices'],
    lastActive: '2024-01-14',
    portfolioScore: 89,
    aiProfile: {
      personality: ['리더십', '세심함'],
      abilities: ['backend', 'database', 'cloud'],
      keywords: ['Node.js', 'Python', 'PostgreSQL', 'Kubernetes']
    },
    profileText: '대규모 시스템 설계와 마이크로서비스 아키텍처 구축 경험이 있는 백엔드 전문가입니다. 성능 최적화와 확장성 있는 시스템 구축에 전문성을 가지고 있습니다.',
    recommendationReason: '시스템 아키텍처 설계 능력이 뛰어나고, 대용량 트래픽 처리 경험이 풍부합니다.',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    name: '박민수',
    position: 'UI/UX 디자이너',
    experience: '4년',
    location: '서울',
    skills: ['Figma', 'Adobe XD', 'Sketch', 'InVision', 'Principle', 'HTML5', 'CSS3', 'JavaScript', 'React'],
    lastActive: '2024-01-13',
    portfolioScore: 85,
    aiProfile: {
      personality: ['창의적', '세심함'],
      abilities: ['frontend', 'tools'],
      keywords: ['Figma', 'React', 'JavaScript', 'CSS3']
    },
    profileText: '사용자 중심의 디자인과 프론트엔드 개발 지식을 모두 갖춘 UI/UX 디자이너입니다. 디자인 시스템 구축과 개발자와의 협업에 능숙합니다.',
    recommendationReason: '디자인과 개발 지식을 모두 갖춘 융합형 인재로, 개발팀과의 협업이 원활합니다.',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    name: '정수진',
    position: '데이터 사이언티스트',
    experience: '6년',
    location: '부산',
    skills: ['Python', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'SQL', 'AWS', 'Docker', 'Kubernetes'],
    lastActive: '2024-01-12',
    portfolioScore: 94,
    aiProfile: {
      personality: ['세심함', '리더십'],
      abilities: ['ai', 'cloud', 'database'],
      keywords: ['Python', 'TensorFlow', 'AWS', 'SQL']
    },
    profileText: 'ML/DL 모델 개발과 대용량 데이터 처리에 전문성을 가진 데이터 사이언티스트입니다. 클라우드 환경에서의 AI 서비스 구축 경험이 풍부합니다.',
    recommendationReason: 'AI/ML 전문 지식과 실무 경험이 뛰어나며, 클라우드 기반 AI 서비스 구축 능력이 우수합니다.',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    name: '최하늘',
    position: '풀스택 개발자',
    experience: '3년',
    location: '대구',
    skills: ['React', 'Node.js', 'Express.js', 'MongoDB', 'TypeScript', 'Docker', 'AWS', 'Git'],
    lastActive: '2024-01-16',
    portfolioScore: 87,
    aiProfile: {
      personality: ['협업 지향적', '창의적'],
      abilities: ['frontend', 'backend', 'database', 'cloud'],
      keywords: ['React', 'Node.js', 'MongoDB', 'AWS']
    },
    profileText: '프론트엔드와 백엔드를 모두 아우르는 풀스택 개발자로, 스타트업 환경에서 빠른 프로토타이핑과 MVP 개발 경험이 있습니다.',
    recommendationReason: '전체적인 개발 프로세스를 이해하고 있어 다양한 프로젝트에 유연하게 대응 가능합니다.',
    created_at: new Date(),
    updated_at: new Date()
  }
]);

print("MongoDB 초기화 완료!"); 