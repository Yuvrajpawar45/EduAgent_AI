import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Global client variable — we reuse one connection instead of
# creating a new one for every database operation
_client = None
_db = None


def get_database():
    """
    Get the MongoDB database connection.
    Uses a single shared connection (singleton pattern) for efficiency.

    Returns:
        pymongo Database object

    Raises:
        Exception if MONGO_URI is not set in .env
    """
    global _client, _db

    # If already connected, return existing connection
    if _db is not None:
        return _db

    try:
        from pymongo import MongoClient
        from pymongo.server_api import ServerApi

        # Read the connection string from .env file
        mongo_uri = os.getenv("MONGO_URI")

        if not mongo_uri:
            raise ValueError(
                "MONGO_URI not found in .env file!\n"
                "Add this line to your .env:\n"
                "mongodb+srv://eduagent:eduagent123@cluster.zr0abhn.mongodb.net/?appName=Cluster"
            )

        # Get the database (name from .env, default to 'eduagent_db')
        db_name = os.getenv("MONGO_DB_NAME", "eduagent_db")

        # Connect to MongoDB Atlas
        # ServerApi('1') uses the stable API version
        _client = MongoClient(
            mongo_uri,
            server_api=ServerApi('1'),
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            socketTimeoutMS=5000,
        )

        # Test the connection with a ping
        _client.admin.command('ping')
        print("Connected to MongoDB Atlas successfully.")
        _db = _client[db_name]
        return _db

    except Exception as e:
        print(f"MongoDB Atlas connection failed: {e}")
        use_local_fallback = os.getenv("MONGO_FALLBACK_LOCAL", "true").strip().lower() in {"1", "true", "yes", "on"}
        if not use_local_fallback:
            raise

        try:
            from mongita import MongitaClientDisk

            _client = MongitaClientDisk()
            _db = _client[db_name]
            print("Using local Mongita fallback database.")
            return _db
        except Exception as local_exc:
            print(f"Local Mongita fallback failed: {local_exc}")
            raise


def close_connection():
    """Close the MongoDB connection cleanly."""
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None
        print("MongoDB connection closed.")


# ============================================================
# FAQ OPERATIONS
# ============================================================

def get_all_faqs(category: str = None) -> list:
    """
    Fetch all FAQs, optionally filtered by category.

    In MongoDB, documents are Python dictionaries.
    The _id field is a MongoDB ObjectId — we convert it to string.

    Parameters:
        category (str): Optional filter e.g. "Exam", "Fees"

    Returns:
        list of FAQ dicts
    """
    db = get_database()
    query = {}
    if category and category != "All":
        # Case-insensitive search using regex
        import re
        query["category"] = {"$regex": f"^{category}$", "$options": "i"}

    faqs = list(db.faqs.find(query))

    # Convert ObjectId to string so it can be used in forms
    for faq in faqs:
        faq.setdefault("views", 0)
        faq.setdefault("helpful_yes", 0)
        faq.setdefault("helpful_total", 0)
        faq["_id"] = str(faq["_id"])

    return faqs


def search_faqs(query_text: str, category: str) -> list:
    """
    Search FAQs by text matching in question, answer, keywords.

    Uses MongoDB's $or operator to search across multiple fields.
    $regex does case-insensitive partial text matching.

    Parameters:
        query_text (str): Text to search for
        category   (str): Category to prioritize in search

    Returns:
        list of up to 3 matching FAQ dicts
    """
    db = get_database()
    import re

    # Build a case-insensitive regex pattern
    pattern = re.compile(query_text, re.IGNORECASE)

    # Search in multiple fields using $or
    results = list(db.faqs.find(
        {
            "$or": [
                {"question": {"$regex": pattern}},
                {"answer":   {"$regex": pattern}},
                {"keywords": {"$regex": pattern}},
                {"category": {"$regex": re.compile(category, re.IGNORECASE)}}
            ]
        }
    ).limit(3))

    # Track FAQ impressions from student queries as "views"
    if results:
        from bson import ObjectId
        ids = [r["_id"] for r in results if "_id" in r]
        db.faqs.update_many({"_id": {"$in": ids}}, {"$inc": {"views": 1}})

    for r in results:
        r.setdefault("views", 0)
        r.setdefault("helpful_yes", 0)
        r.setdefault("helpful_total", 0)
        r["_id"] = str(r["_id"])

    return results


