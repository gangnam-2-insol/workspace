from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel
from datetime import datetime
import os
import shutil
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from auth_router import get_current_user
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

documents_router = APIRouter()

# MongoDB 연결
DATABASE_URL = os.getenv("DATABASE_URL", "mongodb://admin:password123@mongodb:27017/hireme?authSource=admin")
client = AsyncIOMotorClient(DATABASE_URL)
db = client.hireme

# 업로드 디렉토리 설정
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 허용된 파일 타입
ALLOWED_EXTENSIONS = {
    "resume": [".pdf", ".doc", ".docx"],
    "cover_letter": [".pdf", ".doc", ".docx"],
    "portfolio": [".pdf", ".doc", ".docx", ".zip", ".rar"]
}

# 최대 파일 크기 (10MB)
MAX_FILE_SIZE = 10 * 1024 * 1024

# Pydantic 모델
class DocumentInfo(BaseModel):
    id: str
    title: str
    description: str
    file_type: str
    file_name: str
    file_size: int
    uploaded_at: datetime

class DocumentResponse(BaseModel):
    status: str
    message: str
    document: DocumentInfo = None
    documents: list[DocumentInfo] = None

# 파일 검증
def validate_file(file: UploadFile, file_type: str):
    """파일 타입과 크기를 검증합니다."""
    if not file:
        raise HTTPException(status_code=400, detail="파일이 필요합니다.")
    
    # 파일 크기 검증
    if file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="파일 크기가 너무 큽니다. (최대 10MB)")
    
    # 파일 확장자 검증
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in ALLOWED_EXTENSIONS.get(file_type, []):
        allowed_extensions = ", ".join(ALLOWED_EXTENSIONS.get(file_type, []))
        raise HTTPException(
            status_code=400, 
            detail=f"지원하지 않는 파일 형식입니다. 허용된 형식: {allowed_extensions}"
        )

