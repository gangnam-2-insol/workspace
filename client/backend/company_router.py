from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime, timedelta
import secrets
import string
import os
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from auth_router import get_current_user
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

company_router = APIRouter()

# MongoDB 연결
DATABASE_URL = os.getenv("DATABASE_URL", "mongodb://admin:password123@mongodb:27017/hireme?authSource=admin")
client = AsyncIOMotorClient(DATABASE_URL)
db = client.hireme

# Pydantic 모델
class CompanyInfo(BaseModel):
    id: str = None
    name: str
    description: str = ""
    industry: str = ""
    size: str = ""
    website: str = ""
    address: str = ""
    created_at: datetime = None
    updated_at: datetime = None

class CompanyResponse(BaseModel):
    status: str
    message: str
    company: CompanyInfo = None
    companies: list[CompanyInfo] = None

class InviteUserRequest(BaseModel):
    email: str
    name: str
    role: str = "member"
    department: str = ""
    position: str = ""

class InviteResponse(BaseModel):
    status: str
    message: str
    invite_code: str = None
    invite_url: str = None

# 회사 접근 권한 확인
def require_company_access():
    """회사 접근 권한 확인을 위한 의존성"""
    async def company_dependency(current_user: dict = Depends(get_current_user)):
        if current_user.get("userType") != "recruiter":
            raise HTTPException(status_code=403, detail="채용담당자만 접근할 수 있습니다.")
        
        if not current_user.get("company"):
            raise HTTPException(status_code=403, detail="회사 정보가 필요합니다.")
        
        return current_user
    return company_dependency

# 회사 관리자 권한 확인
def require_company_admin():
    """회사 관리자 권한 확인을 위한 의존성"""
    async def admin_dependency(current_user: dict = Depends(require_company_access())):
        if current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="회사 관리자 권한이 필요합니다.")
        return current_user
    return admin_dependency

# 초대 코드 생성
def generate_invite_code(length: int = 8) -> str:
    """초대 코드를 생성합니다."""
    characters = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))