def add_faq(category: str, question: str, answer: str, keywords: str) -> bool:
    """
    Insert a new FAQ document into the faqs collection.

    Parameters:
        category (str): e.g. "Exam", "Fees"
        question (str): The question text
        answer   (str): The answer text
        keywords (str): Comma-separated keywords

    Returns:
        True if inserted, False if error
    """
    db = get_database()
    try:
        db.faqs.insert_one({
            "category":   category,
            "question":   question,
            "answer":     answer,
            "keywords":   keywords,
            "views":      0,
            "helpful_yes": 0,
            "helpful_total": 0,
            "created_at": datetime.now().isoformat()
        })
        return True
    except Exception as e:
        print(f"❌ Error adding FAQ: {e}")
        return False


def update_faq(faq_id: str, answer: str, keywords: str) -> bool:
    """
    Update an existing FAQ's answer and keywords.

    Uses $set to update only specific fields (not replace entire document).
    """
    from bson import ObjectId
    db = get_database()
    try:
        db.faqs.update_one(
            {"_id": ObjectId(faq_id)},
            {"$set": {"answer": answer, "keywords": keywords}}
        )
        return True
    except Exception as e:
        print(f"❌ Error updating FAQ: {e}")
        return False


def delete_faq(faq_id: str) -> bool:
    """Delete a FAQ document by its MongoDB _id."""
    from bson import ObjectId
    db = get_database()
    try:
        db.faqs.delete_one({"_id": ObjectId(faq_id)})
        return True
    except Exception as e:
        print(f"❌ Error deleting FAQ: {e}")
        return False


def record_faq_feedback(faq_id: str, is_helpful: bool) -> bool:
    """Record thumbs up/down style feedback for an FAQ."""
    from bson import ObjectId
    db = get_database()
    try:
        inc = {"helpful_total": 1}
        if is_helpful:
            inc["helpful_yes"] = 1
        db.faqs.update_one({"_id": ObjectId(faq_id)}, {"$inc": inc})
        return True
    except Exception as e:
        print(f"Error recording FAQ feedback: {e}")
        return False


def increment_faq_view(faq_id: str) -> bool:
    """Increment FAQ view counter manually."""
    from bson import ObjectId
    db = get_database()
    try:
        db.faqs.update_one({"_id": ObjectId(faq_id)}, {"$inc": {"views": 1}})
        return True
    except Exception as e:
        print(f"Error incrementing FAQ view: {e}")
        return False


# ============================================================
# EXAM SCHEDULE OPERATIONS
# ============================================================

def get_all_exams() -> list:
    """Fetch all exam schedule entries sorted by date."""
    db = get_database()
    exams = list(db.exam_schedules.find().sort("exam_date", 1))
    for e in exams:
        e["_id"] = str(e["_id"])
    return exams


def add_exam(subject: str, exam_date: str, exam_time: str,
             venue: str, semester: int) -> bool:
    """Insert a new exam schedule entry."""
    db = get_database()
    try:
        db.exam_schedules.insert_one({
            "subject":   subject,
            "exam_date": exam_date,
            "exam_time": exam_time,
            "venue":     venue,
            "semester":  semester
        })
        return True
    except Exception as e:
        print(f"❌ Error adding exam: {e}")
        return False


def delete_exam(exam_id: str) -> bool:
    """Delete an exam entry by MongoDB _id."""
    from bson import ObjectId
    db = get_database()
    try:
        db.exam_schedules.delete_one({"_id": ObjectId(exam_id)})
        return True
    except Exception as e:
        print(f"❌ Error deleting exam: {e}")
        return False


# ============================================================
# FEE STRUCTURE OPERATIONS
# ============================================================

def get_all_fees() -> list:
    """Fetch all fee structure entries."""
    db = get_database()
    fees = list(db.fee_structure.find())
    for f in fees:
        f["_id"] = str(f["_id"])
    return fees


