from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import List, Optional
import os
import re
import random
from datetime import datetime
from bson import ObjectId
from chatbot_router import router as chatbot_router
from auth_router import auth_router  # 인증 시스템
from documents_router import documents_router  # 문서 관리 시스템
from company_router import company_router  # 회사 관리 시스템

# FastAPI 앱 생성
app = FastAPI(
    title="HireMe Client API",
    description="HireMe 클라이언트 애플리케이션 백엔드 API",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 챗봇 라우터 추가
app.include_router(chatbot_router, prefix="/api/chatbot", tags=["chatbot"])

# 인증 라우터 추가
app.include_router(auth_router, prefix="/api/auth", tags=["authentication"])

# 문서 관리 라우터 추가
app.include_router(documents_router, prefix="/api/documents", tags=["documents"])

# 회사 관리 라우터 추가
app.include_router(company_router, prefix="/api/company", tags=["company"])

# MongoDB 연결 (Docker Compose 환경 변수 사용)
MONGODB_URI = os.getenv("DATABASE_URL", "mongodb://admin:password123@mongodb:27017/hireme?authSource=admin")
client = AsyncIOMotorClient(MONGODB_URI)
db = client.hireme

# Pydantic 모델들
class Job(BaseModel):
    id: Optional[str] = None
    title: str
    company: str
    location: str
    description: str
    requirements: List[str] = []
    salary_range: Optional[str] = None
    type: str = "full-time"  # full-time, part-time, contract
    status: str = "active"
    created_at: Optional[datetime] = None

class Portfolio(BaseModel):
    id: Optional[str] = None
    user_id: str
    title: str
    description: str
    github_url: Optional[str] = None
    live_url: Optional[str] = None
    technologies: List[str] = []
    status: str = "active"
    created_at: Optional[datetime] = None

class Application(BaseModel):
    id: Optional[str] = None
    user_id: str
    job_id: str
    status: str = "applied"  # applied, reviewing, interviewed, offered, rejected
    applied_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

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

# AI 분석 함수들
def analyze_profile_text(profile_text: str) -> AIProfile:
    """프로필 텍스트를 분석하여 AI 프로필을 생성합니다."""
    
    # 성격 특성 키워드
    personality_keywords = {
        '분석적': ['분석', '논리', '체계', '정확', '데이터'],
        '창의적': ['창의', '혁신', '아이디어', '독창', '상상'],
        '리더십': ['리더', '관리', '팀장', '이끌', '책임'],
        '협업적': ['협업', '팀워크', '소통', '협력', '함께'],
        '주도적': ['주도', '적극', '능동', '자발', '진취'],
        '꼼꼼함': ['꼼꼼', '세심', '정밀', '철저', '완벽'],
        '유연함': ['유연', '적응', '변화', '개방', '융통'],
        '문제해결': ['문제해결', '해결', '트러블슈팅', '개선', '최적화']
    }
    
    # 능력 키워드
    ability_keywords = {
        '커뮤니케이션': ['커뮤니케이션', '소통', '발표', '설명', '전달'],
        '기획': ['기획', '계획', '전략', '설계', '구상'],
        '개발': ['개발', '프로그래밍', '코딩', '구현', '제작'],
        '디자인': ['디자인', '설계', 'UI', 'UX', '인터페이스'],
        '데이터분석': ['데이터', '분석', '통계', '인사이트', '시각화'],
        '마케팅': ['마케팅', '홍보', '브랜딩', '광고', '프로모션'],
        '영업': ['영업', '세일즈', '고객', '클라이언트', '제안'],
        '관리': ['관리', '운영', '프로젝트', '일정', '품질']
    }
    
    # 키워드 추출
    general_keywords = ['혁신', '성장', '도전', '효율', '자동화', '최적화', 
                       '사용자경험', '보안', '클라우드', 'AI', '머신러닝', 
                       '빅데이터', '모바일', '웹', '앱', '시스템']
    
    text_lower = profile_text.lower()
    
    # 매칭된 특성 찾기
    personality = []
    for trait, keywords in personality_keywords.items():
        if any(keyword in text_lower for keyword in keywords):
            personality.append(trait)
    
    abilities = []
    for ability, keywords in ability_keywords.items():
        if any(keyword in text_lower for keyword in keywords):
            abilities.append(ability)
    
    keywords = []
    for keyword in general_keywords:
        if keyword.lower() in text_lower:
            keywords.append(keyword)
    
    # 최소 1개씩은 있도록 보장
    if not personality:
        personality = ['분석적']
    if not abilities:
        abilities = ['개발']
    if not keywords:
        keywords = ['혁신']
    
    return AIProfile(
        personality=personality[:3],  # 최대 3개
        abilities=abilities[:3],      # 최대 3개
        keywords=keywords[:3]         # 최대 3개
    )

def calculate_match_rate(talent: dict) -> int:
    """인재의 매칭 점수를 계산합니다."""
    base_score = 70
    
    # 경력 점수
    experience_years = 0
    if talent.get('experience'):
        numbers = re.findall(r'\d+', talent['experience'])
        if numbers:
            experience_years = int(numbers[0])
    
    experience_score = min(experience_years * 3, 15)
    
    # 기술 스택 점수
    skills_count = len(talent.get('skills', []))
    skills_score = min(skills_count * 2, 10)
    
    # 프로필 충실도 점수
    profile_score = 0
    if talent.get('profileText') and len(talent['profileText']) > 50:
        profile_score = 5
    
    final_score = base_score + experience_score + skills_score + profile_score
    return min(max(final_score, 60), 100)

# API 라우트들
@app.get("/")
async def root():
    return {"message": "HireMe Client API 서버가 실행 중입니다!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}

# 채용 정보 관련 API
@app.get("/api/jobs", response_model=List[Job])
async def get_jobs():
    jobs = await db.jobs.find().to_list(1000)
    return [Job(**job) for job in jobs]

@app.post("/api/jobs", response_model=Job)
async def create_job(job: Job):
    job_dict = job.dict()
    job_dict["created_at"] = datetime.now()
    result = await db.jobs.insert_one(job_dict)
    job_dict["id"] = str(result.inserted_id)
    return Job(**job_dict)

@app.get("/api/jobs/{job_id}", response_model=Job)
async def get_job(job_id: str):
    job = await db.jobs.find_one({"_id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return Job(**job)

# 포트폴리오 관련 API
@app.get("/api/portfolios", response_model=List[Portfolio])
async def get_portfolios():
    portfolios = await db.portfolios.find().to_list(1000)
    return [Portfolio(**portfolio) for portfolio in portfolios]

@app.post("/api/portfolios", response_model=Portfolio)
async def create_portfolio(portfolio: Portfolio):
    portfolio_dict = portfolio.dict()
    portfolio_dict["created_at"] = datetime.now()
    result = await db.portfolios.insert_one(portfolio_dict)
    portfolio_dict["id"] = str(result.inserted_id)
    return Portfolio(**portfolio_dict)

# 지원 관련 API
@app.get("/api/applications", response_model=List[Application])
async def get_applications():
    applications = await db.applications.find().to_list(1000)
    return [Application(**application) for application in applications]

@app.post("/api/applications", response_model=Application)
async def create_application(application: Application):
    application_dict = application.dict()
    application_dict["applied_at"] = datetime.now()
    application_dict["updated_at"] = datetime.now()
    result = await db.applications.insert_one(application_dict)
    application_dict["id"] = str(result.inserted_id)
    return Application(**application_dict)

# 인재 관련 API
@app.get("/api/talents", response_model=List[Talent])
async def get_talents():
    """모든 인재 목록을 조회합니다."""
    talents = await db.talents.find().to_list(1000)
    for talent in talents:
        talent["id"] = str(talent["_id"])
        del talent["_id"]
    return [Talent(**talent) for talent in talents]

@app.post("/api/talents", response_model=Talent)
async def create_talent(talent: Talent):
    """새로운 인재를 등록합니다."""
    talent_dict = talent.dict(exclude={"id"})
    
    # AI 프로필 분석
    if talent_dict.get("profileText"):
        talent_dict["aiProfile"] = analyze_profile_text(talent_dict["profileText"]).dict()
    
    # 매칭 점수 계산
    talent_dict["matchRate"] = calculate_match_rate(talent_dict)
    
    # 기본값 설정
    talent_dict["rating"] = round(random.uniform(4.0, 5.0), 1)
    talent_dict["portfolioScore"] = random.randint(80, 95)
    talent_dict["avatar"] = "https://via.placeholder.com/60"
    talent_dict["description"] = talent_dict.get("profileText", "등록된 소개가 없습니다.")[:100] + "..."
    talent_dict["recommendationReason"] = "새로 등록된 인재입니다."
    talent_dict["lastActive"] = datetime.now().strftime("%Y-%m-%d")
    talent_dict["created_at"] = datetime.now()
    talent_dict["updated_at"] = datetime.now()
    
    result = await db.talents.insert_one(talent_dict)
    talent_dict["id"] = str(result.inserted_id)
    if "_id" in talent_dict:
        del talent_dict["_id"]
    
    return Talent(**talent_dict)

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

@app.put("/api/talents/{talent_id}", response_model=Talent)
async def update_talent(talent_id: str, talent: Talent):
    """인재 정보를 수정합니다."""
    try:
        talent_dict = talent.dict(exclude={"id", "created_at"})
        
        # AI 프로필 재분석
        if talent_dict.get("profileText"):
            talent_dict["aiProfile"] = analyze_profile_text(talent_dict["profileText"]).dict()
        
        # 매칭 점수 재계산
        talent_dict["matchRate"] = calculate_match_rate(talent_dict)
        talent_dict["updated_at"] = datetime.now()
        
        result = await db.talents.update_one(
            {"_id": ObjectId(talent_id)}, 
            {"$set": talent_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Talent not found")
        
        updated_talent = await db.talents.find_one({"_id": ObjectId(talent_id)})
        updated_talent["id"] = str(updated_talent["_id"])
        del updated_talent["_id"]
        
        return Talent(**updated_talent)
    except Exception:
        raise HTTPException(status_code=404, detail="Talent not found")

@app.delete("/api/talents/{talent_id}")
async def delete_talent(talent_id: str):
    """인재 정보를 삭제합니다."""
    try:
        result = await db.talents.delete_one({"_id": ObjectId(talent_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Talent not found")
        return {"message": "Talent deleted successfully"}
    except Exception:
        raise HTTPException(status_code=404, detail="Talent not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 