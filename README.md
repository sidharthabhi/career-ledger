# Career Ledger

> A premium personal job-application tracker. FastAPI + React + PostgreSQL.

A full-stack web app to track every job you apply to, surface your patterns, and analyze the JDs you collect. Built around the same SCR framing principles you'd use on a resume — context, complication, resolution.

![stack](https://img.shields.io/badge/stack-FastAPI%20%7C%20React%20%7C%20Postgres-d4ff3a?style=flat-square)
![license](https://img.shields.io/badge/license-MIT-6b675c?style=flat-square)

## What's inside

- **Auth** — JWT-based signup/login with bcrypt password hashing
- **CRUD** — Applications with company, role, JD, package, dates, status, source, notes
- **File uploads** — Resume per application (PDF/DOC/DOCX, up to 5MB)
- **Dashboard** — 6 KPIs, 14-day activity chart, pipeline doughnut, recent list
- **Insights** — Role distribution, funnel conversion, source breakdown, JD keyword extraction (overall + per-role)
- **Search & filter** — By company, role, status, role-type
- **Premium UI** — Editorial dark theme, Fraunces + Inter Tight + JetBrains Mono

## Project structure

```
career-ledger/
├── backend/                # FastAPI + SQLAlchemy + PostgreSQL
│   ├── app/
│   │   ├── core/           # config, db, security, deps
│   │   ├── models/         # User, Application
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── routers/        # auth, applications, analytics
│   │   └── main.py
│   ├── requirements.txt
│   ├── render.yaml         # Render deploy config
│   └── .env.example
└── frontend/               # React 18 + Vite
    ├── src/
    │   ├── components/     # Layout, StatusPill
    │   ├── pages/          # Login, Dashboard, Applications, Form, Insights
    │   ├── lib/            # api, auth, toast
    │   └── styles/         # global.css
    ├── package.json
    └── vercel.json         # Vercel SPA rewrites
```

## Local development

### Prerequisites
- Python 3.11+
- Node 18+
- PostgreSQL 14+ running locally (or use Docker)

### 1. Database
```bash
# Option A — Docker
docker run -d --name career-ledger-db \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=career_ledger \
  -p 5432:5432 postgres:16

# Option B — Local Postgres
createdb career_ledger
```

### 2. Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env — set SECRET_KEY (generate via: openssl rand -hex 32)
# DATABASE_URL should match your DB

uvicorn app.main:app --reload --port 8000
```

API runs on `http://localhost:8000`. Auto-generated docs at `http://localhost:8000/docs`.

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

App runs on `http://localhost:5173`. The Vite proxy forwards `/api/*` to the backend.

## Deployment (free tier)

### Backend → Render
1. Push the `backend/` folder to a GitHub repo (or push the whole repo).
2. On [Render](https://render.com) → "New +" → "Blueprint" → connect your repo.
3. Render reads `render.yaml` and creates the web service + free PostgreSQL DB.
4. After deploy, set `CORS_ORIGINS` in the service's env vars to your Vercel URL (e.g. `https://your-app.vercel.app`).
5. Copy the Render service URL (e.g. `https://career-ledger-api.onrender.com`).

> Render's free tier sleeps after 15 min of inactivity; the first request after a sleep takes ~30 sec to wake.

### Frontend → Vercel
1. Push the `frontend/` folder to GitHub.
2. On [Vercel](https://vercel.com) → "New Project" → import the repo (set root directory to `frontend/`).
3. Add environment variable: `VITE_API_BASE` = your Render backend URL.
4. Deploy.

### Connecting them
- Update `CORS_ORIGINS` on Render to include your Vercel domain.
- Update `VITE_API_BASE` on Vercel to your Render API URL.
- Redeploy both.

## API reference

| Method | Path                                          | Description                  |
|--------|-----------------------------------------------|------------------------------|
| POST   | `/api/auth/signup`                            | Create account               |
| POST   | `/api/auth/login`                             | Sign in                      |
| GET    | `/api/auth/me`                                | Current user                 |
| GET    | `/api/applications`                           | List (filters: q, status, role) |
| POST   | `/api/applications`                           | Create                       |
| GET    | `/api/applications/{id}`                      | Get one                      |
| PATCH  | `/api/applications/{id}`                      | Update                       |
| DELETE | `/api/applications/{id}`                      | Delete                       |
| POST   | `/api/applications/{id}/resume`               | Upload resume                |
| GET    | `/api/applications/{id}/resume/download`      | Download resume              |
| GET    | `/api/analytics/dashboard`                    | KPIs + activity + breakdown  |
| GET    | `/api/analytics/insights`                     | Roles, funnel, JD keywords   |

All `/api/applications/*` and `/api/analytics/*` routes require `Authorization: Bearer <token>`.

## Resume positioning (for your portfolio)

> **Career Ledger** — Designed and built a full-stack job-application tracker (FastAPI, React 18, PostgreSQL) with JWT auth, file uploads, and a custom JD-keyword extraction engine that surfaces skill patterns across role types. Deployed free-tier (Render + Vercel) with sub-200ms median API latency.

## License

MIT — use it, modify it, deploy it. Attribution appreciated but not required.
