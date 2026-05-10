from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Numeric, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    company = Column(String(200), nullable=False, index=True)
    role = Column(String(200), nullable=False, index=True)
    location = Column(String(200), nullable=True)
    source = Column(String(100), nullable=True)  # LinkedIn, Naukri, Referral, etc.

    apply_date = Column(Date, nullable=False, index=True)
    status = Column(
        String(20), nullable=False, default="applied", index=True
    )  # applied | interview | offer | rejected | ghosted

    package_text = Column(String(100), nullable=True)  # raw user input "₹8 LPA"
    package_lpa = Column(Numeric(10, 2), nullable=True)  # parsed numeric for analytics

    job_url = Column(String(500), nullable=True)
    jd = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    resume_filename = Column(String(255), nullable=True)
    resume_url = Column(String(500), nullable=True)  # path or URL to stored resume

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="applications")
