# EduAgent AI - Multi-Agent Assistant for Academic Administration

<div align="center">

![EduAgent AI Banner](https://img.shields.io/badge/EduAgent_AI-Multi--Agent_Academic_Assistant-7a1f43?style=for-the-badge&logo=googleclassroom&logoColor=white)

[![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.12-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Streamlit](https://img.shields.io/badge/Streamlit-1.46.1-FF4B4B?style=flat-square&logo=streamlit&logoColor=white)](https://streamlit.io)
[![React](https://img.shields.io/badge/React-Student+Admin_UI-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com/atlas)
[![Ollama](https://img.shields.io/badge/Ollama-phi3:mini-black?style=flat-square&logo=ollama&logoColor=white)](https://ollama.com)
[![LangChain](https://img.shields.io/badge/LangChain-1.2.10-1C3C3C?style=flat-square&logo=chainlink&logoColor=white)](https://langchain.com)

**A multi-agent AI helpdesk for students and academic staff, with chat, escalation, fee workflows, exam schedules, and PDF document intelligence.**

[Features](#-features) • [Architecture](#-system-architecture) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Usage](#-usage)

</div>

---

## Overview

EduAgent AI centralizes academic support in one platform:
- Student asks queries in natural language
- AI routes, retrieves, and responds using institutional data
- Sensitive queries are escalated to admin
- Admin manages FAQs, schedules, fees, and documents

It supports MongoDB Atlas as primary storage, with local fallback support to keep the app usable during network/TLS issues.

---

## Features

### Student Side
- Student login using student ID or enrollment number
- AI chat for exams, fees, attendance, scholarships, admissions, library
- Intelligent PDF/document matching and download links
- Fee ledger view and reminder requests
- Reminder center with unread tracking

### Admin Side
- Protected admin login
- Live metrics for FAQs, escalations, PDFs, exams, fees
- Full FAQ CRUD
- Escalation triage and status updates
- Exam timetable management
- Fee structure management
- Student fee-ledger management + reminders
- PDF upload, processing, and download analytics

### AI Agent Pipeline
- Query Understanding Agent
- Information Retrieval Agent
- Response Generation Agent (local Ollama model)
- Escalation Agent
- PDF matcher/download intent flow

---

## System Architecture

```text
Student Query
    |
    v
+-----------------------------------------------+
| EduAgent AI Pipeline                          |
|                                               |
| 1) Escalation Agent -> Sensitive? -> Admin DB |
|                 | No                          |
|                 v                             |
| 2) Download Intent + PDF Matcher              |
|                 |                             |
|                 v                             |
| 3) Query Understanding Agent                  |
|                 | (category + keywords)       |
|                 v                             |
| 4) Retrieval Agent                            |
|    -> FAQs / exams / fees / PDF context       |
|                 v                             |
| 5) Response Agent (phi3:mini via Ollama)      |
|                 v                             |
| Final answer (+ download links when relevant) |
+-----------------------------------------------+
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Backend API | FastAPI, Uvicorn | Auth, chat, admin/student endpoints |
| AI Runtime | Ollama + phi3:mini | Local response generation |
| Agentic Logic | Python modules (`agents/`) | Classification, retrieval, escalation |
| Data Store | MongoDB Atlas / Mongita fallback | App data persistence |
| Document Intelligence | LangChain, sentence-transformers, FAISS/Chroma flow | PDF chunking and semantic retrieval |
| Web UI (legacy) | Streamlit | Student + admin pages |
| Web UI (modern) | React + Vite + TypeScript | Student app (`UI`) + admin app (`UI-admin`) |

---

## Project Structure

```text
EduAgent_AI/
|
|- backend_api.py
|- app.py
|- start_llm.py
|- requirements.txt
|- .env                  (ignored)
|
|- agents/
|  |- query_agent.py
|  |- retrieval_agent.py
|  |- response_agent.py
|  |- escalation_agent.py
|
|- database/
|  |- mongo_db.py
|  |- seed_mongodb.py
|  |- db_setup.py
|  |- academic_data.py
|
|- utils/
|  |- pdf_processor.py
|
|- pages/
|  |- student_chat.py
|  |- admin_panel.py
|
|- UI/                  (React student frontend)
|- UI-admin/            (React admin frontend)
|- uploaded_pdfs/       (ignored)
|- vector_db/           (ignored)
```

---

## Getting Started

### Prerequisites
- Python 3.13+
- Node.js (for React frontends)
- Ollama installed
- MongoDB Atlas cluster (optional if using local fallback)

### 1) Clone

```bash
git clone https://github.com/Yuvrajpawar45/EduAgent_AI.git
cd EduAgent_AI
```

### 2) Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 3) Configure Environment

Create `.env`:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/?appName=Cluster
MONGO_DB_NAME=eduagent_db
ADMIN_PASSWORD=admin123

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=phi3:mini

MONGO_FALLBACK_LOCAL=true
```

### 4) Pull LLM Model

```bash
ollama pull phi3:mini
```

### 5) Seed Data

```bash
python database/seed_mongodb.py
```

### 6) Run Backend

```bash
python -m uvicorn backend_api:app --reload --port 8000
```

### 7) Run Frontends

Student UI:
```bash
cd UI
npm install
npm run dev
```

Admin UI:
```bash
cd UI-admin
npm install
npm run dev
```

Optional Streamlit:
```bash
streamlit run app.py
```

---

## Usage

### Student
1. Login with enrollment/student ID and password
2. Ask academic questions in chat
3. Open document downloads when suggested by AI
4. Track fees and reminders

### Admin
1. Login from admin panel
2. Review escalated queries
3. Manage FAQs, timetable, fees, and PDFs
4. Monitor download activity and fee reminders

---

## Notes on Atlas vs Local Fallback

- If Atlas is reachable, data is stored in your Atlas DB (default `eduagent_db`)
- If Atlas fails (TLS/network), app can fallback to local Mongita
- Local fallback location on Windows: `C:\Users\<username>\.mongita`

Set `MONGO_FALLBACK_LOCAL=false` if you want strict Atlas-only behavior.

---

## Future Enhancements

- Role-based accounts and permissions
- Payment reconciliation workflows
- Automated reminders with scheduling rules
- Hall-ticket generation flow
- Notification center (in-app/email/SMS)
- Analytics and audit logs

---

## Author

Maintained by **Yuvraj Pawar**  
GitHub: [Yuvrajpawar45](https://github.com/Yuvrajpawar45)

---

## License

Use according to your repository license policy.
