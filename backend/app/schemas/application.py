from pydantic import BaseModel, Field
from typing import Optional, Literal, List, Dict
from datetime import date, datetime
from decimal import Decimal


StatusType = Literal["applied", "interview", "offer", "rejected", "ghosted"]


class ApplicationBase(BaseModel):
    company: str = Field(min_length=1, max_length=200)
    role: str = Field(min_length=1, max_length=200)
    apply_date: date
    status: StatusType = "applied"
    location: Optional[str] = Field(default=None, max_length=200)
    source: Optional[str] = Field(default=None, max_length=100)
    package_text: Optional[str] = Field(default=None, max_length=100)
    package_lpa: Optional[Decimal] = None
    job_url: Optional[str] = Field(default=None, max_length=500)
    jd: Optional[str] = None
    notes: Optional[str] = None


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationUpdate(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    apply_date: Optional[date] = None
    status: Optional[StatusType] = None
    location: Optional[str] = None
    source: Optional[str] = None
    package_text: Optional[str] = None
    package_lpa: Optional[Decimal] = None
    job_url: Optional[str] = None
    jd: Optional[str] = None
    notes: Optional[str] = None


class ApplicationOut(ApplicationBase):
    id: int
    user_id: int
    resume_filename: Optional[str] = None
    resume_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============= Analytics Schemas =============

class StatsKPI(BaseModel):
    total: int
    this_week: int
    this_month: int
    interviews: int
    offers: int
    response_rate: float


class ActivityPoint(BaseModel):
    date: str
    count: int


class StatusBreakdown(BaseModel):
    applied: int
    interview: int
    offer: int
    rejected: int
    ghosted: int


class RoleCount(BaseModel):
    role: str
    count: int


class SourceCount(BaseModel):
    source: str
    count: int


class KeywordCount(BaseModel):
    keyword: str
    count: int


class FunnelData(BaseModel):
    applied: int
    interview: int
    offer: int


class DashboardResponse(BaseModel):
    kpi: StatsKPI
    activity: List[ActivityPoint]
    status_breakdown: StatusBreakdown
    recent: List[ApplicationOut]


class InsightsResponse(BaseModel):
    roles: List[RoleCount]
    sources: List[SourceCount]
    funnel: FunnelData
    keywords_overall: List[KeywordCount]
    keywords_by_role: Dict[str, List[KeywordCount]]