def add_fee(fee_type: str, amount: float,
            due_date: str, description: str) -> bool:
    """Insert a new fee entry."""
    db = get_database()
    try:
        db.fee_structure.insert_one({
            "fee_type":    fee_type,
            "amount":      amount,
            "due_date":    due_date,
            "description": description
        })
        return True
    except Exception as e:
        print(f"❌ Error adding fee: {e}")
        return False


def delete_fee(fee_id: str) -> bool:
    """Delete a fee entry by MongoDB _id."""
    from bson import ObjectId
    db = get_database()
    try:
        db.fee_structure.delete_one({"_id": ObjectId(fee_id)})
        return True
    except Exception as e:
        print(f"❌ Error deleting fee: {e}")
        return False


# ============================================================
# STUDENT LOGIN + FEE LEDGER OPERATIONS
# ============================================================

def add_student(student_id: str, full_name: str, password: str, program: str = "", enrollment_no: str = "") -> bool:
    """Create or update a student login record."""
    db = get_database()
    try:
        db.students.update_one(
            {"student_id": student_id},
            {
                "$set": {
                    "student_id": student_id,
                    "full_name": full_name,
                    "password": password,
                    "program": program,
                    "enrollment_no": enrollment_no,
                    "updated_at": datetime.now().isoformat(),
                },
                "$setOnInsert": {"created_at": datetime.now().isoformat()},
            },
            upsert=True,
        )
        return True
    except Exception as e:
        print(f"Error adding student: {e}")
        return False


def get_student_by_credentials(student_id: str, password: str) -> dict | None:
    """Fetch a student by student_id + password."""
    db = get_database()
    try:
        student = db.students.find_one({"student_id": student_id, "password": password})
        if not student:
            return None
        student["_id"] = str(student["_id"])
        return student
    except Exception as e:
        print(f"Error fetching student by credentials: {e}")
        return None


def get_student_by_identifier_credentials(identifier: str, password: str) -> dict | None:
    """Fetch a student by student_id OR enrollment_no + password."""
    db = get_database()
    try:
        # Some local fallbacks (e.g., Mongita) have partial operator support,
        # so use two direct queries instead of a single $or query.
        student = db.students.find_one({"student_id": identifier, "password": password})
        if not student:
            student = db.students.find_one({"enrollment_no": identifier, "password": password})
        if not student:
            return None
        student["_id"] = str(student["_id"])
        return student
    except Exception as e:
        print(f"Error fetching student by identifier credentials: {e}")
        return None


def get_student_by_id(student_id: str) -> dict | None:
    """Fetch a student by student_id."""
    db = get_database()
    try:
        student = db.students.find_one({"student_id": student_id})
        if not student:
            return None
        student["_id"] = str(student["_id"])
        return student
    except Exception as e:
        print(f"Error fetching student: {e}")
        return None


def get_all_students() -> list:
    """Fetch all student records."""
    db = get_database()
    students = list(db.students.find().sort("student_id", 1))
    for s in students:
        s["_id"] = str(s["_id"])
    return students


def get_fee_ledger(student_id: str = "") -> list:
    """Fetch student fee ledger rows, optionally by student_id."""
    db = get_database()
    query = {"student_id": student_id} if student_id else {}
    rows = list(db.student_fee_ledger.find(query).sort([("due_date", 1), ("student_id", 1)]))
    for row in rows:
        row["_id"] = str(row["_id"])
    return rows


def add_or_update_fee_ledger(
    student_id: str,
    fee_type: str,
    total_amount: float,
    paid_amount: float,
    due_date: str,
    status: str = "pending",
) -> bool:
    """Create or update one fee ledger row for a student."""
    db = get_database()
    try:
        balance = max(float(total_amount) - float(paid_amount), 0.0)
        db.student_fee_ledger.update_one(
            {"student_id": student_id, "fee_type": fee_type},
            {
                "$set": {
                    "student_id": student_id,
                    "fee_type": fee_type,
                    "total_amount": float(total_amount),
                    "paid_amount": float(paid_amount),
                    "balance_amount": balance,
                    "due_date": due_date,
                    "status": status,
                    "updated_at": datetime.now().isoformat(),
                },
                "$setOnInsert": {
                    "reminder_count": 0,
                    "last_reminder_at": "",
                    "created_at": datetime.now().isoformat(),
                },
            },
            upsert=True,
        )
        return True
    except Exception as e:
        print(f"Error writing fee ledger row: {e}")
        return False


