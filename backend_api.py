from __future__ import annotations

import os
import secrets
from datetime import datetime
from datetime import timedelta
import re
from typing import Any, Dict, Optional

from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from database.mongo_db import (
    add_or_update_fee_ledger,
    add_exam,
    add_faq,
    add_fee,
    add_student,
    delete_exam,
    delete_faq,
    delete_fee,
    delete_uploaded_pdf_record,
    get_all_students,
    get_download_events,
    get_all_exams,
    get_all_faqs,
    get_all_fees,
    get_all_uploaded_pdfs,
    get_database,
    get_fee_ledger,
    get_escalated_queries,
    get_student_reminders,
    get_student_by_identifier_credentials,
    get_student_by_id,
    get_uploaded_pdf_by_id,
    get_statistics,
    increment_faq_view,
    record_pdf_download,
    record_faq_feedback,
    record_uploaded_pdf,
    send_fee_reminder,
    mark_student_reminders_read,
    update_escalated_query,
    update_faq,
)
from start_llm import initialize_llm
from utils.pdf_processor import PDFProcessor

app = FastAPI(title="EduAgent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
UPLOAD_DIR = "uploaded_pdfs"
TOKEN_TTL_HOURS = 8

_cached_llm_status: Optional[Dict[str, Any]] = None
_cached_agents: Optional[Dict[str, Any]] = None
_admin_tokens: Dict[str, datetime] = {}
_student_tokens: Dict[str, Dict[str, str]] = {}


class ChatRequest(BaseModel):
    message: str


class AdminLoginRequest(BaseModel):
    password: str


class StudentLoginRequest(BaseModel):
    identifier: str = ""
    student_id: str = ""
    password: str


class EscalationUpdate(BaseModel):
    status: str
    admin_notes: str = ""


class FAQCreate(BaseModel):
    category: str
    question: str
    answer: str
    keywords: str = ""


class FAQUpdate(BaseModel):
    answer: str
    keywords: str = ""


class FAQFeedback(BaseModel):
    is_helpful: bool


class ExamCreate(BaseModel):
    subject: str
    exam_date: str
    exam_time: str
    venue: str
    semester: int


class FeeCreate(BaseModel):
    fee_type: str
    amount: float
    due_date: str
    description: str


class StudentFeeLedgerCreate(BaseModel):
    student_id: str
    fee_type: str
    total_amount: float
    paid_amount: float = 0.0
    due_date: str
    status: str = "pending"


def _cleanup_tokens() -> None:
    now = datetime.now()
    expired = [t for t, exp in _admin_tokens.items() if exp < now]
    for token in expired:
        _admin_tokens.pop(token, None)

    student_expired = []
    for token, data in _student_tokens.items():
        expires_at = data.get("expires_at", "")
        try:
            exp_dt = datetime.fromisoformat(expires_at)
        except ValueError:
            exp_dt = now
        if exp_dt < now:
            student_expired.append(token)
    for token in student_expired:
        _student_tokens.pop(token, None)


def _issue_admin_token() -> Dict[str, Any]:
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now() + timedelta(hours=TOKEN_TTL_HOURS)
    _admin_tokens[token] = expires_at
    return {
        "token": token,
        "expires_at": expires_at.isoformat(),
        "token_type": "bearer",
    }


def _issue_student_token(student_id: str, name: str) -> Dict[str, Any]:
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now() + timedelta(hours=TOKEN_TTL_HOURS)
    _student_tokens[token] = {
        "student_id": student_id,
        "name": name,
        "expires_at": expires_at.isoformat(),
    }
    return {
        "token": token,
        "expires_at": expires_at.isoformat(),
        "token_type": "bearer",
        "student_id": student_id,
        "name": name,
    }


def _seed_demo_data() -> None:
    db = get_database()

    def _ensure_records(collection: Any, records: list[dict], unique_fields: list[str]) -> None:
        for record in records:
            query = {k: record[k] for k in unique_fields if k in record}
            if not query:
                continue
            if not collection.find_one(query):
                collection.insert_one(record)

    demo_faqs = [
            {
                "category": "Attendance",
                "question": "What is the minimum attendance requirement?",
                "answer": "The minimum attendance requirement is 75%. Students with attendance below 75% will not be permitted to appear in final examinations.",
                "keywords": "attendance,minimum,requirement,75,detained,condonation",
                "views": 1380,
                "helpful_yes": 1270,
                "helpful_total": 1380,
                "created_at": datetime.now().isoformat(),
            },
            {
                "category": "Attendance",
                "question": "How can I apply for attendance condonation?",
                "answer": "Students with 65-74% attendance can apply for condonation by submitting Form ATT-02 with valid proof at least 7 days before exams.",
                "keywords": "condonation,attendance shortage,medical,leave,form",
                "views": 920,
                "helpful_yes": 842,
                "helpful_total": 920,
                "created_at": datetime.now().isoformat(),
            },
            {
                "category": "Fees",
                "question": "What are the fee payment deadlines?",
                "answer": "Semester tuition fee must be paid within 30 days from semester start. Late fee applies afterward.",
                "keywords": "fees,deadline,payment,late fee,tuition",
                "views": 1205,
                "helpful_yes": 1101,
                "helpful_total": 1205,
                "created_at": datetime.now().isoformat(),
            },
            {
                "category": "Fees",
                "question": "Can I pay fees in installments?",
                "answer": "Yes. Fees can be paid in two installments with Accounts Office approval. First installment should be paid by day 30, remaining by day 60.",
                "keywords": "installment,partial payment,accounts,fee split",
                "views": 812,
                "helpful_yes": 741,
                "helpful_total": 812,
                "created_at": datetime.now().isoformat(),
            },
            {
                "category": "Exam",
                "question": "How to download exam hall ticket?",
                "answer": "Login to portal > Exams > Hall Ticket. Ensure fee dues are cleared and attendance criteria are met before download.",
                "keywords": "hall ticket,exam,download,admit card",
                "views": 998,
                "helpful_yes": 934,
                "helpful_total": 998,
                "created_at": datetime.now().isoformat(),
            },
            {
                "category": "Exam",
                "question": "How do I apply for re-evaluation?",
                "answer": "Apply within 7 days from result declaration using Form RE-01 and pay re-evaluation fee per subject at the Exam Cell.",
                "keywords": "re-evaluation,recheck,results,exam cell",
                "views": 674,
                "helpful_yes": 611,
                "helpful_total": 674,
                "created_at": datetime.now().isoformat(),
            },
            {
                "category": "Scholarship",
                "question": "What scholarships are available for students?",
                "answer": "Available options include Merit Scholarship, Need-based Scholarship, Sports Scholarship, and Government schemes via state portal.",
                "keywords": "scholarship,merit,financial aid,need-based,sports,government",
                "views": 745,
                "helpful_yes": 690,
                "helpful_total": 745,
                "created_at": datetime.now().isoformat(),
            },
            {
                "category": "Admission",
                "question": "What documents are required for admission?",
                "answer": "10th and 12th marksheets, Transfer Certificate, Migration Certificate (if applicable), ID proof, photos, and category certificates where applicable.",
                "keywords": "admission,documents,marksheet,TC,migration,ID proof",
                "views": 569,
                "helpful_yes": 520,
                "helpful_total": 569,
                "created_at": datetime.now().isoformat(),
            },
            {
                "category": "Library",
                "question": "How many books can I borrow from the library?",
                "answer": "Students can borrow up to 4 books for 14 days. A one-time renewal is allowed subject to availability.",
                "keywords": "library,books,borrow,renewal,fine",
                "views": 444,
                "helpful_yes": 399,
                "helpful_total": 444,
                "created_at": datetime.now().isoformat(),
            },
            {
                "category": "General",
                "question": "How do I get a bonafide certificate?",
                "answer": "Submit a bonafide request form at the administrative office with student ID. Typical issuance time is 2 working days.",
                "keywords": "bonafide,certificate,administrative office,request form",
                "views": 506,
                "helpful_yes": 460,
                "helpful_total": 506,
                "created_at": datetime.now().isoformat(),
            },
            {
                "category": "Account",
                "question": "How to reset my student portal password?",
                "answer": "Go to Student Portal > Forgot Password > verify OTP and set a new password.",
                "keywords": "password,reset,portal,account",
                "views": 882,
                "helpful_yes": 814,
                "helpful_total": 882,
                "created_at": datetime.now().isoformat(),
            },
        ]
    _ensure_records(db.faqs, demo_faqs, ["question"])

    demo_exams = [
        {
            "subject": "Mathematics II",
            "exam_date": "2026-04-10",
            "exam_time": "10:00 AM",
            "venue": "Hall A",
            "semester": 2,
        },
        {
            "subject": "Physics",
            "exam_date": "2026-04-12",
            "exam_time": "10:00 AM",
            "venue": "Hall B",
            "semester": 2,
        },
        {
            "subject": "Computer Science Fundamentals",
            "exam_date": "2026-04-14",
            "exam_time": "02:00 PM",
            "venue": "Lab 1",
            "semester": 2,
        },
        {
            "subject": "Data Structures & Algorithms",
            "exam_date": "2026-12-22",
            "exam_time": "10:00 AM",
            "venue": "Hall A",
            "semester": 5,
        },
        {
            "subject": "Database Management Systems",
            "exam_date": "2026-12-24",
            "exam_time": "02:00 PM",
            "venue": "Hall B",
            "semester": 5,
        },
        {
            "subject": "Operating Systems",
            "exam_date": "2026-12-26",
            "exam_time": "10:00 AM",
            "venue": "Hall C",
            "semester": 5,
        },
        {
            "subject": "Computer Networks",
            "exam_date": "2026-12-28",
            "exam_time": "02:00 PM",
            "venue": "Hall A",
            "semester": 5,
        },
    ]
    _ensure_records(db.exam_schedules, demo_exams, ["subject", "exam_date", "semester"])

    demo_fees = [
        {
            "fee_type": "Tuition Fee",
            "amount": 45000.0,
            "due_date": "Within 30 days of semester start",
            "description": "Core academic fee for instructional services",
        },
        {
            "fee_type": "Development Fee",
            "amount": 2000.0,
            "due_date": "At admission",
            "description": "Infrastructure and digital systems maintenance",
        },
        {
            "fee_type": "Laboratory Fee",
            "amount": 1500.0,
            "due_date": "At semester start",
            "description": "Lab consumables and equipment upkeep",
        },
        {
            "fee_type": "Exam Fee",
            "amount": 800.0,
            "due_date": "Before each semester exam",
            "description": "Examination processing fee",
        },
        {
            "fee_type": "Library Fee",
            "amount": 500.0,
            "due_date": "At admission",
            "description": "Annual library access and maintenance",
        },
        {
            "fee_type": "Sports Fee",
            "amount": 300.0,
            "due_date": "At admission",
            "description": "Sports facility access and activities",
        },
        {
            "fee_type": "Student Activity Fee",
            "amount": 200.0,
            "due_date": "At admission",
            "description": "Cultural events and clubs",
        },
    ]
    _ensure_records(db.fee_structure, demo_fees, ["fee_type"])

    demo_escalations = [
        {
            "student_query": "Fee payment not reflected in student portal",
            "reason": "Payment/financial grievance",
            "timestamp": datetime.now().isoformat(),
            "status": "pending",
            "admin_notes": "",
        },
        {
            "student_query": "Exam hall ticket not generated despite fee payment",
            "reason": "Exam access issue",
            "timestamp": datetime.now().isoformat(),
            "status": "in-progress",
            "admin_notes": "Finance team verification in progress.",
        },
        {
            "student_query": "Scholarship amount not credited for this semester",
            "reason": "Scholarship disbursement delay",
            "timestamp": datetime.now().isoformat(),
            "status": "pending",
            "admin_notes": "",
        },
        {
            "student_query": "Attendance marked absent for approved medical leave",
            "reason": "Attendance correction request",
            "timestamp": datetime.now().isoformat(),
            "status": "resolved",
            "admin_notes": "Attendance updated after medical proof verification.",
        },
        {
            "student_query": "Duplicate late fee charged after on-time payment",
            "reason": "Billing discrepancy",
            "timestamp": datetime.now().isoformat(),
            "status": "pending",
            "admin_notes": "",
        },
    ]
    _ensure_records(db.escalated_queries, demo_escalations, ["student_query"])

    demo_students = [
        {"student_id": "STU-2024-001", "enrollment_no": "ENR001", "full_name": "Priya Sharma", "password": "stu123", "program": "B.Tech CSE"},
        {"student_id": "STU-2024-002", "enrollment_no": "ENR002", "full_name": "Rahul Verma", "password": "stu123", "program": "B.Tech CSE"},
        {"student_id": "STU-2024-003", "enrollment_no": "ENR003", "full_name": "Anita Desai", "password": "stu123", "program": "B.Tech CSE"},
        {"student_id": "STU-2024-004", "enrollment_no": "ENR004", "full_name": "Karan Singh", "password": "stu123", "program": "B.Tech CSE"},
        {"student_id": "STU-2024-005", "enrollment_no": "ENR005", "full_name": "Meera Nair", "password": "stu123", "program": "B.Tech CSE"},
    ]
    for student in demo_students:
        existing = db.students.find_one({"student_id": student["student_id"]})
        if existing:
            db.students.update_one(
                {"_id": existing["_id"]},
                {"$set": {**student, "updated_at": datetime.now().isoformat()}},
            )
        else:
            db.students.insert_one(
                {
                    **student,
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat(),
                }
            )

    demo_ledger = [
        {"student_id": "STU-2024-001", "fee_type": "Semester Tuition", "total_amount": 45000.0, "paid_amount": 30000.0, "due_date": "2026-12-31", "status": "pending"},
        {"student_id": "STU-2024-001", "fee_type": "Exam Fee", "total_amount": 800.0, "paid_amount": 0.0, "due_date": "2026-12-10", "status": "pending"},
        {"student_id": "STU-2024-002", "fee_type": "Semester Tuition", "total_amount": 45000.0, "paid_amount": 45000.0, "due_date": "2026-12-31", "status": "resolved"},
        {"student_id": "STU-2024-002", "fee_type": "Laboratory Fee", "total_amount": 1500.0, "paid_amount": 1500.0, "due_date": "2026-12-01", "status": "resolved"},
        {"student_id": "STU-2024-003", "fee_type": "Semester Tuition", "total_amount": 52000.0, "paid_amount": 0.0, "due_date": "2027-01-15", "status": "pending"},
        {"student_id": "STU-2024-003", "fee_type": "Development Fee", "total_amount": 2000.0, "paid_amount": 500.0, "due_date": "2027-01-05", "status": "in-progress"},
        {"student_id": "STU-2024-004", "fee_type": "Semester Tuition", "total_amount": 45000.0, "paid_amount": 22500.0, "due_date": "2026-12-31", "status": "in-progress"},
        {"student_id": "STU-2024-004", "fee_type": "Sports Fee", "total_amount": 300.0, "paid_amount": 300.0, "due_date": "2026-11-30", "status": "resolved"},
        {"student_id": "STU-2024-005", "fee_type": "Semester Tuition", "total_amount": 48000.0, "paid_amount": 48000.0, "due_date": "2027-01-15", "status": "resolved"},
        {"student_id": "STU-2024-005", "fee_type": "Student Activity Fee", "total_amount": 200.0, "paid_amount": 200.0, "due_date": "2026-11-30", "status": "resolved"},
    ]
    for row in demo_ledger:
        balance = max(row["total_amount"] - row["paid_amount"], 0.0)
        existing = db.student_fee_ledger.find_one({"student_id": row["student_id"], "fee_type": row["fee_type"]})
        if existing:
            db.student_fee_ledger.update_one(
                {"_id": existing["_id"]},
                {
                    "$set": {
                        **row,
                        "balance_amount": balance,
                        "updated_at": datetime.now().isoformat(),
                    }
                },
            )
        else:
            db.student_fee_ledger.insert_one(
                {
                    **row,
                    "balance_amount": balance,
                    "reminder_count": 0,
                    "last_reminder_at": "",
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat(),
                }
            )


def require_admin(
    authorization: str = Header(default=""),
    x_admin_password: str = Header(default=""),
) -> None:
    _cleanup_tokens()

    if authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "", 1).strip()
        if token in _admin_tokens:
            return

    if x_admin_password and x_admin_password == ADMIN_PASSWORD:
        return

    raise HTTPException(status_code=403, detail="Unauthorized admin access")


