# EduAgent AI

<div align="center">

![EduAgent AI](https://img.shields.io/badge/EduAgent_AI-Multi--Agent_Academic_Assistant-7a1f43?style=for-the-badge&logo=googleclassroom&logoColor=white)

[![Python](https://img.shields.io/badge/Python-3.13+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-Vite_UI-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas_/_Local-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Ollama](https://img.shields.io/badge/Ollama-phi3:mini-black?style=flat-square)](https://ollama.com)

**A multi-agent academic assistant for student support, admin workflows, fee reminders, exam data, escalations, and PDF document intelligence.**

[Features](#features) | [Architecture](#architecture) | [Tech Stack](#tech-stack) | [Setup](#setup) | [Usage](#usage)

</div>

---

## Overview

EduAgent AI is an academic helpdesk platform that combines a FastAPI backend, React dashboards, MongoDB storage, local LLM responses through Ollama, and a small multi-agent pipeline.

Students can log in, ask academic questions, view fee details, request reminders, and download relevant documents. Admin users can manage FAQs, escalations, fee records, exam schedules, uploaded PDFs, and student reminders.

The project supports MongoDB Atlas for production-style storage and a local Mongita fallback for development.

## Features

### Student App

- Student login using enrollment number or student ID
- AI chat for exams, fees, attendance, scholarships, admissions, library, and general academic queries
- PDF/document suggestions with download links
- Student fee ledger view
- Fee reminder requests
- Reminder center with unread tracking

### Admin App

- Admin login
- Dashboard metrics for FAQs, escalations, PDFs, exams, fees, students, and ledger entries
- FAQ create, update, and delete workflows
- Escalation review and status updates
- Exam timetable management
- Fee structure and per-student fee ledger management
- PDF upload, processing, deletion, and download analytics
- Fee reminder sending

### AI Pipeline

- Query Understanding Agent
- Information Retrieval Agent
- Response Generation Agent using Ollama
- Escalation Agent for sensitive queries
- PDF matching and download-intent handling

## Architecture

```text
Student Query
    |
    v
+------------------------------------------------+
| EduAgent AI Backend                            |
|                                                |
| 1. Escalation Agent                            |
|    -> Sensitive query? -> Save for admin       |
|                                                |
| 2. PDF Download Intent + Document Matcher      |
|                                                |
| 3. Query Understanding Agent                   |
|    -> Category + keywords                      |
|                                                |
| 4. Retrieval Agent                             |
|    -> FAQs / exams / fees / PDFs              |
|                                                |
| 5. Response Agent                              |
|    -> phi3:mini through Ollama                 |
|                                                |
| 6. Final answer + relevant links               |
+------------------------------------------------+
```

## Tech Stack

| Layer | Technology |
| --- | --- |
| Backend API | FastAPI, Uvicorn |
| AI runtime | Ollama with `phi3:mini` |
| Agent logic | Python modules in `agents/` |
| Database | MongoDB Atlas with Mongita fallback |
| PDF processing | LangChain, pypdf, sentence-transformers, FAISS |
| Student UI | React, Vite, TypeScript, Tailwind CSS |
| Admin UI | React, Vite, TypeScript, Tailwind CSS |
| Legacy UI | Streamlit |

## Project Structure

```text
EduAgent_AI/
|-- backend_api.py              # FastAPI backend
|-- app.py                      # Streamlit legacy app
|-- start_llm.py                # Ollama helper script
|-- requirements.txt            # Python dependencies
|-- agents/                     # Query, retrieval, response, escalation agents
|-- database/                   # MongoDB helpers and seed data
|-- pages/                      # Streamlit pages
|-- utils/                      # PDF processing utilities
|-- UI/                         # Student React frontend
|-- UI-admin/                   # Admin React frontend
|-- uploaded_pdfs/              # Local uploaded PDFs, ignored by git
`-- vector_db/                  # Local vector data, ignored by git
```

## Setup

### Prerequisites

- Python 3.13+
- Node.js 20+ recommended
- Ollama installed and running
- MongoDB Atlas connection string, or local fallback enabled

### 1. Clone the Repository

```bash
git clone https://github.com/Yuvrajpawar45/EduAgent_AI.git
cd EduAgent_AI
```

### 2. Create a Python Environment

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

On macOS/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/?appName=Cluster
MONGO_DB_NAME=eduagent_db
MONGO_FALLBACK_LOCAL=true

ADMIN_PASSWORD=admin123
```

Important: keep `.env` private. It is already ignored by git.

### 4. Start Ollama

```bash
ollama pull phi3:mini
ollama serve
```

If Ollama is already running in the background, only the `ollama pull phi3:mini` command is needed once.

### 5. Seed Demo Data

```bash
python database/seed_mongodb.py
```

### 6. Run the Backend

```bash
python -m uvicorn backend_api:app --reload --port 8000
```

Backend API:

```text
http://localhost:8000
```

### 7. Run the Student UI

```bash
cd UI
npm install
npm run dev
```

Default URL:

```text
http://localhost:5173
```

### 8. Run the Admin UI

Open a new terminal:

```bash
cd UI-admin
npm install
npm run dev
```

Vite will print the local admin URL, commonly:

```text
http://localhost:5174
```

## Usage

### Demo Student Login

After seeding demo data, use one of these accounts:

| Enrollment No | Student ID | Password |
| --- | --- | --- |
| `ENR001` | `STU-2024-001` | `stu123` |
| `ENR002` | `STU-2024-002` | `stu123` |
| `ENR003` | `STU-2024-003` | `stu123` |

### Demo Admin Login

Use the value from your `.env`:

```text
admin123
```

Change `ADMIN_PASSWORD` before using the project outside local development.

## Optional Streamlit App

The repository also includes a legacy Streamlit interface:

```bash
streamlit run app.py
```

## Frontend API Configuration

Both React apps use this backend URL by default:

```text
http://localhost:8000
```

To override it, create `.env` files inside `UI/` or `UI-admin/`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

For the admin app, you can also override the student app link:

```env
VITE_CHAT_APP_URL=http://localhost:5173
```

## Notes for GitHub

- Do not commit `.env`, database files, uploaded PDFs, vector databases, logs, or `node_modules`.
- Uploaded PDFs are stored in `uploaded_pdfs/` during local development.
- Vector data is stored in `vector_db/` during local development.
- MongoDB Atlas is recommended when sharing the project across machines.
- The default demo passwords are for development only.

## Future Improvements

- Role-based admin permissions
- Stronger password hashing and account management
- Email/SMS notification delivery
- Payment reconciliation workflows
- Hall ticket generation
- Audit logs and analytics export
- Automated tests for backend endpoints and agent behavior

## Author

Maintained by **Yuvraj Pawar**

GitHub: [Yuvrajpawar45](https://github.com/Yuvrajpawar45)

## License

No license file is currently included. Add a license before allowing public reuse or contributions.
