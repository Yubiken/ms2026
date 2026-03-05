from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timezone

from ..database import get_db
from ..models import Match, User
from .users import get_current_user

router = APIRouter(tags=["Matches"])


# ==============================
# SCHEMA
# ==============================

class MatchCreate(BaseModel):
    home_team: str
    away_team: str
    start_time: datetime
    stage: str
    group_name: str | None = None


# ==============================
# UTC HELPER
# ==============================

def to_utc(dt: datetime) -> datetime:
    """
    Zawsze zwracamy timezone-aware UTC datetime
    """
    if dt.tzinfo is None:
        # jeśli frontend wysłał bez strefy → traktujemy jako UTC
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


# ==============================
# CREATE MATCH
# ==============================

@router.post(
    "/matches",
    summary="Dodaj mecz",
    description="Tworzy nowy mecz z określoną godziną rozpoczęcia (UTC)."
)
def create_match(
    match: MatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    start_time_utc = to_utc(match.start_time)

    new_match = Match(
        home_team=match.home_team,
        away_team=match.away_team,
        start_time=start_time_utc,
        stage=match.stage,
        group_name=match.group_name
    )

    db.add(new_match)
    db.commit()
    db.refresh(new_match)

    return {
        "message": "Match created",
        "match_id": new_match.id,
        "start_time_utc": new_match.start_time
    }


# ==============================
# GET MATCHES
# ==============================

@router.get(
    "/matches",
    summary="Lista meczów"
)
def get_matches(db: Session = Depends(get_db)):

    matches = db.query(Match).order_by(Match.start_time.asc()).all()

    return [
        {
            "id": m.id,
            "home_team": m.home_team,
            "away_team": m.away_team,
            "start_time": m.start_time,
            "stage": m.stage,
            "group_name": m.group_name,
            "is_finished": m.is_finished,
            "home_score": m.home_score,
            "away_score": m.away_score
        }
        for m in matches
    ]


# ==============================
# DELETE MATCH
# ==============================

@router.delete(
    "/matches/{match_id}",
    summary="Usuń mecz"
)
def delete_match(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    match = db.query(Match).filter(Match.id == match_id).first()

    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    db.delete(match)
    db.commit()

    return {"message": "Match deleted"}