def require_student(authorization: str = Header(default="")) -> Dict[str, str]:
    _cleanup_tokens()
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=403, detail="Unauthorized student access")
    token = authorization.replace("Bearer ", "", 1).strip()
    data = _student_tokens.get(token)
    if not data:
        raise HTTPException(status_code=403, detail="Invalid or expired student token")
    return data


def get_llm_status() -> Dict[str, Any]:
    global _cached_llm_status
    if _cached_llm_status is None:
        _cached_llm_status = initialize_llm()
    return _cached_llm_status


def get_agents() -> Dict[str, Any]:
    global _cached_agents
    if _cached_agents is None:
        from agents.escalation_agent import EscalationAgent
        from agents.query_agent import QueryUnderstandingAgent
        from agents.response_agent import ResponseGenerationAgent
        from agents.retrieval_agent import InformationRetrievalAgent

        _cached_agents = {
            "query": QueryUnderstandingAgent(),
            "retrieval": InformationRetrievalAgent(),
            "response": ResponseGenerationAgent(),
            "escalation": EscalationAgent(),
        }
    return _cached_agents


def _normalize_text(text: str) -> str:
    return re.sub(r"[^a-z0-9\s]", " ", text.lower())


def _is_download_intent(query: str) -> bool:
    q = query.lower()
    intents = [
        "download",
        "send me",
        "give me file",
        "give pdf",
        "open pdf",
        "timetable",
        "attendance sheet",
        "calendar pdf",
        "document",
    ]
    return any(i in q for i in intents)


