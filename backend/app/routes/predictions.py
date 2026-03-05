from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, Field
from datetime import datetime, timezone

from ..database import get_db
from ..models import Prediction, Match, User
from .users import get_current_user

import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(tags=["Predictions"])


# ==============================
# SCHEMAS
# ==============================

class PredictionCreate(BaseModel):
    match_id: int
    home_score: int = Field(..., ge=0, le=20)
    away_score: int = Field(..., ge=0, le=20)


class PredictionUpdate(BaseModel):
    home_score: int = Field(..., ge=0, le=20)
    away_score: int = Field(..., ge=0, le=20)


class MatchResult(BaseModel):
    home_score: int
    away_score: int


# ==============================
# UTC HELPER
# ==============================

def to_utc(dt: datetime) -> datetime:
    """
    Zawsze zwracamy timezone-aware UTC datetime
    """
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


# ==============================
# CREATE PREDICTION
# ==============================

@router.post("/predictions")
def create_prediction(
    prediction: PredictionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    match = db.query(Match).filter(Match.id == prediction.match_id).first()

    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    now = datetime.now(timezone.utc)
    match_start = to_utc(match.start_time)

    if now >= match_start:
        raise HTTPException(
            status_code=400,
            detail="Typowanie zamknięte – mecz już się rozpoczął"
        )

    existing = db.query(Prediction).filter(
        Prediction.user_id == current_user.id,
        Prediction.match_id == prediction.match_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Prediction already exists"
        )

    new_prediction = Prediction(
        user_id=current_user.id,
        match_id=prediction.match_id,
        home_score=prediction.home_score,
        away_score=prediction.away_score,
        points=0
    )

    db.add(new_prediction)
    db.commit()

    logger.info(f"Prediction created user={current_user.id} match={match.id}")

    return {"message": "Prediction added"}


# ==============================
# UPDATE PREDICTION
# ==============================

@router.put("/predictions/{prediction_id}")
def update_prediction(
    prediction_id: int,
    data: PredictionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    prediction = db.query(Prediction).filter(
        Prediction.id == prediction_id
    ).first()

    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")

    if prediction.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="To nie Twój typ")

    match = db.query(Match).filter(
        Match.id == prediction.match_id
    ).first()

    now = datetime.now(timezone.utc)
    match_start = to_utc(match.start_time)

    if now >= match_start:
        raise HTTPException(
            status_code=400,
            detail="Typowanie zamknięte – mecz już się rozpoczął"
        )

    prediction.home_score = data.home_score
    prediction.away_score = data.away_score

    db.commit()

    logger.info(f"Prediction updated user={current_user.id}")

    return {"message": "Prediction updated"}


# ==============================
# MY PREDICTIONS
# ==============================

@router.get("/my-predictions")
def get_my_predictions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    predictions = (
        db.query(Prediction)
        .join(Match)
        .filter(Prediction.user_id == current_user.id)
        .all()
    )

    return [
        {
            "id": p.id,
            "match_id": p.match.id,
            "home_team": p.match.home_team,
            "away_team": p.match.away_team,
            "start_time": p.match.start_time,
            "is_finished": p.match.is_finished,
            "final_home_score": p.match.home_score,
            "final_away_score": p.match.away_score,
            "prediction_home": p.home_score,
            "prediction_away": p.away_score,
            "points": p.points
        }
        for p in predictions
    ]


# ==============================
# CALCULATE POINTS
# ==============================

def calculate_points(prediction: Prediction, match: Match) -> int:

    if (
        prediction.home_score == match.home_score
        and prediction.away_score == match.away_score
    ):
        return 2

    real_diff = match.home_score - match.away_score
    pred_diff = prediction.home_score - prediction.away_score

    if (
        (real_diff > 0 and pred_diff > 0)
        or (real_diff < 0 and pred_diff < 0)
        or (real_diff == 0 and pred_diff == 0)
    ):
        return 1

    return 0


# ==============================
# FINISH MATCH
# ==============================

@router.post("/matches/{match_id}/finish")
def finish_match(
    match_id: int,
    result: MatchResult,
    db: Session = Depends(get_db)
):

    match = db.query(Match).filter(Match.id == match_id).first()

    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if match.is_finished:
        raise HTTPException(status_code=400, detail="Match already finished")

    match.home_score = result.home_score
    match.away_score = result.away_score
    match.is_finished = True

    predictions = db.query(Prediction).filter(
        Prediction.match_id == match_id
    ).all()

    for prediction in predictions:
        prediction.points = calculate_points(prediction, match)

    db.commit()

    return {"message": "Match finished and points calculated"}


# ==============================
# LEADERBOARD
# ==============================

@router.get("/leaderboard")
def leaderboard(db: Session = Depends(get_db)):

    results = (
        db.query(
            User.id,
            User.username,
            func.coalesce(func.sum(Prediction.points), 0).label("total_points")
        )
        .outerjoin(Prediction, Prediction.user_id == User.id)
        .group_by(User.id)
        .order_by(func.sum(Prediction.points).desc())
        .all()
    )

    return [
        {
            "position": index + 1,
            "user_id": r.id,
            "username": r.username,
            "points": int(r.total_points)
        }
        for index, r in enumerate(results)
    ]


# ==============================
# VIEW ALL PREDICTIONS (AFTER START)
# ==============================

@router.get("/matches/{match_id}/predictions")
def get_match_predictions(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    match = db.query(Match).filter(Match.id == match_id).first()

    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    now = datetime.now(timezone.utc)
    match_start = to_utc(match.start_time)

    if now < match_start:
        raise HTTPException(
            status_code=403,
            detail="Predictions visible only after match start"
        )

    predictions = (
        db.query(Prediction)
        .join(User)
        .filter(Prediction.match_id == match_id)
        .all()
    )

    return [
        {
            "username": p.user.username,
            "prediction": f"{p.home_score}:{p.away_score}",
            "points": p.points if match.is_finished else None
        }
        for p in predictions
    ]