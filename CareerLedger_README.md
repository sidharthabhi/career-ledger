# Career Ledger

A full-stack SaaS for tracking job applications through their lifecycle — from "applied" to "offer" — with a live analytics dashboard.

**Live:** https://career-ledger-taupe.vercel.app

> ⚠️ Before you commit this: check every line against your actual code. Remove anything the repo doesn't do. An accurate short README beats an impressive wrong one.

---

## What it does

Users register, log in, and manage their job applications privately. Each application moves through stages (Applied → Interview → Offer / Rejected), and the dashboard visualizes pipeline status and response rates with Chart.js.

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, React Hooks, Context API, Tailwind CSS, Chart.js |
| Backend | FastAPI (Python), JWT authentication, RESTful API |
| Database | PostgreSQL (via SQLAlchemy) |
| Deployment | Frontend on Vercel · Backend on Render |

## Key features

- **JWT auth lifecycle** — register, login, token-based protected routes
- **Per-user data isolation** — every query is scoped to the authenticated user
- **RESTful CRUD** — create, read, update, delete applications
- **Analytics dashboard** — stage breakdown and response-rate charts
- **Auto-generated API docs** — FastAPI Swagger UI at `/docs`

## Architecture

```
React (Vercel)  ──HTTP + Bearer JWT──>  FastAPI (Render)  ──SQLAlchemy──>  PostgreSQL
```

1. User logs in → backend verifies password hash → issues a signed JWT
2. Frontend attaches `Authorization: Bearer <token>` on every protected request
3. FastAPI verifies the token, identifies the user, and returns only that user's data
4. React stores the response in state and renders the list + charts

## Running locally

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload      # API at http://localhost:8000, docs at /docs

# Frontend
cd frontend
npm install
npm run dev                    # app at http://localhost:5173
```

Set your environment variables (database URL, JWT secret) in a `.env` file — see `.env.example`.

## API overview

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Get JWT |
| GET | `/applications` | List the user's applications |
| POST | `/applications` | Add an application |
| PUT | `/applications/{id}` | Update stage/details |
| DELETE | `/applications/{id}` | Remove an application |

*(Adjust these to match your real routes.)*

## Notes

Built for correctness and a clean end-to-end auth flow first. Known next steps for scale: DB indexing on `user_id`/`status`, pagination on the applications list, and moving JWT storage to httpOnly cookies with a refresh-token flow.
