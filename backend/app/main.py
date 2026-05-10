from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import engine, Base
from app.models import User, Application  # noqa: F401  (register models)
from app.routers import auth, applications, analytics


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create tables on startup (dev convenience; use Alembic in production)
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Backend API for Career Ledger — a personal job-application tracker.",
    lifespan=lifespan,
)

# CORS
origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["root"])
def root():
    return {"app": settings.app_name, "status": "ok", "docs": "/docs"}


@app.get("/health", tags=["root"])
def health():
    return {"status": "healthy"}


app.include_router(auth.router)
app.include_router(applications.router)
app.include_router(analytics.router)
