import os
import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import List, Optional
import locale
import codecs
from datetime import datetime
from chatbot import chatbot_router, langgraph_router

# Python 환경 인코딩 설정
# 시스템 기본 인코딩을 UTF-8로 설정
if sys.platform.startswith('win'):
    # Windows 환경에서 UTF-8 강제 설정
    os.environ['PYTHONIOENCODING'] = 'utf-8'
    # 콘솔 출력 인코딩 설정
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.detach())

# FastAPI 앱 생성
app = FastAPI(title="AI 채용 관리 시스템 API", version="1.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 한글 인코딩을 위한 미들웨어
@app.middleware("http")
async def add_charset_header(request, call_next):
    response = await call_next(request)
    
    # 모든 JSON 응답에 UTF-8 인코딩 명시
    if response.headers.get("content-type", "").startswith("application/json"):
        response.headers["content-type"] = "application/json; charset=utf-8"
    
    # 텍스트 응답에도 UTF-8 인코딩 명시
    elif response.headers.get("content-type", "").startswith("text/"):
        if "charset" not in response.headers.get("content-type", ""):
            current_content_type = response.headers.get("content-type", "")
            response.headers["content-type"] = f"{current_content_type}; charset=utf-8"
    
    return response

# 라우터 등록
app.include_router(chatbot_router, prefix="/api/chatbot", tags=["chatbot"])
app.include_router(langgraph_router, prefix="/api/langgraph", tags=["langgraph"])

# MongoDB 연결
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/hireme")
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
    resume_id: Optional[str] = None
    name: str
    position: str
    department: str
    experience: str
    skills: str
    growthBackground: str
    motivation: str
    careerHistory: str
    analysisScore: int = 0
    analysisResult: str = ""
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

# API 라우트들
@app.get("/")
async def root():
    return {"message": "AI 채용 관리 시스템 API가 실행 중입니다."}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "서버가 정상적으로 작동 중입니다."}

# 사용자 관련 API
@app.get("/api/users", response_model=List[User])
async def get_users():
    users = await db.users.find().to_list(1000)
    # MongoDB의 _id를 id로 변환
    for user in users:
        user["id"] = str(user["_id"])
        del user["_id"]
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
    # MongoDB의 _id를 id로 변환
    for resume in resumes:
        resume["id"] = str(resume["_id"])
        del resume["_id"]
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
    # MongoDB의 _id를 id로 변환
    for interview in interviews:
        interview["id"] = str(interview["_id"])
        del interview["_id"]
    return [Interview(**interview) for interview in interviews]

@app.post("/api/interviews", response_model=Interview)
async def create_interview(interview: Interview):
    interview_dict = interview.dict()
    interview_dict["created_at"] = datetime.now()
    result = await db.interviews.insert_one(interview_dict)
    interview_dict["id"] = str(result.inserted_id)
    return Interview(**interview_dict)

# 지원자 관련 API
@app.get("/api/applicants")
async def get_applicants(skip: int = 0, limit: int = 20):
    try:
        # 페이징으로 이력서(지원자) 목록 조회
        applicants = await db.resumes.find().skip(skip).limit(limit).to_list(limit)
        
        # MongoDB의 _id를 id로 변환 및 ObjectId 필드들을 문자열로 변환
        for applicant in applicants:
            applicant["id"] = str(applicant["_id"])
            del applicant["_id"]
            # resume_id가 ObjectId인 경우 문자열로 변환
            if "resume_id" in applicant and applicant["resume_id"]:
                applicant["resume_id"] = str(applicant["resume_id"])
        
        # 총 지원자 수
        total_count = await db.resumes.count_documents({})
        
        return {
            "applicants": [Resume(**applicant) for applicant in applicants],
            "total_count": total_count,
            "skip": skip,
            "limit": limit,
            "has_more": (skip + limit) < total_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"지원자 목록 조회 실패: {str(e)}")

# 지원자 통계 API
@app.get("/api/applicants/stats/overview")
async def get_applicant_stats():
    try:
        # 총 지원자 수 (resumes 컬렉션 기준)
        total_applicants = await db.resumes.count_documents({})
        
        # 상태별 지원자 수
        pending_count = await db.resumes.count_documents({"status": "pending"})
        approved_count = await db.resumes.count_documents({"status": "approved"})
        rejected_count = await db.resumes.count_documents({"status": "rejected"})
        
        # 최근 30일간 지원자 수
        thirty_days_ago = datetime.now().replace(day=datetime.now().day-30) if datetime.now().day > 30 else datetime.now().replace(month=datetime.now().month-1, day=1)
        recent_applicants = await db.resumes.count_documents({
            "created_at": {"$gte": thirty_days_ago}
        })
        
        return {
            "total_applicants": total_applicants,
            "status_breakdown": {
                "pending": pending_count,
                "approved": approved_count,
                "rejected": rejected_count
            },
            "recent_applicants_30_days": recent_applicants,
            "success_rate": round((approved_count / total_applicants * 100) if total_applicants > 0 else 0, 2)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"지원자 통계 조회 실패: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 