def _find_matching_pdfs(query: str) -> list[dict]:
    docs = get_all_uploaded_pdfs()
    if not docs:
        return []

    q_norm = _normalize_text(query)
    tokens = [t for t in q_norm.split() if len(t) > 2 and t not in {"the", "for", "and", "with", "from", "this"}]

    scored = []
    for doc in docs:
        name = (doc.get("original_name") or doc.get("filename") or "").lower()
        hay = _normalize_text(name)
        score = 0

        if name and name in query.lower():
            score += 10

        for t in tokens:
            if t in hay:
                score += 2

        # Boost common academic-document terms
        for key in ["timetable", "attendance", "schedule", "calendar", "exam", "sheet"]:
            if key in q_norm and key in hay:
                score += 3

        if score > 0:
            scored.append((score, doc))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [d for _, d in scored[:5]]


@app.get("/api/health")
def health() -> Dict[str, Any]:
    return {
        "ok": True,
        "time": datetime.now().isoformat(),
    }


@app.post("/api/chat")
def chat(req: ChatRequest) -> Dict[str, Any]:
    prompt = req.message.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    llm_status = get_llm_status()
    if not llm_status.get("ready"):
        return {
            "answer": "The local AI model is not ready. Please run `ollama serve` and try again.",
            "escalated": False,
            "meta": {"llm_ready": False},
        }

    agents = get_agents()

    escalation_result = agents["escalation"].process(prompt)
    if escalation_result.get("escalated"):
        return {
            "answer": escalation_result.get("message", "Your query has been escalated."),
            "escalated": True,
            "meta": {"reason": escalation_result.get("reason", "")},
        }

    # If the student is explicitly asking for downloadable files, prioritize direct file links.
    if _is_download_intent(prompt):
        matched_docs = _find_matching_pdfs(prompt)
        if matched_docs:
            downloads = [
                {
                    "id": d["_id"],
                    "name": d.get("original_name") or d.get("filename") or "document.pdf",
                    "url": f"/api/files/{d['_id']}/download",
                }
                for d in matched_docs
            ]
            names = "\n".join([f"- {d['name']}" for d in downloads])
            return {
                "answer": (
                    "I found matching document(s). You can download them directly:\n\n"
                    f"{names}"
                ),
                "escalated": False,
                "meta": {
                    "category": "documents",
                    "faq_count": 0,
                    "faq_ids": [],
                    "has_pdf": True,
                    "downloads": downloads,
                },
            }

    query_analysis = agents["query"].analyze(prompt)
    retrieved_data = agents["retrieval"].retrieve(query_analysis)
    answer = agents["response"].generate(prompt, retrieved_data)

    return {
        "answer": answer,
        "escalated": False,
        "meta": {
            "category": query_analysis.get("category"),
            "faq_count": len(retrieved_data.get("faqs", [])),
            "faq_ids": [f.get("_id") for f in retrieved_data.get("faqs", []) if f.get("_id")],
            "has_pdf": bool(retrieved_data.get("pdf_context")),
            "downloads": [],
        },
    }


