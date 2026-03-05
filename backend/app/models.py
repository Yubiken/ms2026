from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


# ==============================
# USER
# ==============================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)

    password_hash = Column(String, nullable=False)

    predictions = relationship(
        "Prediction",
        back_populates="user",
        cascade="all, delete-orphan"
    )


# ==============================
# MATCH
# ==============================

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)

    home_team = Column(String, nullable=False)
    away_team = Column(String, nullable=False)

    # 🔥 TIMEZONE-AWARE UTC
    start_time = Column(DateTime(timezone=True), nullable=False)

    # Faza turnieju
    stage = Column(String, nullable=False, default="group")

    # Grupa (A, B, C...) tylko dla fazy grupowej
    group_name = Column(String, nullable=True)

    # Wynik
    home_score = Column(Integer, nullable=True)
    away_score = Column(Integer, nullable=True)

    is_finished = Column(Boolean, default=False)

    # 🔥 UTC timestamp tworzenia rekordu
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    predictions = relationship(
        "Prediction",
        back_populates="match",
        cascade="all, delete-orphan"
    )


# ==============================
# PREDICTION
# ==============================

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"))

    home_score = Column(Integer, nullable=False)
    away_score = Column(Integer, nullable=False)

    points = Column(Integer, default=0)

    user = relationship("User", back_populates="predictions")
    match = relationship("Match", back_populates="predictions")