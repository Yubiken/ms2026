from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from datetime import datetime, timezone

from ..database import get_db
from ..models import Match, User
from .users import get_current_user

router = APIRouter(tags=["Matches"])


# schema request
class MatchCreate(BaseModel):

    home_team: str = Field(..., description="Drużyna gospodarzy")
    away_team: str = Field(..., description="Drużyna gości")

    start_time: datetime = Field(
        ...,
        description="Data i godzina rozpoczęcia meczu w UTC, np: 2026-06-12T18:00:00Z"
    )


@router.post(
    "/matches",
    summary="Dodaj mecz (admin)",
    description="Tworzy nowy mecz z określoną godziną rozpoczęcia."
)
def create_match(
    match: MatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # (na razie każdy zalogowany user może tworzyć mecze — admin dodamy później)

    new_match = Match(
        home_team=match.home_team,
        away_team=match.away_team,
        match_date=match.start_time.date(),
        start_time=match.start_time
    )

    db.add(new_match)
    db.commit()
    db.refresh(new_match)

    return {
        "message": "Match created",
        "match_id": new_match.id,
        "start_time": new_match.start_time
    }