@app.get("/api/files/{pdf_id}/download")
def download_uploaded_pdf(pdf_id: str) -> FileResponse:
    doc = get_uploaded_pdf_by_id(pdf_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    filename = doc.get("filename", "")
    filepath = os.path.join(UPLOAD_DIR, filename)
    if not filename or not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Document file not found on server")

    record_pdf_download(pdf_id, source="chat")

    download_name = doc.get("original_name") or filename
    return FileResponse(filepath, media_type="application/pdf", filename=download_name)


@app.post("/api/admin/login")
def admin_login(payload: AdminLoginRequest) -> Dict[str, Any]:
    if payload.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Invalid admin password")

    try:
        _seed_demo_data()
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {exc}") from exc
    token_data = _issue_admin_token()
    return {"ok": True, **token_data}


@app.post("/api/student/login")
def student_login(payload: StudentLoginRequest) -> Dict[str, Any]:
    try:
        _seed_demo_data()
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {exc}") from exc
    identifier = (payload.identifier or payload.student_id).strip()
    password = payload.password.strip()
    if not identifier or not password:
        raise HTTPException(status_code=400, detail="Enrollment number/Student ID and password are required")

    student = get_student_by_identifier_credentials(identifier, password)
    if not student:
        raise HTTPException(status_code=403, detail="Invalid student credentials")

    token_data = _issue_student_token(student.get("student_id", identifier), student.get("full_name", "Student"))
    return {"ok": True, **token_data}


@app.get("/api/student/me")
def student_me(student_auth: Dict[str, str] = Depends(require_student)) -> Dict[str, Any]:
    student = get_student_by_id(student_auth["student_id"])
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return {
        "student_id": student.get("student_id"),
        "enrollment_no": student.get("enrollment_no", ""),
        "full_name": student.get("full_name"),
        "program": student.get("program", ""),
    }


@app.get("/api/student/reminders")
def student_reminders(student_auth: Dict[str, str] = Depends(require_student)) -> Dict[str, Any]:
    items = get_student_reminders(student_auth["student_id"], unread_only=False, limit=50)
    unread_count = sum(1 for item in items if not item.get("is_read", False))
    return {"items": items, "unread_count": unread_count}


@app.post("/api/student/reminders/read")
def student_mark_reminders_read(student_auth: Dict[str, str] = Depends(require_student)) -> Dict[str, Any]:
    ok = mark_student_reminders_read(student_auth["student_id"])
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to mark reminders as read")
    return {"ok": True}


@app.get("/api/admin/stats")
def admin_stats(_: None = Depends(require_admin)) -> Dict[str, Any]:
    return get_statistics()


@app.get("/api/admin/escalations")
def admin_escalations(status: str = "all", _: None = Depends(require_admin)) -> Dict[str, Any]:
    return {"items": get_escalated_queries(status)}


@app.put("/api/admin/escalations/{query_id}")
def admin_update_escalation(query_id: str, payload: EscalationUpdate, _: None = Depends(require_admin)) -> Dict[str, Any]:
    ok = update_escalated_query(query_id, payload.status, payload.admin_notes)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to update escalation")
    return {"ok": True}


@app.get("/api/admin/faqs")
def admin_faqs(_: None = Depends(require_admin)) -> Dict[str, Any]:
    return {"items": get_all_faqs()}


@app.post("/api/admin/faqs")
def admin_add_faq(payload: FAQCreate, _: None = Depends(require_admin)) -> Dict[str, Any]:
    ok = add_faq(payload.category, payload.question, payload.answer, payload.keywords)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to add FAQ")
    return {"ok": True}


@app.put("/api/admin/faqs/{faq_id}")
def admin_update_faq(faq_id: str, payload: FAQUpdate, _: None = Depends(require_admin)) -> Dict[str, Any]:
    ok = update_faq(faq_id, payload.answer, payload.keywords)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to update FAQ")
    return {"ok": True}


@app.post("/api/faqs/{faq_id}/feedback")
def faq_feedback(faq_id: str, payload: FAQFeedback) -> Dict[str, Any]:
    ok = record_faq_feedback(faq_id, payload.is_helpful)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to record feedback")
    return {"ok": True}


@app.post("/api/faqs/{faq_id}/view")
def faq_view(faq_id: str) -> Dict[str, Any]:
    ok = increment_faq_view(faq_id)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to record view")
    return {"ok": True}


@app.delete("/api/admin/faqs/{faq_id}")
def admin_delete_faq(faq_id: str, _: None = Depends(require_admin)) -> Dict[str, Any]:
    ok = delete_faq(faq_id)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to delete FAQ")
    return {"ok": True}


@app.get("/api/admin/exams")
def admin_exams(_: None = Depends(require_admin)) -> Dict[str, Any]:
    return {"items": get_all_exams()}


@app.post("/api/admin/exams")
def admin_add_exam(payload: ExamCreate, _: None = Depends(require_admin)) -> Dict[str, Any]:
    ok = add_exam(payload.subject, payload.exam_date, payload.exam_time, payload.venue, payload.semester)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to add exam")
    return {"ok": True}


@app.delete("/api/admin/exams/{exam_id}")
def admin_delete_exam(exam_id: str, _: None = Depends(require_admin)) -> Dict[str, Any]:
    ok = delete_exam(exam_id)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to delete exam")
    return {"ok": True}


@app.get("/api/admin/fees")
def admin_fees(_: None = Depends(require_admin)) -> Dict[str, Any]:
    return {"items": get_all_fees()}


@app.post("/api/admin/fees")
def admin_add_fee(payload: FeeCreate, _: None = Depends(require_admin)) -> Dict[str, Any]:
    ok = add_fee(payload.fee_type, payload.amount, payload.due_date, payload.description)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to add fee")
    return {"ok": True}


@app.delete("/api/admin/fees/{fee_id}")
def admin_delete_fee(fee_id: str, _: None = Depends(require_admin)) -> Dict[str, Any]:
    ok = delete_fee(fee_id)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to delete fee")
    return {"ok": True}


@app.get("/api/admin/students")
def admin_students(_: None = Depends(require_admin)) -> Dict[str, Any]:
    return {"items": get_all_students()}


@app.get("/api/admin/fees/ledger")
def admin_fee_ledger(student_id: str = "", _: None = Depends(require_admin)) -> Dict[str, Any]:
    return {"items": get_fee_ledger(student_id.strip())}


@app.post("/api/admin/fees/ledger")
def admin_add_fee_ledger(payload: StudentFeeLedgerCreate, _: None = Depends(require_admin)) -> Dict[str, Any]:
    ok = add_or_update_fee_ledger(
        payload.student_id.strip(),
        payload.fee_type.strip(),
        payload.total_amount,
        payload.paid_amount,
        payload.due_date.strip(),
        payload.status.strip().lower() or "pending",
    )
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to upsert fee ledger row")
    return {"ok": True}


@app.post("/api/admin/fees/ledger/{ledger_id}/reminder")
def admin_send_fee_reminder(ledger_id: str, _: None = Depends(require_admin)) -> Dict[str, Any]:
    ok = send_fee_reminder(ledger_id, sent_by="admin")
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to send reminder")
    return {"ok": True}


@app.get("/api/admin/downloads")
def admin_download_events(_: None = Depends(require_admin)) -> Dict[str, Any]:
    return {"items": get_download_events(200)}


@app.get("/api/admin/pdfs")
def admin_pdfs(_: None = Depends(require_admin)) -> Dict[str, Any]:
    return {"items": get_all_uploaded_pdfs()}


@app.get("/api/student/fees")
def student_fees(student_auth: Dict[str, str] = Depends(require_student)) -> Dict[str, Any]:
    items = get_fee_ledger(student_auth["student_id"])
    return {"items": items}


@app.post("/api/student/fees/{ledger_id}/reminder")
def student_request_fee_reminder(ledger_id: str, student_auth: Dict[str, str] = Depends(require_student)) -> Dict[str, Any]:
    rows = get_fee_ledger(student_auth["student_id"])
    if not any(row.get("_id") == ledger_id for row in rows):
        raise HTTPException(status_code=403, detail="Ledger row does not belong to this student")
    ok = send_fee_reminder(ledger_id, sent_by=student_auth["student_id"])
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to request reminder")
    return {"ok": True}


@app.get("/api/student/documents")
def student_documents(_: Dict[str, str] = Depends(require_student)) -> Dict[str, Any]:
    return {"items": get_all_uploaded_pdfs()}


@app.get("/api/student/documents/{pdf_id}/download")
def student_download_document(pdf_id: str, token: str = "", authorization: str = Header(default="")) -> FileResponse:
    _cleanup_tokens()
    student_auth: Optional[Dict[str, str]] = None
    if authorization.startswith("Bearer "):
        student_auth = _student_tokens.get(authorization.replace("Bearer ", "", 1).strip())
    if not student_auth and token:
        student_auth = _student_tokens.get(token.strip())
    if not student_auth:
        raise HTTPException(status_code=403, detail="Unauthorized student access")

    doc = get_uploaded_pdf_by_id(pdf_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    filename = doc.get("filename", "")
    filepath = os.path.join(UPLOAD_DIR, filename)
    if not filename or not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Document file not found on server")

    record_pdf_download(pdf_id, student_id=student_auth["student_id"], source="student-center")

    download_name = doc.get("original_name") or filename
    return FileResponse(filepath, media_type="application/pdf", filename=download_name)


@app.post("/api/admin/pdfs")
async def admin_upload_pdf(file: UploadFile = File(...), _: None = Depends(require_admin)) -> Dict[str, Any]:
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    save_path = os.path.join(UPLOAD_DIR, file.filename)

    content = await file.read()
    with open(save_path, "wb") as f:
        f.write(content)

    result = PDFProcessor().process_pdf(save_path, file.filename)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "PDF processing failed"))

    record_uploaded_pdf(file.filename, result["pages"], result["chunks"])

    return {
        "ok": True,
        "pages": result["pages"],
        "chunks": result["chunks"],
    }


@app.delete("/api/admin/pdfs/{pdf_id}")
def admin_delete_pdf(pdf_id: str, filename: str = "", _: None = Depends(require_admin)) -> Dict[str, Any]:
    ok = delete_uploaded_pdf_record(pdf_id)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to delete PDF record")

    if filename:
        fp = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(fp):
            os.remove(fp)

    return {"ok": True}
