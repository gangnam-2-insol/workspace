from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Form
from fastapi.responses import FileResponse
from typing import List, Optional
import os
import shutil
import uuid
from datetime import datetime
from pymongo import MongoClient
import jwt
from bson import ObjectId

router = APIRouter(prefix="/api/documents", tags=["documents"])

# MongoDB 연결
client = MongoClient("mongodb://localhost:27017/")
db = client["hireme"]
documents_collection = db["documents"]

# 업로드 디렉토리 설정
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# 지원하는 파일 형식
ALLOWED_EXTENSIONS = {
    "resume": [".pdf", ".doc", ".docx"],
    "portfolio": [".pdf", ".doc", ".docx", ".zip", ".rar"],
    "cover_letter": [".pdf", ".doc", ".docx", ".txt"]
}

def verify_token(authorization: str = Depends(lambda x: x.headers.get("Authorization"))):
    """JWT 토큰 검증"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.split(" ")[1]
    try:
        # 실제 환경에서는 환경변수에서 시크릿 키를 가져와야 함
        payload = jwt.decode(token, "your-secret-key", algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    file_type: str = Form(...),
    user_id: str = Form(...),
    token_payload: dict = Depends(verify_token)
):
    """문서 업로드"""
    try:
        # 파일 확장자 검증
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_type not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Invalid file type")
        
        if file_extension not in ALLOWED_EXTENSIONS[file_type]:
            raise HTTPException(status_code=400, detail=f"File extension not allowed for {file_type}")
        
        # 사용자별 디렉토리 생성
        user_upload_dir = os.path.join(UPLOAD_DIR, user_id, file_type)
        os.makedirs(user_upload_dir, exist_ok=True)
        
        # 파일명 생성 (중복 방지)
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(user_upload_dir, unique_filename)
        
        # 파일 저장
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 데이터베이스에 문서 정보 저장
        document_data = {
            "user_id": user_id,
            "file_type": file_type,
            "original_filename": file.filename,
            "stored_filename": unique_filename,
            "file_path": file_path,
            "file_size": os.path.getsize(file_path),
            "upload_date": datetime.utcnow(),
            "file_extension": file_extension
        }
        
        result = documents_collection.insert_one(document_data)
        document_data["_id"] = str(result.inserted_id)
        
        return {
            "message": "Document uploaded successfully",
            "document": document_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/list/{user_id}")
async def list_documents(
    user_id: str,
    file_type: Optional[str] = None,
    token_payload: dict = Depends(verify_token)
):
    """사용자의 문서 목록 조회"""
    try:
        query = {"user_id": user_id}
        if file_type:
            query["file_type"] = file_type
        
        documents = list(documents_collection.find(query))
        
        # ObjectId를 문자열로 변환
        for doc in documents:
            doc["_id"] = str(doc["_id"])
            doc["upload_date"] = doc["upload_date"].isoformat()
        
        return {"documents": documents}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve documents: {str(e)}")

@router.get("/download/{document_id}")
async def download_document(
    document_id: str,
    token_payload: dict = Depends(verify_token)
):
    """문서 다운로드"""
    try:
        document = documents_collection.find_one({"_id": ObjectId(document_id)})
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        file_path = document["file_path"]
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        return FileResponse(
            path=file_path,
            filename=document["original_filename"],
            media_type="application/octet-stream"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    token_payload: dict = Depends(verify_token)
):
    """문서 삭제"""
    try:
        document = documents_collection.find_one({"_id": ObjectId(document_id)})
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # 파일 삭제
        file_path = document["file_path"]
        if os.path.exists(file_path):
            os.remove(file_path)
        
        # 데이터베이스에서 삭제
        documents_collection.delete_one({"_id": ObjectId(document_id)})
        
        return {"message": "Document deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")

@router.get("/stats/{user_id}")
async def get_document_stats(
    user_id: str,
    token_payload: dict = Depends(verify_token)
):
    """사용자의 문서 통계"""
    try:
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$group": {
                "_id": "$file_type",
                "count": {"$sum": 1},
                "total_size": {"$sum": "$file_size"}
            }}
        ]
        
        stats = list(documents_collection.aggregate(pipeline))
        
        return {"stats": stats}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")
