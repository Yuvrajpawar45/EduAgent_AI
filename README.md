# EduAgent AI

EduAgent AI is a full-stack academic assistant platform with:
- Student chat + student self-service panel
- Admin operations dashboard
- FastAPI backend
- Multi-agent response pipeline
- PDF-based RAG search
- MongoDB Atlas support with local fallback

## Features

- Student authentication (student ID / enrollment + password)
- AI chat for exam, fees, attendance, scholarship, admission, and policy queries
- Escalation detection for sensitive cases
- Admin management for:
  - FAQs
  - Exam timetable
  - Fee structure
  - Escalated cases
  - Students + fee ledger
  - PDF upload and document download tracking

## Project Structure

- `backend_api.py` - FastAPI backend (auth, chat, admin/student APIs)
- `agents/` - query, retrieval, response, escalation agents
- `database/` - Mongo access layer and seed scripts
- `utils/pdf_processor.py` - PDF chunking + vector search
- `app.py` + `pages/` - Streamlit interface
- `UI/` - React student frontend
- `UI-admin/` - React admin frontend

## Tech Stack

- Backend: FastAPI, Uvicorn, Python
- AI/RAG: LangChain, sentence-transformers, FAISS/Chroma style vector flow
- Database: MongoDB Atlas (primary), Mongita local fallback
- Frontend: React + Vite + TypeScript
- Optional local LLM runtime: Ollama (`phi3:mini`)

## Environment Variables

Create `.env` in project root:

```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/?appName=Cluster
MONGO_DB_NAME=eduagent_db
ADMIN_PASSWORD=admin123

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=phi3:mini

# Optional: set false to force Atlas only (disable local fallback)
MONGO_FALLBACK_LOCAL=true
```

Do not commit `.env` (already protected by `.gitignore`).

## Setup

### 1. Python dependencies

```bash
pip install -r requirements.txt
```

### 2. Backend

```bash
python -m uvicorn backend_api:app --reload --port 8000
```

### 3. Frontend (Student)

```bash
cd UI
npm install
npm run dev
```

### 4. Frontend (Admin)

```bash
cd UI-admin
npm install
npm run dev
```

### 5. Optional Streamlit UI

```bash
streamlit run app.py
```

## Seed Demo Data

You can seed baseline academic data:

```bash
python database/seed_mongodb.py
```

Or log in once through admin/student APIs/UI (backend also seeds demo records).

## Default Demo Credentials

- Admin password: value from `ADMIN_PASSWORD` in `.env`
- Student sample:
  - `ENR001` / `stu123`
  - `STU-2024-001` / `stu123`

## Atlas vs Local Fallback

If Atlas is unreachable (for example TLS/network issue), backend falls back to local Mongita so app remains usable.

- Local fallback storage location (Windows): `C:\Users\<YourUser>\.mongita`
- Set `MONGO_FALLBACK_LOCAL=false` to force Atlas-only mode.

## API Health Check

```bash
GET http://localhost:8000/api/health
```

## Security Notes

- Never commit `.env`, secrets, DB URIs, or access tokens
- Keep Atlas IP access restricted in production
- Rotate credentials if exposed

## Roadmap

See `PROJECT_ROADMAP.md` for planned upgrades.
