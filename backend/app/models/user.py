from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(120), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    applications = relationship(
        "Application", back_populates="user", cascade="all, delete-orphan"
    )
