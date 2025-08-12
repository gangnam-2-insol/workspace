from __future__ import annotations

import os
import sys
from typing import Any, Dict

from pymongo import MongoClient


def backfill_one(doc_hash: str) -> None:
    # Expect run with CWD = admin/backend
    from pdf_ocr_module.config import Settings
    from pdf_ocr_module.ai_analyzer import extract_fields

    settings = Settings()
    client = MongoClient(settings.mongodb_uri)
    try:
        ocr_db = client[settings.mongodb_db]
        docs = ocr_db[settings.mongodb_collection or "documents"]
        hireme_db = client[os.getenv("DATABASE_NAME", "hireme")]
        app_col = hireme_db["applicant"]
        apps_col = hireme_db["applicants"]

        doc = docs.find_one({"doc_hash": doc_hash})
        if not doc:
            print(f"No document with doc_hash={doc_hash}")
            return
        text = doc.get("text") or ""
        ef: Dict[str, Any] = extract_fields(text)
        name = (ef or {}).get("name")
        emails = (ef or {}).get("email") or []
        primary_email = emails[0] if emails else None

        print({"ai_name": name, "email": primary_email})
        if name:
            r = docs.update_one({"_id": doc["_id"]}, {"$set": {"fields.name": name}})
            print({"documents_modified": r.modified_count})
            if primary_email:
                for c in (app_col, apps_col):
                    ur = c.update_many({"email": primary_email}, {"$set": {"name": name}})
                    print({f"{c.name}_modified": ur.modified_count})
        else:
            print("No AI name extracted.")
    finally:
        client.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: backfill_one.py <doc_hash>")
        raise SystemExit(2)
    backfill_one(sys.argv[1])