def send_fee_reminder(ledger_id: str, sent_by: str = "admin") -> bool:
    """Mark a reminder as sent and save reminder event."""
    from bson import ObjectId
    from pymongo import ReturnDocument

    db = get_database()
    try:
        now = datetime.now().isoformat()
        row = db.student_fee_ledger.find_one_and_update(
            {"_id": ObjectId(ledger_id)},
            {"$inc": {"reminder_count": 1}, "$set": {"last_reminder_at": now}},
            return_document=ReturnDocument.AFTER,
        )
        if not row:
            return False
        due_date = row.get("due_date", "")
        balance_amount = float(row.get("balance_amount", 0.0))
        fee_type = row.get("fee_type", "")
        message = (
            f"Reminder: {fee_type} payment is pending. "
            f"Balance Rs. {balance_amount:,.0f}, due by {due_date}."
        )
        db.fee_reminders.insert_one(
            {
                "ledger_id": str(row["_id"]),
                "student_id": row.get("student_id", ""),
                "fee_type": fee_type,
                "message": message,
                "is_read": False,
                "sent_by": sent_by,
                "sent_at": now,
            }
        )
        return True
    except Exception as e:
        print(f"Error sending fee reminder: {e}")
        return False


def get_student_reminders(student_id: str, unread_only: bool = False, limit: int = 50) -> list:
    """Fetch reminders for a student."""
    db = get_database()
    query = {"student_id": student_id}
    if unread_only:
        query["is_read"] = False
    reminders = list(db.fee_reminders.find(query).sort("sent_at", -1).limit(limit))
    for reminder in reminders:
        reminder.setdefault("is_read", False)
        reminder["_id"] = str(reminder["_id"])
    return reminders


def mark_student_reminders_read(student_id: str) -> bool:
    """Mark all unread reminders as read for one student."""
    db = get_database()
    try:
        db.fee_reminders.update_many({"student_id": student_id, "is_read": False}, {"$set": {"is_read": True}})
        return True
    except Exception as e:
        print(f"Error marking reminders read: {e}")
        return False


# ============================================================
# ESCALATED QUERIES OPERATIONS
# ============================================================

def save_escalated_query(student_query: str, reason: str) -> bool:
    """
    Save a flagged query to MongoDB for admin review.

    Called by the EscalationAgent when a sensitive query is detected.
    """
    db = get_database()
    try:
        db.escalated_queries.insert_one({
            "student_query": student_query,
            "reason":        reason,
            "timestamp":     datetime.now().isoformat(),
            "status":        "pending",
            "admin_notes":   ""
        })
        print("⚠️  Escalated query saved to MongoDB")
        return True
    except Exception as e:
        print(f"❌ Error saving escalated query: {e}")
        return False


def get_escalated_queries(status_filter: str = "all") -> list:
    """
    Fetch escalated queries, optionally filtered by status.

    Parameters:
        status_filter: "all", "pending", "in-progress", or "resolved"
    """
    db = get_database()
    query = {} if status_filter == "all" else {"status": status_filter}
    results = list(db.escalated_queries.find(query).sort("timestamp", -1))
    for r in results:
        r["_id"] = str(r["_id"])
    return results


def update_escalated_query(query_id: str, status: str,
                           admin_notes: str) -> bool:
    """Update the status and admin notes of an escalated query."""
    from bson import ObjectId
    db = get_database()
    try:
        db.escalated_queries.update_one(
            {"_id": ObjectId(query_id)},
            {"$set": {"status": status, "admin_notes": admin_notes}}
        )
        return True
    except Exception as e:
        print(f"❌ Error updating escalated query: {e}")
        return False


# ============================================================
# UPLOADED PDFs TRACKING
# ============================================================

