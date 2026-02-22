from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from .database import Base
from sqlalchemy.orm import relationship
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    start_time = Column(DateTime, nullable=False)
    home_team = Column(String, nullable=False)
    away_team = Column(String, nullable=False)

    match_date = Column(DateTime, nullable=False)

    # relacja do predictions
    predictions = relationship("Prediction", back_populates="match")

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))
    match_id = Column(Integer, ForeignKey("matches.id"))

    home_score = Column(Integer)
    away_score = Column(Integer)

    user = relationship("User")
    match = relationship("Match", back_populates="predictions")