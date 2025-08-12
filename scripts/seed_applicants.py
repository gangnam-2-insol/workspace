import os, json
from datetime import datetime
from pymongo import MongoClient

uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
db_name = os.getenv("DATABASE_NAME", "hireme")
client = MongoClient(uri)
col = client[db_name]["applicant"]

samples = [
    {
        "name": "김하늘",
        "position": "프론트엔드 개발자",
        "department": "개발팀",
        "email": "haneul.kim@example.com",
        "phone": "010-1111-2222",
        "applied_date": "2025-08-12",
        "status": "지원",
        "experience": "3년",
        "skills": ["React", "TypeScript", "Next.js"],
        "rating": 4.2,
        "summary": "React 위주로 3년 경험",
    },
    {
        "name": "이도윤",
        "position": "백엔드 개발자",
        "department": "개발팀",
        "email": "doyoon.lee@example.com",
        "phone": "010-3333-4444",
        "applied_date": "2025-08-11",
        "status": "서류합격",
        "experience": "5년",
        "skills": ["Python", "FastAPI", "MongoDB"],
        "rating": 4.5,
        "summary": "FastAPI/비동기 처리 경험 풍부",
    },
    {
        "name": "박수연",
        "position": "데이터 엔지니어",
        "department": "데이터팀",
        "email": "sooyeon.park@example.com",
        "phone": "010-5555-6666",
        "applied_date": "2025-08-10",
        "status": "보류",
        "experience": "4년",
        "skills": ["Airflow", "Spark", "AWS"],
        "rating": 4.0,
        "summary": "데이터 파이프라인 구축 경험",
    },
]

results = []
for doc in samples:
    res = col.update_one(
        {"email": doc["email"]},
        {
            "$setOnInsert": {"created_at": datetime.utcnow()},
            "$set": {**doc, "updated_at": datetime.utcnow()},
        },
        upsert=True,
    )
    results.append({
        "email": doc["email"],
        "upserted": bool(res.upserted_id),
        "matched": res.matched_count,
        "modified": res.modified_count,
    })

count = col.count_documents({})
print(json.dumps({"ok": True, "db": db_name, "collection": "applicant", "count": count, "results": results}, ensure_ascii=False))
