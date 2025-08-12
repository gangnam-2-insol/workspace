from __future__ import annotations

from pymongo import MongoClient


def main() -> None:
    # Hard-coded target for the known sample2 document/email
    # doc_hash from OCR results; email from sample2 content
    doc_hash = "e2ec6e7a0741a053d3edfd117a778bfea3d4c6b0b53109b243a9f8482684bfba"
    email = "hello@umchungjoeun.kr"
    new_name = "사주은"

    client = MongoClient("mongodb://localhost:27017")
    try:
        # Update OCR documents
        ocr_db = client["pdf_ocr"]
        docs = ocr_db["documents"]
        r1 = docs.update_many({"doc_hash": doc_hash}, {"$set": {"fields.name": new_name}})
        print({"ocr_documents_matched": r1.matched_count, "modified": r1.modified_count})

        # Update applicant collections by email
        hireme = client["hireme"]
        for col_name in ("applicant", "applicants"):
            col = hireme[col_name]
            r2 = col.update_many({"email": email}, {"$set": {"name": new_name}})
            print({f"hireme.{col_name}_matched": r2.matched_count, "modified": r2.modified_count})
    finally:
        client.close()


if __name__ == "__main__":
    main()


