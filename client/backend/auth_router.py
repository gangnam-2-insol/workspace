from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import jwt
import bcrypt
import os
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

auth_router = APIRouter()
security = HTTPBearer()

# JWT 설정
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-here")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# MongoDB 연결
DATABASE_URL = os.getenv("DATABASE_URL", "mongodb://admin:password123@mongodb:27017/hireme?authSource=admin")
client = AsyncIOMotorClient(DATABASE_URL)
db = client.hireme

# Pydantic 모델
class EmailLoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    user_type: str
    company: str = ""

class InviteRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    invite_code: str

class AuthResponse(BaseModel):
    status: str
    message: str
    token: str = None
    user: dict = None

# JWT 토큰 생성
def create_jwt_token(data: dict):
    expiration = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode = data.copy()
    to_encode.update({"exp": expiration})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

# JWT 토큰 검증
def verify_jwt_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="토큰이 만료되었습니다.")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")

# 현재 사용자 가져오기
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_jwt_token(token)
    user_id = payload.get("user_id")
    
    if user_id is None:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise HTTPException(status_code=401, detail="사용자를 찾을 수 없습니다.")
    
    return user

# 이메일 로그인
@auth_router.post("/email-login", response_model=AuthResponse)
async def email_login(login_data: EmailLoginRequest):
    """이메일과 비밀번호로 로그인합니다."""
    try:
        # 사용자 찾기
        user = await db.users.find_one({"email": login_data.email, "isActive": True})
        if not user:
            raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")
        
        # 비밀번호 검증
        if not bcrypt.checkpw(login_data.password.encode('utf-8'), user['password'].encode('utf-8')):
            raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")
        
        # JWT 토큰 생성
        token_data = {
            "user_id": str(user["_id"]),
            "email": user["email"],
            "user_type": user["userType"]
        }
        token = create_jwt_token(token_data)
        
        # 사용자 정보 (비밀번호 제외)
        user_info = {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "userType": user["userType"],
            "company": user.get("company", ""),
            "role": user.get("role", "member")
        }
        
        return AuthResponse(
            status="success",
            message="로그인에 성공했습니다.",
            token=token,
            user=user_info
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"로그인 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="로그인 중 오류가 발생했습니다.")

# 이메일 회원가입
@auth_router.post("/email-register", response_model=AuthResponse)
async def email_register(register_data: RegisterRequest):
    """이메일과 비밀번호로 회원가입합니다."""
    try:
        logger.info(f"회원가입 요청 데이터: {register_data}")
        
        # 이메일 중복 확인
        existing_user = await db.users.find_one({"email": register_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다.")
        
        # 비밀번호 해시화
        hashed_password = bcrypt.hashpw(register_data.password.encode('utf-8'), bcrypt.gensalt())
        
        # 사용자 데이터 생성
        user_data = {
            "email": register_data.email,
            "password": hashed_password.decode('utf-8'),
            "name": register_data.name,
            "userType": register_data.user_type,
            "company": register_data.company,
            "role": "admin" if register_data.user_type == "recruiter" else "member",
            "isActive": True,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        # 사용자 저장
        result = await db.users.insert_one(user_data)
        
        # JWT 토큰 생성
        token_data = {
            "user_id": str(result.inserted_id),
            "email": register_data.email,
            "user_type": register_data.user_type
        }
        token = create_jwt_token(token_data)
        
        # 사용자 정보 (비밀번호 제외)
        user_info = {
            "id": str(result.inserted_id),
            "email": register_data.email,
            "name": register_data.name,
            "userType": register_data.user_type,
            "company": register_data.company,
            "role": user_data["role"]
        }
        
        return AuthResponse(
            status="success",
            message="회원가입에 성공했습니다.",
            token=token,
            user=user_info
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"회원가입 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="회원가입 중 오류가 발생했습니다.")

# 초대 코드 기반 회원가입
@auth_router.post("/invite-register", response_model=AuthResponse)
async def invite_register(register_data: InviteRegisterRequest):
    """초대 코드를 사용한 회원가입을 진행합니다."""
    try:
        # 초대 코드 검증
        invite = await db.invites.find_one({
            "code": register_data.invite_code,
            "isUsed": False,
            "expiresAt": {"$gt": datetime.utcnow()}
        })
        
        if not invite:
            raise HTTPException(status_code=400, detail="유효하지 않거나 만료된 초대 코드입니다.")
        
        # 이메일 중복 확인
        existing_user = await db.users.find_one({"email": register_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다.")
        
        # 비밀번호 해시화
        hashed_password = bcrypt.hashpw(register_data.password.encode('utf-8'), bcrypt.gensalt())
        
        # 사용자 데이터 생성
        user_data = {
            "email": register_data.email,
            "password": hashed_password.decode('utf-8'),
            "name": register_data.name,
            "userType": "recruiter",
            "company": invite["company"],
            "role": invite["role"],
            "department": invite.get("department", ""),
            "position": invite.get("position", ""),
            "isActive": True,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        # 사용자 저장
        result = await db.users.insert_one(user_data)
        
        # 초대 코드 사용 처리
        await db.invites.update_one(
            {"_id": invite["_id"]},
            {"$set": {"isUsed": True, "usedAt": datetime.utcnow(), "usedBy": str(result.inserted_id)}}
        )
        
        # JWT 토큰 생성
        token_data = {
            "user_id": str(result.inserted_id),
            "email": register_data.email,
            "user_type": "recruiter"
        }
        token = create_jwt_token(token_data)
        
        # 사용자 정보
        user_info = {
            "id": str(result.inserted_id),
            "email": register_data.email,
            "name": register_data.name,
            "userType": "recruiter",
            "company": invite["company"],
            "role": invite["role"]
        }
        
        return AuthResponse(
            status="success",
            message="초대 코드를 사용한 회원가입에 성공했습니다.",
            token=token,
            user=user_info
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"초대 회원가입 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="회원가입 중 오류가 발생했습니다.")

# 초대 코드 검증
@auth_router.get("/verify-invite/{invite_code}")
async def verify_invite(invite_code: str):
    """초대 코드를 검증합니다."""
    try:
        invite = await db.invites.find_one({
            "code": invite_code,
            "isUsed": False,
            "expiresAt": {"$gt": datetime.utcnow()}
        })
        
        if not invite:
            return {
                "status": "error",
                "message": "유효하지 않거나 만료된 초대 코드입니다.",
                "valid": False
            }
        
        return {
            "status": "success",
            "message": "유효한 초대 코드입니다.",
            "valid": True,
            "invite": {
                "email": invite["email"],
                "name": invite["name"],
                "role": invite["role"],
                "department": invite.get("department", ""),
                "position": invite.get("position", ""),
                "company": invite["company"]
            }
        }
        
    except Exception as e:
        logger.error(f"초대 코드 검증 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="초대 코드 검증 중 오류가 발생했습니다.")

# 현재 사용자 정보 조회
@auth_router.get("/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """현재 로그인한 사용자의 정보를 조회합니다."""
    return {
        "status": "success",
        "user": {
            "id": str(current_user["_id"]),
            "email": current_user["email"],
            "name": current_user["name"],
            "userType": current_user["userType"],
            "company": current_user.get("company", ""),
            "role": current_user.get("role", "member")
        }
    } 