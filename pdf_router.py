from pathlib import Path
from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile

from pdf_ocr_module.config import Settings
from pdf_ocr_module.main import process_pdf
from pdf_ocr_module.vector_storage import query_top_k, delete_by_doc_hash
from pdf_ocr_module.embedder import get_embedding
from pdf_ocr_module.ai_analyzer import clean_text
from pymongo import MongoClient
from pymongo.collection import Collection
from pdf_ocr_module.utils import ensure_directories, save_upload_file
from pdf_ocr_module.config import Settings as AppSettings


router = APIRouter(prefix="/pdf", tags=["pdf"]) 
settings = Settings()


@router.post("/upload")
def upload_pdf(file: UploadFile = File(...)) -> dict[str, Any]:
    if file.content_type not in {"application/pdf", "application/x-pdf"}:
        raise HTTPException(status_code=400, detail="PDF 파일만 업로드할 수 있습니다.")

    ensure_directories(settings)

    saved_path: Path = save_upload_file(file, settings)

    try:
        result = process_pdf(saved_path)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"처리 중 오류 발생: {exc}") from exc

    return result


@router.get("/files")
def list_files() -> dict[str, Any]:  # type: ignore[no-untyped-def]
    settings = Settings()
    client = MongoClient(settings.mongodb_uri)
    try:
        db = client[settings.mongodb_db]
        col = db[settings.mongodb_col_documents]
        files = list(col.find({}, {"file_name": 1, "doc_hash": 1, "_id": 0}))
        return {"files": files}
    finally:
        client.close()


@router.delete("/file/{doc_hash}")
def delete_file(doc_hash: str) -> dict[str, Any]:  # type: ignore[no-untyped-def]
    settings = Settings()
    client = MongoClient(settings.mongodb_uri)
    try:
        db = client[settings.mongodb_db]
        docs: Collection = db[settings.mongodb_col_documents]
        pages: Collection = db[settings.mongodb_col_pages]
        d1 = docs.delete_many({"doc_hash": doc_hash}).deleted_count
        d2 = pages.delete_many({"doc_hash": doc_hash}).deleted_count
        # VectorDB도 정리 (신규 색인분)
        try:
            v = delete_by_doc_hash(doc_hash, settings)
        except Exception:
            v = {"error": "chroma_delete_failed"}
        return {"deleted": {"documents": int(d1), "pages": int(d2), "vector": v}}
    finally:
        client.close()


@router.get("/search")
def search(q: str, k: int = 5) -> dict[str, Any]:  # type: ignore[no-untyped-def]
    try:
        embedding = get_embedding(q)
        settings = Settings()
        app = AppSettings()
        res = query_top_k(embedding, max(k * 3, 10), settings)
        # 임계치 필터링: cosine distance ≤ 0.6만 채택
        raw_docs = (res or {}).get("documents", [[]])[0] or []
        raw_metas = (res or {}).get("metadatas", [[]])[0] or []
        raw_dists = (res or {}).get("distances", [[]])[0] or []
        items = []
        for doc, meta, dist in zip(raw_docs, raw_metas, raw_dists):
            if doc and dist is not None and dist <= 0.6:
                items.append({"document": doc, "metadata": meta, "distance": float(dist)})
        # 중복 억제: 동일 source 그룹핑 후 최고 점수만 남김
        best_by_source: dict[str, dict[str, Any]] = {}
        for it in items:
            src = (it.get("metadata") or {}).get("source") or ""
            if src not in best_by_source or it["distance"] < best_by_source[src]["distance"]:
                best_by_source[src] = it
        deduped = sorted(best_by_source.values(), key=lambda x: x["distance"])[:k]
        # 짧은 한글 질의 부스터(2~4자): 정확 문자열 포함시 보너스
        import re
        q_trim = q.strip()
        if 2 <= len(q_trim) <= 4 and re.fullmatch(r"[가-힣]+", q_trim):
            def boost_score(item: dict[str, Any]) -> float:
                doc = item.get("document") or ""
                return item["distance"] - (0.15 if q_trim in doc else 0.0)
            deduped = sorted(deduped, key=boost_score)
        return {
            "query": q,
            "k": k,
            "results": deduped,
            "meta": {
                "embedding_model_name": app.embedding_model_name,
                "l2_normalize": app.l2_normalize_embeddings,
                "metric": "cosine",
                "topk_requested": k,
                "returned": len(deduped),
            },
        }
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"검색 중 오류: {exc}") from exc




