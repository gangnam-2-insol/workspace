import asyncio
from typing import List, Dict, Any, Optional
from pymongo import MongoClient
from pymongo.collection import Collection
from bson import ObjectId
import chromadb
from sentence_transformers import SentenceTransformer
import numpy as np
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

class ResumeService:
    def __init__(self):
        """이력서 서비스 초기화"""
        # MongoDB 연결 (임시로 비활성화)
        try:
            self.mongo_client = MongoClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017/"))
            self.db = self.mongo_client.resume_db
            self.resume_collection: Collection = self.db.resumes
            self.mongodb_available = True
            print("✅ MongoDB 연결 성공")
        except Exception as e:
            print(f"⚠️ MongoDB 연결 실패: {e}")
            print("⚠️ MongoDB 없이 ChromaDB만으로 작동합니다.")
            self.mongodb_available = False
        
        # ChromaDB 클라이언트 초기화 (새로운 방식)
        self.chroma_client = chromadb.PersistentClient(path="./chroma_db")
        
        # Sentence Transformer 모델 초기화
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # 컬렉션 초기화
        self._init_collections()
    
    def _init_collections(self):
        """필요한 컬렉션들을 초기화합니다."""
        try:
            # ChromaDB 컬렉션 생성 또는 가져오기
            self.chroma_collection = self.chroma_client.get_or_create_collection(
                name="resume_embeddings",
                metadata={"hnsw:space": "cosine"}
            )
            print("✅ ChromaDB 컬렉션이 초기화되었습니다.")
        except Exception as e:
            print(f"❌ ChromaDB 컬렉션 초기화 실패: {e}")
            raise
    
    async def register_resume(self, resume_data: Dict[str, Any]) -> Dict[str, Any]:
        """이력서를 등록하고 유사한 이력서들을 반환합니다."""
        try:
            # 1. 이력서 텍스트 생성
            resume_text = self._create_resume_text(resume_data)
            
            # 2. 임베딩 생성
            embedding = self.embedding_model.encode(resume_text)
            
            # 3. 유사한 이력서들 먼저 찾기 (등록 전에 체크)
            similar_resumes = await self._find_similar_resumes_before_register(embedding)
            
            # 4. 유사도가 90% 이상인 이력서가 하나라도 있으면 등록 막기
            THRESHOLD = 0.9

            if any(resume["similarity_score"] >= THRESHOLD for resume in similar_resumes):
                return {
                    "success": False,
                    "message": f"유사도가 {int(THRESHOLD*100)}% 이상인 이력서가 이미 존재합니다. 등록이 차단되었습니다.",
                    "similar_resumes": similar_resumes,
                    "blocked": True
                }
            
            # 5. MongoDB에 이력서 저장
            resume_id = await self._save_to_mongodb(resume_data, embedding.tolist())
            
            # 6. ChromaDB에 임베딩 저장
            await self._save_to_chromadb(resume_id, embedding, resume_text)
            
            # 7. 최종 유사한 이력서들 찾기
            final_similar_resumes = await self._find_similar_resumes(resume_id, embedding)
            
            return {
                "success": True,
                "resume_id": resume_id,
                "message": "이력서가 성공적으로 등록되었습니다.",
                "similar_resumes": final_similar_resumes
            }
            
        except Exception as e:
            print(f"❌ 이력서 등록 실패: {e}")
            raise
    
    def _create_resume_text(self, resume_data: Dict[str, Any]) -> str:
        """이력서 데이터를 텍스트로 변환합니다."""
        text_parts = [
            f"이름: {resume_data.get('name', '')}",
            f"학력: {resume_data.get('education', '')}",
            f"경력: {resume_data.get('experience', '')}",
            f"기술스택: {resume_data.get('skills', '')}",
            f"프로젝트: {resume_data.get('projects', '')}",
            f"요약: {resume_data.get('summary', '')}"
        ]
        return " ".join(text_parts)
    
    async def _save_to_mongodb(self, resume_data: Dict[str, Any], embedding: List[float]) -> str:
        """MongoDB에 이력서를 저장합니다."""
        if not self.mongodb_available:
            # MongoDB가 없으면 임시 ID 생성
            import uuid
            temp_id = str(uuid.uuid4())
            print(f"⚠️ MongoDB 없음 - 임시 ID 생성: {temp_id}")
            return temp_id
            
        try:
            document = {
                **resume_data,
                "embedding": embedding,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            result = self.resume_collection.insert_one(document)
            return str(result.inserted_id)
            
        except Exception as e:
            print(f"❌ MongoDB 저장 실패: {e}")
            raise
    
    async def _save_to_chromadb(self, resume_id: str, embedding: np.ndarray, text: str):
        """ChromaDB에 임베딩을 저장합니다."""
        try:
            self.chroma_collection.add(
                embeddings=[embedding.tolist()],
                documents=[text],
                metadatas=[{"resume_id": resume_id}],
                ids=[resume_id]
            )
            print(f"✅ ChromaDB에 임베딩 저장 완료: {resume_id}")
            
        except Exception as e:
            print(f"❌ ChromaDB 저장 실패: {e}")
            raise
    
    async def _find_similar_resumes_before_register(self, embedding: np.ndarray, limit: int = 5) -> List[Dict[str, Any]]:
        """등록 전에 유사한 이력서들을 찾습니다."""
        try:
            # ChromaDB에서 유사한 임베딩 검색
            results = self.chroma_collection.query(
                query_embeddings=[embedding.tolist()],
                n_results=limit,
                include=["metadatas", "distances"]
            )
            
            similar_resumes = []
            
            for i, (metadata, distance) in enumerate(zip(results['metadatas'][0], results['distances'][0])):
                resume_id = metadata['resume_id']
                
                # MongoDB에서 이력서 데이터 가져오기
                resume_data = await self.get_resume(resume_id)
                if resume_data:
                    similarity_score = 1 - distance  # 거리를 유사도로 변환
                    similar_resumes.append({
                        "resume_id": resume_id,
                        "similarity_score": round(similarity_score, 4),
                        "resume_data": resume_data
                    })
            
            # 유사도가 가장 높은 이력서만 반환 (최대 1개)
            if similar_resumes:
                # 유사도 기준으로 정렬하고 가장 높은 것만 반환
                similar_resumes.sort(key=lambda x: x['similarity_score'], reverse=True)
                return [similar_resumes[0]]  # 가장 유사도가 높은 이력서만 반환
            
            return []
            
        except Exception as e:
            print(f"❌ 유사 이력서 검색 실패: {e}")
            return []

    async def _find_similar_resumes(self, current_resume_id: str, embedding: np.ndarray, limit: int = 5) -> List[Dict[str, Any]]:
        """유사한 이력서들을 찾습니다."""
        try:
            # ChromaDB에서 유사한 임베딩 검색
            results = self.chroma_collection.query(
                query_embeddings=[embedding.tolist()],
                n_results=limit + 1,  # 현재 이력서 포함
                include=["metadatas", "distances"]
            )
            
            similar_resumes = []
            
            for i, (metadata, distance) in enumerate(zip(results['metadatas'][0], results['distances'][0])):
                resume_id = metadata['resume_id']
                
                # 현재 이력서는 제외
                if resume_id == current_resume_id:
                    continue
                
                # MongoDB에서 이력서 데이터 가져오기
                resume_data = await self.get_resume(resume_id)
                if resume_data:
                    similarity_score = 1 - distance  # 거리를 유사도로 변환
                    similar_resumes.append({
                        "resume_id": resume_id,
                        "similarity_score": round(similarity_score, 4),
                        "resume_data": resume_data
                    })
            
            # 유사도가 가장 높은 이력서만 반환 (최대 1개)
            if similar_resumes:
                # 유사도 기준으로 정렬하고 가장 높은 것만 반환
                similar_resumes.sort(key=lambda x: x['similarity_score'], reverse=True)
                return [similar_resumes[0]]  # 가장 유사도가 높은 이력서만 반환
            
            return []
            
        except Exception as e:
            print(f"❌ 유사 이력서 검색 실패: {e}")
            return []
    
    async def get_resume(self, resume_id: str) -> Optional[Dict[str, Any]]:
        """특정 이력서를 조회합니다."""
        if not self.mongodb_available:
            print("⚠️ MongoDB 없음 - 이력서 조회 불가")
            return None
            
        try:
            document = self.resume_collection.find_one({"_id": ObjectId(resume_id)})
            if document:
                document["_id"] = str(document["_id"])
                return document
            return None
            
        except Exception as e:
            print(f"❌ 이력서 조회 실패: {e}")
            return None
    
    async def get_similar_resumes(self, resume_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """특정 이력서와 유사한 이력서들을 조회합니다."""
        try:
            # 현재 이력서 가져오기
            current_resume = await self.get_resume(resume_id)
            if not current_resume:
                return []
            
            # 임베딩 추출
            embedding = np.array(current_resume.get("embedding", []))
            if len(embedding) == 0:
                return []
            
            # 유사한 이력서들 찾기
            similar_resumes = await self._find_similar_resumes(resume_id, embedding, limit)
            return similar_resumes
            
        except Exception as e:
            print(f"❌ 유사 이력서 조회 실패: {e}")
            return []
    
    async def get_all_resumes(self) -> List[Dict[str, Any]]:
        """모든 이력서를 조회합니다."""
        try:
            documents = list(self.resume_collection.find())
            for doc in documents:
                doc["_id"] = str(doc["_id"])
            return documents
            
        except Exception as e:
            print(f"❌ 모든 이력서 조회 실패: {e}")
            return []
    
    def close(self):
        """연결을 종료합니다."""
        if self.mongodb_available:
            self.mongo_client.close()
        self.chroma_client.persist() 