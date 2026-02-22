from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from datetime import datetime, timezone

from ..database import get_db
from ..models import Prediction, Match, User
from .users import get_current_user

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


# ==============================
# DODANIE TYPU
# ==============================

@router.post(
    "/predictions",
    summary="Dodaj typ meczu",
    description="Zapisuje typ wyniku dla wybranego meczu. Użytkownik może typować mecz tylko raz i tylko przed jego rozpoczęciem."
)
def create_prediction(
    prediction: PredictionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    match = db.query(Match).filter(Match.id == prediction.match_id).first()

    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    # 🔒 blokada po rozpoczęciu meczu
    now = datetime.now(timezone.utc)
    if match.start_time <= now:
        raise HTTPException(
            status_code=400,
            detail="Nie można typować po rozpoczęciu meczu"
        )

    existing = db.query(Prediction).filter(
        Prediction.user_id == current_user.id,
        Prediction.match_id == prediction.match_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Prediction already exists")

    new_prediction = Prediction(
        user_id=current_user.id,
        match_id=prediction.match_id,
        home_score=prediction.home_score,
        away_score=prediction.away_score
    )

    db.add(new_prediction)
    db.commit()
    db.refresh(new_prediction)

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
        raise HTTPException(status_code=404, detail="Prediction not found")

    # 🔒 sprawdź właściciela
    if prediction.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="To nie Twój typ")

    match = db.query(Match).filter(
        Match.id == prediction.match_id
    ).first()

    now = datetime.now(timezone.utc)

    # 🔒 blokada po rozpoczęciu meczu
    if match.start_time <= now:
        raise HTTPException(
            status_code=400,
            detail="Nie można edytować typu po rozpoczęciu meczu"
        )

    prediction.home_score = data.home_score
    prediction.away_score = data.away_score

    db.commit()
    db.refresh(prediction)

    return {"message": "Prediction updated"}


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
            "prediction": f"{p.home_score}:{p.away_score}"
        }
        for p in predictions
    ]