import re
from datetime import date, timedelta, datetime
from collections import Counter
from typing import Optional, List, Dict, Tuple
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import User, Application
from app.schemas.application import (
    ApplicationOut,
    DashboardResponse,
    StatsKPI,
    ActivityPoint,
    StatusBreakdown,
    InsightsResponse,
    RoleCount,
    SourceCount,
    KeywordCount,
    FunnelData,
)

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


# ============= Stop-words for keyword extraction =============
STOPWORDS = set("""
a an and are as at be been being but by for from has have having he her him his i if in into is it
its just like may me more most must my no nor not of on once only or other our out over own same
she should so some such than that the their them then there these they this those through to too
under until up upon us very was we were what when where which while who whom why will with would
you your yours about above after again against all am any because before below between both did
do does doing down during each few further i'd i'll i'm i've ll ourselves yourselves themselves
that's there's they'll they're they've we're we've what's where's who's how's would shouldn't
can't won't isn't aren't wasn't weren't doesn't didn't shall might must one two three four five
six seven eight nine ten able ability also etc eg ie work years year experience candidate role
position job opportunity company team strong good great excellent ability skills skill required
preferred plus must qualifications qualification requirement requirements responsibility
responsibilities about overview description summary join apply applying day days week weeks month
months bachelor master degree end equivalent across willing per via etc looking seeking able
knowledge understanding using used use including include includes hands on level high low new
""".split())

PHRASES = [
    "power bi", "machine learning", "deep learning", "data visualization", "data analysis",
    "data analytics", "data engineering", "data science", "data warehouse", "sql server",
    "google sheets", "google analytics", "agile methodology", "version control", "rest api",
    "rest apis", "natural language", "business intelligence", "statistical analysis",
    "a/b testing", "time series", "etl pipeline", "etl pipelines", "scikit-learn",
    "google cloud", "aws cloud", "data modeling", "stored procedures", "communication skills",
    "problem solving", "stakeholder management", "dimensional modeling", "looker studio",
    "advanced excel", "google bigquery", "snowflake warehouse", "data pipelines",
]


def extract_keywords(text: str, limit: int = 30) -> List[Tuple[str, int]]:
    if not text:
        return []
    lower = " " + text.lower() + " "
    counts: Counter = Counter()

    # Multi-word phrases
    for p in PHRASES:
        pattern = r"\b" + re.escape(p) + r"\b"
        matches = re.findall(pattern, lower)
        if matches:
            counts[p] = len(matches)

    # Single tokens
    cleaned = re.sub(r"[^a-z0-9+#./\- ]", " ", lower)
    for word in cleaned.split():
        word = word.strip(".-")
        if len(word) < 3 or len(word) > 25:
            continue
        if word in STOPWORDS:
            continue
        if word.isdigit():
            continue
        counts[word] += 1

    return counts.most_common(limit)


# ============= Dashboard =============

@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    apps = db.query(Application).filter(Application.user_id == current_user.id).all()
    today = date.today()

    total = len(apps)
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    this_week = sum(1 for a in apps if a.apply_date >= week_ago)
    this_month = sum(1 for a in apps if a.apply_date >= month_ago)

    interviews = sum(1 for a in apps if a.status in ("interview", "offer"))
    offers = sum(1 for a in apps if a.status == "offer")
    responded = sum(1 for a in apps if a.status not in ("applied", "ghosted"))
    response_rate = round((responded / total * 100), 1) if total else 0.0

    kpi = StatsKPI(
        total=total,
        this_week=this_week,
        this_month=this_month,
        interviews=interviews,
        offers=offers,
        response_rate=response_rate,
    )

    # 14-day activity
    activity = []
    for i in range(13, -1, -1):
        d = today - timedelta(days=i)
        cnt = sum(1 for a in apps if a.apply_date == d)
        activity.append(ActivityPoint(date=d.isoformat(), count=cnt))

    breakdown = StatusBreakdown(
        applied=sum(1 for a in apps if a.status == "applied"),
        interview=sum(1 for a in apps if a.status == "interview"),
        offer=sum(1 for a in apps if a.status == "offer"),
        rejected=sum(1 for a in apps if a.status == "rejected"),
        ghosted=sum(1 for a in apps if a.status == "ghosted"),
    )

    recent = sorted(apps, key=lambda a: (a.apply_date, a.id), reverse=True)[:5]

    return DashboardResponse(
        kpi=kpi,
        activity=activity,
        status_breakdown=breakdown,
        recent=[ApplicationOut.model_validate(a) for a in recent],
    )


# ============= Insights =============

@router.get("/insights", response_model=InsightsResponse)
def get_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    apps = db.query(Application).filter(Application.user_id == current_user.id).all()

    # Roles (interests)
    role_counter = Counter(a.role for a in apps)
    roles = [RoleCount(role=r, count=c) for r, c in role_counter.most_common(10)]

    # Sources (channels)
    source_counter = Counter(a.source or "Unknown" for a in apps)
    sources = [SourceCount(source=s, count=c) for s, c in source_counter.most_common()]

    # Funnel
    applied_n = len(apps)
    interview_n = sum(1 for a in apps if a.status in ("interview", "offer"))
    offer_n = sum(1 for a in apps if a.status == "offer")
    funnel = FunnelData(applied=applied_n, interview=interview_n, offer=offer_n)

    # Overall keywords
    all_jds = " ".join(a.jd for a in apps if a.jd)
    overall = [KeywordCount(keyword=k, count=c) for k, c in extract_keywords(all_jds, 25)]

    # Per-role keywords
    per_role: Dict[str, List[KeywordCount]] = {}
    for role in role_counter:
        role_jds = " ".join(a.jd for a in apps if a.role == role and a.jd)
        if role_jds:
            per_role[role] = [
                KeywordCount(keyword=k, count=c) for k, c in extract_keywords(role_jds, 15)
            ]

    return InsightsResponse(
        roles=roles,
        sources=sources,
        funnel=funnel,
        keywords_overall=overall,
        keywords_by_role=per_role,
    )