def record_uploaded_pdf(filename: str, pages: int, chunks: int, category: str = "General", title: str = "") -> bool:
    """Record a successfully processed PDF in MongoDB."""
    db = get_database()
    try:
        db.uploaded_pdfs.insert_one({
            "filename":      filename,
            "original_name": filename,
            "title":         title or filename,
            "category":      category,
            "pages":         pages,
            "chunks":        chunks,
            "download_count": 0,
            "uploaded_at":   datetime.now().isoformat(),
            "uploaded_by":   "admin"
        })
        return True
    except Exception as e:
        print(f"❌ Error recording PDF: {e}")
        return False


def get_all_uploaded_pdfs() -> list:
    """Fetch all uploaded PDF records."""
    db = get_database()
    pdfs = list(db.uploaded_pdfs.find().sort("uploaded_at", -1))
    for p in pdfs:
        p.setdefault("download_count", 0)
        p["_id"] = str(p["_id"])
    return pdfs


def get_uploaded_pdf_by_id(pdf_id: str) -> dict | None:
    """Fetch a single uploaded PDF record by MongoDB _id."""
    from bson import ObjectId
    db = get_database()
    try:
        doc = db.uploaded_pdfs.find_one({"_id": ObjectId(pdf_id)})
        if not doc:
            return None
        doc.setdefault("download_count", 0)
        doc["_id"] = str(doc["_id"])
        return doc
    except Exception as e:
        print(f"Error fetching uploaded PDF by id: {e}")
        return None


def delete_uploaded_pdf_record(pdf_id: str) -> bool:
    """Delete a PDF record from MongoDB."""
    from bson import ObjectId
    db = get_database()
    try:
        db.uploaded_pdfs.delete_one({"_id": ObjectId(pdf_id)})
        return True
    except Exception as e:
        print(f"❌ Error deleting PDF record: {e}")
        return False


# ============================================================
# DOWNLOAD TRACKING
# ============================================================

def record_pdf_download(pdf_id: str, student_id: str = "", source: str = "student") -> bool:
    """Increment document download count and write one download event."""
    from bson import ObjectId
    from pymongo import ReturnDocument

    db = get_database()
    try:
        now = datetime.now().isoformat()
        pdf = db.uploaded_pdfs.find_one_and_update(
            {"_id": ObjectId(pdf_id)},
            {"$inc": {"download_count": 1}, "$set": {"last_download_at": now}},
            return_document=ReturnDocument.AFTER,
        )
        if not pdf:
            return False
        db.download_events.insert_one(
            {
                "pdf_id": pdf_id,
                "student_id": student_id,
                "filename": pdf.get("original_name") or pdf.get("filename") or "",
                "source": source,
                "downloaded_at": now,
            }
        )
        return True
    except Exception as e:
        print(f"Error recording PDF download: {e}")
        return False


def get_download_events(limit: int = 200) -> list:
    """Fetch recent download events for admin tracking."""
    db = get_database()
    events = list(db.download_events.find().sort("downloaded_at", -1).limit(limit))
    for event in events:
        event["_id"] = str(event["_id"])
    return events


# ============================================================
# STATISTICS
# ============================================================

def get_statistics() -> dict:
    """
    Get count statistics for the admin dashboard.
    Uses MongoDB's count_documents() method.
    """
    db = get_database()
    try:
        return {
            "total_faqs":       db.faqs.count_documents({}),
            "total_escalated":  db.escalated_queries.count_documents({}),
            "pending_escalated":db.escalated_queries.count_documents(
                                    {"status": "pending"}),
            "uploaded_pdfs":    db.uploaded_pdfs.count_documents({}),
            "exam_entries":     db.exam_schedules.count_documents({}),
            "fee_entries":      db.fee_structure.count_documents({}),
            "students":         db.students.count_documents({}),
            "ledger_entries":   db.student_fee_ledger.count_documents({}),
        }
    except Exception as e:
        print(f"❌ Error fetching stats: {e}")
        return {k: 0 for k in ["total_faqs", "total_escalated",
                                "pending_escalated", "uploaded_pdfs",
                                "exam_entries", "fee_entries",
                                "students", "ledger_entries"]}
