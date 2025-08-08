from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import List, Optional
import os
import re
from datetime import datetime
from bson import ObjectId
from chatbot_router import router as chatbot_router
from ai_matching_service import ai_matching_service  # Gemini 유지, HuggingFace만 비활성화

# FastAPI 앱 생성
app = FastAPI(
    title="HireMe API",
    description="HireMe 프로젝트 백엔드 API",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 챗봇 라우터 추가
app.include_router(chatbot_router, prefix="/api/chatbot", tags=["chatbot"])

# MongoDB 연결 (Docker Compose 환경 변수 사용)
MONGODB_URI = os.getenv("DATABASE_URL", "mongodb://admin:password123@mongodb:27017/hireme?authSource=admin")
client = AsyncIOMotorClient(MONGODB_URI)
db = client.hireme

# Pydantic 모델들
class User(BaseModel):
    id: Optional[str] = None
    username: str
    email: str
    role: str = "user"
    created_at: Optional[datetime] = None

class Resume(BaseModel):
    id: Optional[str] = None
    user_id: str
    title: str
    content: str
    status: str = "pending"
    created_at: Optional[datetime] = None

class Interview(BaseModel):
    id: Optional[str] = None
    user_id: str
    company: str
    position: str
    date: datetime
    status: str = "scheduled"
    created_at: Optional[datetime] = None

class AIProfile(BaseModel):
    personality: List[str] = []
    abilities: List[str] = []
    keywords: List[str] = []

class Talent(BaseModel):
    id: Optional[str] = None
    name: str
    position: str
    experience: str
    location: str
    skills: List[str] = []
    profileText: str
    aiProfile: Optional[AIProfile] = None
    rating: Optional[float] = None
    portfolioScore: Optional[int] = None
    matchRate: Optional[int] = None
    avatar: Optional[str] = None
    description: Optional[str] = None
    recommendationReason: Optional[str] = None
    lastActive: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class MatchingRequest(BaseModel):
    requirements: str  # 요구사항 텍스트
    position: Optional[str] = None
    minExperience: Optional[int] = None
    skills: Optional[List[str]] = None
    location: Optional[str] = None

# API 라우트들
@app.get("/")
async def root():
    return {"message": "HireMe API 서버가 실행 중입니다!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}

# 사용자 관련 API
@app.get("/api/users", response_model=List[User])
async def get_users():
    users = await db.users.find().to_list(1000)
    return [User(**user) for user in users]

@app.post("/api/users", response_model=User)
async def create_user(user: User):
    user_dict = user.dict()
    user_dict["created_at"] = datetime.now()
    result = await db.users.insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)
    return User(**user_dict)

# 이력서 관련 API
@app.get("/api/resumes", response_model=List[Resume])
async def get_resumes():
    resumes = await db.resumes.find().to_list(1000)
    return [Resume(**resume) for resume in resumes]

@app.post("/api/resumes", response_model=Resume)
async def create_resume(resume: Resume):
    resume_dict = resume.dict()
    resume_dict["created_at"] = datetime.now()
    result = await db.resumes.insert_one(resume_dict)
    resume_dict["id"] = str(result.inserted_id)
    return Resume(**resume_dict)

# 면접 관련 API
@app.get("/api/interviews", response_model=List[Interview])
async def get_interviews():
    interviews = await db.interviews.find().to_list(1000)
    return [Interview(**interview) for interview in interviews]

@app.post("/api/interviews", response_model=Interview)
async def create_interview(interview: Interview):
    interview_dict = interview.dict()
    interview_dict["created_at"] = datetime.now()
    result = await db.interviews.insert_one(interview_dict)
    interview_dict["id"] = str(result.inserted_id)
    return Interview(**interview_dict)

# AI 매칭 함수들
def analyze_requirements(requirements_text: str) -> dict:
    """요구사항 텍스트를 분석하여 키워드를 추출합니다."""
    
    # 직무 키워드
    position_keywords = {
        '개발자': ['개발자', '프로그래머', '엔지니어', '개발', '프로그래밍'],
        '디자이너': ['디자이너', '디자인', 'UI', 'UX', '인터페이스'],
        '매니저': ['매니저', '관리자', '팀장', '리더', '관리'],
        '분석가': ['분석가', '분석', '데이터', '통계', '인사이트'],
        '마케터': ['마케터', '마케팅', '홍보', '브랜딩', '광고']
    }
    
    # 기술 키워드
    tech_keywords = ['React', 'Vue', 'Angular', 'JavaScript', 'TypeScript', 'Python', 'Java', 
                    'Node.js', 'Spring', 'Django', 'MySQL', 'MongoDB', 'AWS', 'Docker', 'Kubernetes']
    
    # 성격/능력 키워드
    ability_keywords = ['창의적', '분석적', '협업', '리더십', '커뮤니케이션', '문제해결', 
                       '적극적', '주도적', '꼼꼼', '유연']
    
    text_lower = requirements_text.lower()
    
    # 추출된 키워드들
    extracted_position = None
    for pos, keywords in position_keywords.items():
        if any(keyword in text_lower for keyword in keywords):
            extracted_position = pos
            break
    
    extracted_skills = []
    for skill in tech_keywords:
        if skill.lower() in text_lower:
            extracted_skills.append(skill)
    
    extracted_abilities = []
    for ability in ability_keywords:
        if ability in text_lower:
            extracted_abilities.append(ability)
    
    return {
        'position': extracted_position,
        'skills': extracted_skills,
        'abilities': extracted_abilities,
        'original_text': requirements_text
    }

def calculate_talent_match_score(talent: dict, requirements: dict) -> int:
    """인재와 요구사항 간의 매칭 점수를 계산합니다."""
    base_score = 60
    
    # 직무 매칭 (30점)
    position_score = 0
    if requirements.get('position'):
        talent_position = talent.get('position', '').lower()
        req_position = requirements['position'].lower()
        if req_position in talent_position or talent_position in req_position:
            position_score = 30
        elif any(word in talent_position for word in req_position.split()):
            position_score = 20
    
    # 기술 스택 매칭 (25점)
    skills_score = 0
    talent_skills = [skill.lower() for skill in talent.get('skills', [])]
    req_skills = [skill.lower() for skill in requirements.get('skills', [])]
    if req_skills:
        matched_skills = sum(1 for skill in req_skills if any(skill in ts for ts in talent_skills))
        skills_score = min((matched_skills / len(req_skills)) * 25, 25)
    
    # 능력 매칭 (15점)
    abilities_score = 0
    if talent.get('aiProfile') and requirements.get('abilities'):
        talent_abilities = [ability.lower() for ability in 
                          talent['aiProfile'].get('personality', []) + 
                          talent['aiProfile'].get('abilities', [])]
        req_abilities = [ability.lower() for ability in requirements['abilities']]
        matched_abilities = sum(1 for ability in req_abilities if any(ability in ta for ta in talent_abilities))
        if req_abilities:
            abilities_score = min((matched_abilities / len(req_abilities)) * 15, 15)
    
    # 경력 점수 (10점)
    experience_score = 0
    talent_exp = talent.get('experience', '0')
    exp_numbers = re.findall(r'\d+', talent_exp)
    if exp_numbers:
        exp_years = int(exp_numbers[0])
        experience_score = min(exp_years * 2, 10)
    
    final_score = base_score + position_score + skills_score + abilities_score + experience_score
    return min(max(final_score, 60), 100)

# 인재 관련 API
@app.get("/api/talents", response_model=List[Talent])
async def get_talents():
    """모든 인재 목록을 조회합니다."""
    talents = await db.talents.find().to_list(1000)
    for talent in talents:
        talent["id"] = str(talent["_id"])
        del talent["_id"]
    return [Talent(**talent) for talent in talents]

@app.post("/api/talents/match", response_model=List[Talent])
async def match_talents(matching_request: MatchingRequest):
    """AI 기반 인재 매칭을 수행하여 가장 적합한 인재를 반환합니다."""
    
    # AI 기반 요구사항 분석
    analyzed_req = ai_matching_service.analyze_requirements_with_ai(matching_request.requirements)
    
    # 모든 인재 조회
    talents = await db.talents.find().to_list(1000)
    
    # AI 기반 매칭 점수 계산 및 정렬
    matched_talents = []
    for talent in talents:
        talent["id"] = str(talent["_id"])
        del talent["_id"]
        
        # AI 기반 매칭 점수 계산
        match_score = ai_matching_service.calculate_ai_talent_match_score(talent, analyzed_req)
        talent["matchRate"] = match_score
        
        # AI 기반 추천 이유 생성
        reasons = []
        
        # 의미적 유사도 기반 매칭 정보
        if analyzed_req.get('position') and talent.get('position'):
            similarity = ai_matching_service.calculate_semantic_similarity(
                talent['position'], analyzed_req['position']
            )
            if similarity > 0.7:
                reasons.append(f"직무 전문성 (유사도: {similarity*100:.0f}%)")
        
        # 기술 스택 매칭
        if analyzed_req.get('skills') and talent.get('skills'):
            talent_skills = [skill.lower() for skill in talent.get('skills', [])]
            matched_skills = [skill for skill in analyzed_req['skills'] 
                            if any(skill.lower() in ts for ts in talent_skills)]
            if matched_skills:
                reasons.append(f"{', '.join(matched_skills[:2])} 기술 보유")
        
        # 프로필 텍스트 유사도
        if analyzed_req.get('original_text') and talent.get('profileText'):
            profile_similarity = ai_matching_service.calculate_semantic_similarity(
                talent['profileText'], analyzed_req['original_text']
            )
            if profile_similarity > 0.6:
                reasons.append(f"프로필 적합도 (유사도: {profile_similarity*100:.0f}%)")
        
        # 기본 추천 이유
        if not reasons:
            reasons.append("AI 분석 기반 추천")
        
        talent["recommendationReason"] = "; ".join(reasons)
        
        # 최소 매칭 점수 이상만 포함 (65점 이상으로 완화)
        if match_score >= 65:
            matched_talents.append(talent)
    
    # 매칭 점수 순으로 정렬
    matched_talents.sort(key=lambda x: x["matchRate"], reverse=True)
    
    return [Talent(**talent) for talent in matched_talents]

@app.get("/api/talents/{talent_id}", response_model=Talent)
async def get_talent(talent_id: str):
    """특정 인재 정보를 조회합니다."""
    try:
        talent = await db.talents.find_one({"_id": ObjectId(talent_id)})
        if not talent:
            raise HTTPException(status_code=404, detail="Talent not found")
        
        talent["id"] = str(talent["_id"])
        del talent["_id"]
        return Talent(**talent)
    except Exception:
        raise HTTPException(status_code=404, detail="Talent not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 