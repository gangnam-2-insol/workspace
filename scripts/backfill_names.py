from __future__ import annotations

import os
from typing import Any, Dict

from pymongo import MongoClient


def log(msg: str) -> None:
    print(msg, flush=True)


def main() -> None:
    # Load settings via pdf_ocr_module (expects to run with CWD at admin/backend)
    from pdf_ocr_module.config import Settings
    from pdf_ocr_module.ai_analyzer import extract_fields

    settings = Settings()

    mongo_uri = settings.mongodb_uri
    ocr_db_name = settings.mongodb_db
    ocr_docs_col = settings.mongodb_collection or "documents"

    # HireMe app DB (fallback default)
    hireme_db_name = os.getenv("DATABASE_NAME", "hireme")

    client = MongoClient(mongo_uri)
    try:
        ocr_db = client[ocr_db_name]
        hireme_db = client[hireme_db_name]

        docs_col = ocr_db[ocr_docs_col]
        applicants_col = hireme_db["applicant"]
        applicants_plural_col = hireme_db["applicants"]

        # Target: docs where name is missing or set to placeholder
        cursor = docs_col.find(
            {
                "$or": [
                    {"fields.name": {"$exists": False}},
                    {"fields.name": None},
                    {"fields.name": {"$in": ["", "미상", "unknown"]}},
                ]
            },
            {"text": 1, "fields": 1, "doc_hash": 1},
        )

        updated_docs = 0
        updated_applicants = 0

        for doc in cursor:
            text: str = doc.get("text") or ""
            if not text.strip():
                continue

            ef: Dict[str, Any] = extract_fields(text)
            name = (ef or {}).get("name")
            emails = (ef or {}).get("email") or []
            primary_email = emails[0] if emails else None

            if name and isinstance(name, str) and 2 <= len(name) <= 4:
                res = docs_col.update_one(
                    {"_id": doc["_id"]}, {"$set": {"fields.name": name}}
                )
                if res.modified_count:
                    updated_docs += 1
                    log(f"[documents] doc_hash={doc.get('doc_hash')} name -> {name}")

                # Update hireme applicants by email if available
                if primary_email:
                    for col in (applicants_col, applicants_plural_col):
                        ar = col.update_many(
                            {"email": primary_email},
                            {"$set": {"name": name}},
                        )
                        updated_applicants += ar.modified_count
                        if ar.modified_count:
                            log(
                                f"[hireme.{col.name}] {primary_email} name -> {name} (updated {ar.modified_count})"
                            )

        log(
            f"Done. Updated documents={updated_docs}, applicants(updated fields)={updated_applicants}"
        )

    finally:
        client.close()


if __name__ == "__main__":
    main()