# 회사 생성
@company_router.post("/create", response_model=CompanyResponse)
async def create_company(
    company_data: CompanyInfo,
    current_user: dict = Depends(get_current_user)
):
    """새로운 회사를 생성합니다."""
    try:
        if current_user.get("userType") != "recruiter":
            raise HTTPException(status_code=403, detail="채용담당자만 회사를 생성할 수 있습니다.")
        
        # 회사명 중복 확인
        existing_company = await db.companies.find_one({"name": company_data.name})
        if existing_company:
            raise HTTPException(status_code=400, detail="이미 존재하는 회사명입니다.")
        
        # 회사 데이터 생성
        company_doc = {
            "name": company_data.name,
            "description": company_data.description,
            "industry": company_data.industry,
            "size": company_data.size,
            "website": company_data.website,
            "address": company_data.address,
            "created_by": ObjectId(current_user["_id"]),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # 회사 저장
        result = await db.companies.insert_one(company_doc)
        
        # 사용자 정보 업데이트
        await db.users.update_one(
            {"_id": ObjectId(current_user["_id"])},
            {
                "$set": {
                    "company": company_data.name,
                    "role": "admin",
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # 응답 데이터 생성
        company_info = CompanyInfo(
            id=str(result.inserted_id),
            name=company_data.name,
            description=company_data.description,
            industry=company_data.industry,
            size=company_data.size,
            website=company_data.website,
            address=company_data.address,
            created_at=company_doc["created_at"],
            updated_at=company_doc["updated_at"]
        )
        
        return CompanyResponse(
            status="success",
            message="회사가 성공적으로 생성되었습니다.",
            company=company_info
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"회사 생성 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="회사 생성 중 오류가 발생했습니다.")

# 회사 정보 조회
@company_router.get("/info", response_model=CompanyResponse)
async def get_company_info(current_user: dict = Depends(require_company_access())):
    """현재 사용자의 회사 정보를 조회합니다."""
    try:
        company_name = current_user.get("company")
        
        # 회사 정보 조회
        company = await db.companies.find_one({"name": company_name})
        
        if not company:
            raise HTTPException(status_code=404, detail="회사 정보를 찾을 수 없습니다.")
        
        # 응답 데이터 생성
        company_info = CompanyInfo(
            id=str(company["_id"]),
            name=company["name"],
            description=company["description"],
            industry=company["industry"],
            size=company["size"],
            website=company["website"],
            address=company["address"],
            created_at=company["created_at"],
            updated_at=company["updated_at"]
        )
        
        return CompanyResponse(
            status="success",
            message="회사 정보를 성공적으로 조회했습니다.",
            company=company_info
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"회사 정보 조회 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="회사 정보 조회 중 오류가 발생했습니다.")

# 회사 정보 업데이트
@company_router.put("/update", response_model=CompanyResponse)
async def update_company(
    company_data: CompanyInfo,
    current_user: dict = Depends(require_company_admin())
):
    """회사 정보를 업데이트합니다."""
    try:
        company_name = current_user.get("company")
        
        # 업데이트 데이터
        update_data = {
            "description": company_data.description,
            "industry": company_data.industry,
            "size": company_data.size,
            "website": company_data.website,
            "address": company_data.address,
            "updated_at": datetime.utcnow()
        }
        
        # 회사 정보 업데이트
        result = await db.companies.update_one(
            {"name": company_name},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="회사 정보를 찾을 수 없습니다.")
        
        # 업데이트된 회사 정보 조회
        updated_company = await db.companies.find_one({"name": company_name})
        
        # 응답 데이터 생성
        company_info = CompanyInfo(
            id=str(updated_company["_id"]),
            name=updated_company["name"],
            description=updated_company["description"],
            industry=updated_company["industry"],
            size=updated_company["size"],
            website=updated_company["website"],
            address=updated_company["address"],
            created_at=updated_company["created_at"],
            updated_at=updated_company["updated_at"]
        )
        
        return CompanyResponse(
            status="success",
            message="회사 정보가 성공적으로 업데이트되었습니다.",
            company=company_info
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"회사 정보 업데이트 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="회사 정보 업데이트 중 오류가 발생했습니다.")

# 회사 사용자 목록 조회
@company_router.get("/users")
async def get_company_users(current_user: dict = Depends(require_company_access())):
    """회사의 사용자 목록을 조회합니다."""
    try:
        company_name = current_user.get("company")
        
        # 회사 사용자 조회
        users = await db.users.find({
            "company": company_name,
            "userType": "recruiter",
            "isActive": True
        }).to_list(length=100)
        
        # 응답 데이터 생성
        user_list = []
        for user in users:
            user_list.append({
                "id": str(user["_id"]),
                "name": user["name"],
                "email": user["email"],
                "userType": user["userType"],
                "role": user.get("role", "member"),
                "department": user.get("department", ""),
                "position": user.get("position", ""),
                "createdAt": user["createdAt"]
            })
        
        return {
            "status": "success",
            "message": f"총 {len(user_list)}명의 사용자를 찾았습니다.",
            "users": user_list
        }
        
    except Exception as e:
        logger.error(f"회사 사용자 목록 조회 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="사용자 목록 조회 중 오류가 발생했습니다.")

# 회사 통계 조회
@company_router.get("/stats")
async def get_company_stats(current_user: dict = Depends(require_company_access())):
    """회사의 통계 정보를 조회합니다."""
    try:
        company_name = current_user.get("company")
        
        # 사용자 수
        user_count = await db.users.count_documents({
            "company": company_name,
            "userType": "recruiter",
            "isActive": True
        })
        
        # 채용공고 수
        job_count = await db.jobs.count_documents({
            "company": company_name,
            "isActive": True
        })
        
        # 지원자 수
        application_count = await db.applications.count_documents({
            "company": company_name
        })
        
        # 문서 수
        document_count = await db.documents.count_documents({
            "company": company_name,
            "is_active": True
        })
        
        return {
            "status": "success",
            "stats": {
                "user_count": user_count,
                "job_count": job_count,
                "application_count": application_count,
                "document_count": document_count
            }
        }
        
    except Exception as e:
        logger.error(f"회사 통계 조회 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="통계 조회 중 오류가 발생했습니다.")

# ===== 회사 내부 사용자 관리 =====

# 사용자 초대
@company_router.post("/invite", response_model=InviteResponse)
async def invite_user(
    invite_data: InviteUserRequest,
    current_user: dict = Depends(require_company_admin())
):
    """새로운 사용자를 회사에 초대합니다."""
    try:
        company_name = current_user.get("company")
        
        # 이메일 중복 확인
        existing_user = await db.users.find_one({"email": invite_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다.")
        
        # 초대 코드 생성
        invite_code = generate_invite_code()
        
        # 초대 데이터 생성
        invite_doc = {
            "code": invite_code,
            "email": invite_data.email,
            "name": invite_data.name,
            "role": invite_data.role,
            "department": invite_data.department,
            "position": invite_data.position,
            "company": company_name,
            "invited_by": ObjectId(current_user["_id"]),
            "isUsed": False,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(days=7)
        }
        
        # 초대 저장
        await db.invites.insert_one(invite_doc)
        
        # 초대 URL 생성
        invite_url = f"http://localhost:3000/join?code={invite_code}"
        
        return InviteResponse(
            status="success",
            message="사용자 초대가 성공적으로 생성되었습니다.",
            invite_code=invite_code,
            invite_url=invite_url
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"사용자 초대 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="사용자 초대 중 오류가 발생했습니다.")

# 초대 목록 조회
@company_router.get("/invites")
async def get_invites(current_user: dict = Depends(require_company_admin())):
    """회사의 초대 목록을 조회합니다."""
    try:
        company_name = current_user.get("company")
        
        # 초대 목록 조회
        invites = await db.invites.find({
            "company": company_name
        }).sort("created_at", -1).to_list(length=100)
        
        # 응답 데이터 생성
        invite_list = []
        for invite in invites:
            invite_list.append({
                "id": str(invite["_id"]),
                "code": invite["code"],
                "email": invite["email"],
                "name": invite["name"],
                "role": invite["role"],
                "department": invite.get("department", ""),
                "position": invite.get("position", ""),
                "isUsed": invite["isUsed"],
                "created_at": invite["created_at"],
                "expires_at": invite["expires_at"],
                "used_at": invite.get("used_at"),
                "used_by": invite.get("used_by")
            })
        
        return {
            "status": "success",
            "message": f"총 {len(invite_list)}개의 초대를 찾았습니다.",
            "invites": invite_list
        }
        
    except Exception as e:
        logger.error(f"초대 목록 조회 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="초대 목록 조회 중 오류가 발생했습니다.")

# 초대 취소
@company_router.delete("/invites/{invite_id}")
async def cancel_invite(
    invite_id: str,
    current_user: dict = Depends(require_company_admin())
):
    """초대를 취소합니다."""
    try:
        company_name = current_user.get("company")
        
        # 초대 조회
        invite = await db.invites.find_one({
            "_id": ObjectId(invite_id),
            "company": company_name
        })
        
        if not invite:
            raise HTTPException(status_code=404, detail="초대를 찾을 수 없습니다.")
        
        if invite["isUsed"]:
            raise HTTPException(status_code=400, detail="이미 사용된 초대는 취소할 수 없습니다.")
        
        # 초대 삭제
        await db.invites.delete_one({"_id": ObjectId(invite_id)})
        
        return {
            "status": "success",
            "message": "초대가 성공적으로 취소되었습니다."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"초대 취소 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="초대 취소 중 오류가 발생했습니다.")

# 사용자 역할 변경
@company_router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role: str,
    current_user: dict = Depends(require_company_admin())
):
    """사용자의 역할을 변경합니다."""
    try:
        company_name = current_user.get("company")
        
        # 유효한 역할인지 확인
        valid_roles = ["admin", "manager", "member"]
        if role not in valid_roles:
            raise HTTPException(status_code=400, detail="유효하지 않은 역할입니다.")
        
        # 사용자 조회
        user = await db.users.find_one({
            "_id": ObjectId(user_id),
            "company": company_name,
            "userType": "recruiter",
            "isActive": True
        })
        
        if not user:
            raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
        
        # 자신의 역할을 변경하려는 경우
        if str(user["_id"]) == str(current_user["_id"]):
            raise HTTPException(status_code=400, detail="자신의 역할은 변경할 수 없습니다.")
        
        # 역할 업데이트
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"role": role, "updated_at": datetime.utcnow()}}
        )
        
        return {
            "status": "success",
            "message": f"사용자의 역할이 '{role}'로 변경되었습니다."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"사용자 역할 변경 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="사용자 역할 변경 중 오류가 발생했습니다.")

# 사용자 제거
@company_router.delete("/users/{user_id}")
async def remove_user(
    user_id: str,
    current_user: dict = Depends(require_company_admin())
):
    """사용자를 회사에서 제거합니다."""
    try:
        company_name = current_user.get("company")
        
        # 사용자 조회
        user = await db.users.find_one({
            "_id": ObjectId(user_id),
            "company": company_name,
            "userType": "recruiter",
            "isActive": True
        })
        
        if not user:
            raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
        
        # 자신을 제거하려는 경우
        if str(user["_id"]) == str(current_user["_id"]):
            raise HTTPException(status_code=400, detail="자신을 제거할 수 없습니다.")
        
        # 사용자 비활성화
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "isActive": False,
                    "removed_at": datetime.utcnow(),
                    "removed_by": ObjectId(current_user["_id"])
                }
            }
        )
        
        return {
            "status": "success",
            "message": "사용자가 성공적으로 제거되었습니다."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"사용자 제거 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="사용자 제거 중 오류가 발생했습니다.") 