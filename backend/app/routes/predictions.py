from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from sqlalchemy import func
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
    match_id: int = Field(..., description="ID meczu")
    home_score: int = Field(..., ge=0, le=20, description="Gole gospodarzy (0-20)")
    away_score: int = Field(..., ge=0, le=20, description="Gole gości (0-20)")


class PredictionUpdate(BaseModel):
    home_score: int = Field(..., ge=0, le=20, description="Nowa liczba goli gospodarzy")
    away_score: int = Field(..., ge=0, le=20, description="Nowa liczba goli gości")


class MatchResult(BaseModel):
    home_score: int
    away_score: int


# ==============================
# POMOCNICZA FUNKCJA UTC
# ==============================

def to_utc(dt: datetime) -> datetime:
    """
    SQLite zwraca naive datetime
    Konwertujemy zawsze do UTC aware datetime
    """
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


# ==============================
# DODANIE TYPU
# ==============================

@router.post(
    "/predictions",
    summary="Dodaj typ meczu",
    description="Zapisuje typ wyniku dla wybranego meczu. Możliwe tylko przed rozpoczęciem meczu."
)
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

    # blokada po rozpoczęciu meczu
    if now >= match_start:
        logger.warning(
            f"User {current_user.id} tried to bet after match start {match.id}"
        )
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
    db.refresh(new_prediction)

    logger.info(
        f"Prediction created: user={current_user.id}, match={match.id}"
    )

    return {
        "message": "Prediction added",
        "prediction_id": new_prediction.id
    }


# ==============================
# EDYCJA TYPU
# ==============================

@router.put(
    "/predictions/{prediction_id}",
    summary="Edytuj typ meczu",
    description="Pozwala edytować własny typ, ale tylko przed rozpoczęciem meczu."
)
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
        raise HTTPException(
            status_code=404,
            detail="Prediction not found"
        )

    # sprawdź właściciela
    if prediction.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="To nie Twój typ"
        )

    match = db.query(Match).filter(
        Match.id == prediction.match_id
    ).first()

    now = datetime.now(timezone.utc)
    match_start = to_utc(match.start_time)

    if now >= match_start:
        logger.warning(
            f"User {current_user.id} tried to edit after match start {match.id}"
        )
        raise HTTPException(
            status_code=400,
            detail="Typowanie zamknięte – mecz już się rozpoczął"
        )

    prediction.home_score = data.home_score
    prediction.away_score = data.away_score

    db.commit()
    db.refresh(prediction)

    logger.info(
        f"Prediction updated: user={current_user.id}, match={match.id}"
    )

    return {
        "message": "Prediction updated"
    }


# ==============================
# MOJE TYPY
# ==============================

@router.get(
    "/my-predictions",
    summary="Pobierz moje typy",
    description="Zwraca wszystkie typy aktualnie zalogowanego użytkownika."
)
def get_my_predictions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    predictions = db.query(Prediction).filter(
        Prediction.user_id == current_user.id
    ).all()

    return [
        {
            "id": p.id,
            "match": f"{p.match.home_team} vs {p.match.away_team}",
            "prediction": f"{p.home_score}:{p.away_score}",
            "points": p.points
        }
        for p in predictions
    ]


# ==============================
# LICZENIE PUNKTÓW
# ==============================

def calculate_points(prediction: Prediction, match: Match) -> int:
    """
    1 pkt – poprawny zwycięzca / remis
    +1 pkt – dokładny wynik
    max 2 pkt
    """

    real_home = match.home_score
    real_away = match.away_score

    pred_home = prediction.home_score
    pred_away = prediction.away_score

    # dokładny wynik
    if pred_home == real_home and pred_away == real_away:
        logger.info(f"Exact score hit for prediction {prediction.id}")
        return 2

    real_diff = real_home - real_away
    pred_diff = pred_home - pred_away

    if (
        (real_diff > 0 and pred_diff > 0)
        or (real_diff < 0 and pred_diff < 0)
        or (real_diff == 0 and pred_diff == 0)
    ):
        logger.info(f"Correct winner/draw for prediction {prediction.id}")
        return 1

    return 0


# ==============================
# ZAMKNIJ MECZ I NALICZ PUNKTY
# ==============================

@router.post(
    "/matches/{match_id}/finish",
    summary="Zamknij mecz i nalicz punkty",
    description="Ustawia wynik meczu i automatycznie nalicza punkty."
)
def finish_match(
    match_id: int,
    result: MatchResult,
    db: Session = Depends(get_db)
):

    match = db.query(Match).filter(
        Match.id == match_id
    ).first()

    if not match:
        raise HTTPException(
            status_code=404,
            detail="Match not found"
        )

    if match.is_finished:
        raise HTTPException(
            status_code=400,
            detail="Match already finished"
        )

    match.home_score = result.home_score
    match.away_score = result.away_score
    match.is_finished = True

    predictions = db.query(Prediction).filter(
        Prediction.match_id == match_id
    ).all()

    logger.info(f"Finishing match {match_id}")

    for prediction in predictions:

        points = calculate_points(prediction, match)

        prediction.points = points

        logger.info(
            f"Prediction {prediction.id} user={prediction.user_id} points={points}"
        )

    db.commit()

    return [
        {
            "prediction_id": p.id,
            "user_id": p.user_id,
            "points": p.points
        }
        for p in predictions
    ]

# ==============================
# LEADERBOARD
# ==============================

@router.get(
    "/leaderboard",
    summary="Tabela wyników",
    description="Zwraca ranking użytkowników według liczby zdobytych punktów."
)
def leaderboard(db: Session = Depends(get_db)):

    results = (
        db.query(
            User.id,
            User.email,
            func.coalesce(func.sum(Prediction.points), 0).label("total_points")
        )
        .outerjoin(Prediction, Prediction.user_id == User.id)
        .group_by(User.id)
        .order_by(func.sum(Prediction.points).desc())
        .all()
    )

    logger.info("Leaderboard requested")

    return [
        {
            "position": index + 1,
            "user_id": r.id,
            "email": r.email,
            "points": int(r.total_points)
        }
        for index, r in enumerate(results)
    ]