# 문서 업로드
@documents_router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    file_type: str = Form(...),
    title: str = Form(...),
    description: str = Form(""),
    current_user: dict = Depends(get_current_user)
):
    """문서를 업로드합니다."""
    try:
        # 파일 타입 검증
        if file_type not in ["resume", "cover_letter", "portfolio"]:
            raise HTTPException(status_code=400, detail="유효하지 않은 파일 타입입니다.")
        
        # 파일 검증
        validate_file(file, file_type)
        
        user_id = str(current_user['_id'])
        
        # 사용자별 업로드 디렉토리 생성
        user_upload_dir = os.path.join(UPLOAD_DIR, user_id, file_type)
        os.makedirs(user_upload_dir, exist_ok=True)
        
        # 파일 저장
        file_path = os.path.join(user_upload_dir, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 문서 데이터 생성
        document_data = {
            "userId": ObjectId(user_id),
            "title": title,
            "description": description,
            "file_type": file_type,
            "file_name": file.filename,
            "file_path": file_path,
            "file_size": file.size,
            "uploaded_at": datetime.utcnow(),
            "is_active": True
        }
        
        # 회사 정보 추가 (채용담당자인 경우)
        if current_user.get("userType") == "recruiter" and current_user.get("company"):
            document_data["company"] = current_user.get("company")
        
        # 데이터베이스에 저장
        result = await db.documents.insert_one(document_data)
        
        # 응답 데이터 생성
        document_info = DocumentInfo(
            id=str(result.inserted_id),
            title=title,
            description=description,
            file_type=file_type,
            file_name=file.filename,
            file_size=file.size,
            uploaded_at=document_data["uploaded_at"]
        )
        
        return DocumentResponse(
            status="success",
            message="문서가 성공적으로 업로드되었습니다.",
            document=document_info
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"문서 업로드 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="문서 업로드 중 오류가 발생했습니다.")

# 사용자 문서 목록 조회
@documents_router.get("/list", response_model=DocumentResponse)
async def get_user_documents(
    file_type: str = None,
    current_user: dict = Depends(get_current_user)
):
    """사용자의 문서 목록을 조회합니다."""
    try:
        user_id = str(current_user['_id'])
        
        # 쿼리 조건 설정
        query = {"userId": ObjectId(user_id), "is_active": True}
        
        # 파일 타입 필터링
        if file_type:
            if file_type not in ["resume", "cover_letter", "portfolio"]:
                raise HTTPException(status_code=400, detail="유효하지 않은 파일 타입입니다.")
            query["file_type"] = file_type
        
        # 회사 필터링 (채용담당자인 경우)
        if current_user.get("userType") == "recruiter" and current_user.get("company"):
            query["company"] = current_user.get("company")
        
        # 문서 조회
        documents = await db.documents.find(query).sort("uploaded_at", -1).to_list(length=100)
        
        # 응답 데이터 생성
        document_list = []
        for doc in documents:
            document_info = DocumentInfo(
                id=str(doc["_id"]),
                title=doc["title"],
                description=doc["description"],
                file_type=doc["file_type"],
                file_name=doc["file_name"],
                file_size=doc["file_size"],
                uploaded_at=doc["uploaded_at"]
            )
            document_list.append(document_info)
        
        return DocumentResponse(
            status="success",
            message=f"총 {len(document_list)}개의 문서를 찾았습니다.",
            documents=document_list
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"문서 목록 조회 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="문서 목록 조회 중 오류가 발생했습니다.")

# 개별 문서 조회
@documents_router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """개별 문서 정보를 조회합니다."""
    try:
        user_id = str(current_user['_id'])
        
        # 쿼리 조건 설정
        query = {
            "_id": ObjectId(document_id),
            "userId": ObjectId(user_id),
            "is_active": True
        }
        
        # 회사 필터링 (채용담당자인 경우)
        if current_user.get("userType") == "recruiter" and current_user.get("company"):
            query["company"] = current_user.get("company")
        
        # 문서 조회
        document = await db.documents.find_one(query)
        
        if not document:
            raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")
        
        # 응답 데이터 생성
        document_info = DocumentInfo(
            id=str(document["_id"]),
            title=document["title"],
            description=document["description"],
            file_type=document["file_type"],
            file_name=document["file_name"],
            file_size=document["file_size"],
            uploaded_at=document["uploaded_at"]
        )
        
        return DocumentResponse(
            status="success",
            message="문서 정보를 성공적으로 조회했습니다.",
            document=document_info
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"문서 조회 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="문서 조회 중 오류가 발생했습니다.")

# 문서 다운로드
@documents_router.get("/download/{document_id}")
async def download_document(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """문서를 다운로드합니다."""
    try:
        user_id = str(current_user['_id'])
        
        # 쿼리 조건 설정
        query = {
            "_id": ObjectId(document_id),
            "userId": ObjectId(user_id),
            "is_active": True
        }
        
        # 회사 필터링 (채용담당자인 경우)
        if current_user.get("userType") == "recruiter" and current_user.get("company"):
            query["company"] = current_user.get("company")
        
        # 문서 조회
        document = await db.documents.find_one(query)
        
        if not document:
            raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")
        
        # 파일 존재 확인
        file_path = document["file_path"]
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
        
        # 파일 다운로드
        return FileResponse(
            path=file_path,
            filename=document["file_name"],
            media_type="application/octet-stream"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"문서 다운로드 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="문서 다운로드 중 오류가 발생했습니다.")

# 문서 삭제
@documents_router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """문서를 삭제합니다."""
    try:
        user_id = str(current_user['_id'])
        
        # 쿼리 조건 설정
        query = {
            "_id": ObjectId(document_id),
            "userId": ObjectId(user_id),
            "is_active": True
        }
        
        # 회사 필터링 (채용담당자인 경우)
        if current_user.get("userType") == "recruiter" and current_user.get("company"):
            query["company"] = current_user.get("company")
        
        # 문서 조회
        document = await db.documents.find_one(query)
        
        if not document:
            raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")
        
        # 파일 삭제
        file_path = document["file_path"]
        if os.path.exists(file_path):
            os.remove(file_path)
        
        # 데이터베이스에서 삭제 (소프트 삭제)
        await db.documents.update_one(
            {"_id": ObjectId(document_id)},
            {"$set": {"is_active": False, "deleted_at": datetime.utcnow()}}
        )
        
        return {
            "status": "success",
            "message": "문서가 성공적으로 삭제되었습니다."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"문서 삭제 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="문서 삭제 중 오류가 발생했습니다.")

# 문서 통계
@documents_router.get("/stats/summary")
async def get_document_stats(current_user: dict = Depends(get_current_user)):
    """사용자의 문서 통계를 조회합니다."""
    try:
        user_id = str(current_user['_id'])
        
        # 쿼리 조건 설정
        query = {"userId": ObjectId(user_id), "is_active": True}
        
        # 회사 필터링 (채용담당자인 경우)
        if current_user.get("userType") == "recruiter" and current_user.get("company"):
            query["company"] = current_user.get("company")
        
        # 전체 문서 수
        total_documents = await db.documents.count_documents(query)
        
        # 파일 타입별 문서 수
        resume_count = await db.documents.count_documents({**query, "file_type": "resume"})
        cover_letter_count = await db.documents.count_documents({**query, "file_type": "cover_letter"})
        portfolio_count = await db.documents.count_documents({**query, "file_type": "portfolio"})
        
        # 전체 파일 크기
        pipeline = [
            {"$match": query},
            {"$group": {"_id": None, "total_size": {"$sum": "$file_size"}}}
        ]
        size_result = await db.documents.aggregate(pipeline).to_list(length=1)
        total_size = size_result[0]["total_size"] if size_result else 0
        
        return {
            "status": "success",
            "stats": {
                "total_documents": total_documents,
                "resume_count": resume_count,
                "cover_letter_count": cover_letter_count,
                "portfolio_count": portfolio_count,
                "total_size": total_size,
                "total_size_mb": round(total_size / (1024 * 1024), 2)
            }
        }
        
    except Exception as e:
        logger.error(f"문서 통계 조회 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="문서 통계 조회 중 오류가 발생했습니다.") 