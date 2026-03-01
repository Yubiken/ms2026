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
    password_hash = Column(String, nullable=False)

    predictions = relationship("Prediction", back_populates="user")


# ==============================
# MATCH
# ==============================

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)

    home_team = Column(String, nullable=False)
    away_team = Column(String, nullable=False)

    # Czas startu w UTC (NAIVE)
    start_time = Column(DateTime, nullable=False)

    # Faza turnieju
    stage = Column(String, nullable=False, default="group")

    # Grupa (A, B, C...) tylko dla fazy grupowej
    group_name = Column(String, nullable=True)

    # Wynik (null dopóki nie zakończony)
    home_score = Column(Integer, nullable=True)
    away_score = Column(Integer, nullable=True)

    is_finished = Column(Boolean, default=False)

    # Czas utworzenia rekordu (naive UTC)
    created_at = Column(DateTime, server_default=func.now())

    predictions = relationship("Prediction", back_populates="match")


# ==============================
# PREDICTION
# ==============================

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))
    match_id = Column(Integer, ForeignKey("matches.id"))

    home_score = Column(Integer, nullable=True)
    away_score = Column(Integer, nullable=True)

    points = Column(Integer, default=0)

    user = relationship("User", back_populates="predictions")
    match = relationship("Match", back_populates="predictions")