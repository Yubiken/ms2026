from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Match, Prediction, User
from .users import get_current_user

router = APIRouter(tags=["Matches"])


class MatchCreate(BaseModel):
    home_team: str
    away_team: str
    start_time: datetime
    stage: str
    group_name: str | None = None
    external_source: str | None = None
    external_id: str | None = None


class MatchBulkCreate(BaseModel):
    matches: list[MatchCreate]


def to_utc(dt: datetime) -> datetime:
    """
    Zawsze zwracamy timezone-aware UTC datetime
    """
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def build_match(match: MatchCreate) -> Match:
    start_time = match.start_time

    if start_time.tzinfo is None:
        local_tz = ZoneInfo("Europe/Warsaw")
        start_time = start_time.replace(tzinfo=local_tz)

    start_time_utc = start_time.astimezone(timezone.utc)

    return Match(
        home_team=match.home_team,
        away_team=match.away_team,
        start_time=start_time_utc,
        stage=match.stage,
        group_name=match.group_name,
        external_source=match.external_source,
        external_id=match.external_id,
    )


@router.post(
    "/matches",
    summary="Dodaj mecz",
    description="Tworzy nowy mecz z okreslona godzina rozpoczecia.",
)
def create_match(
    match: MatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_match = build_match(match)

    db.add(new_match)
    db.commit()
    db.refresh(new_match)

    return {
        "message": "Match created",
        "match_id": new_match.id,
        "start_time_utc": new_match.start_time,
    }


@router.post(
    "/matches/bulk",
    summary="Dodaj mecze hurtowo",
    description="Tworzy wiele meczow w jednej transakcji.",
)
def create_matches_bulk(
    payload: MatchBulkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not payload.matches:
        raise HTTPException(status_code=400, detail="No matches provided")

    new_matches = [build_match(match) for match in payload.matches]

    db.add_all(new_matches)
    db.commit()

    for match in new_matches:
        db.refresh(match)

    return {
        "message": "Matches created",
        "created_count": len(new_matches),
        "match_ids": [match.id for match in new_matches],
    }


@router.get(
    "/matches",
    summary="Lista meczow",
)
def get_matches(db: Session = Depends(get_db)):
    prediction_counts = (
        db.query(
            Prediction.match_id,
            func.count(Prediction.id).label("predictions_count"),
        )
        .group_by(Prediction.match_id)
        .subquery()
    )

    matches = (
        db.query(
            Match,
            func.coalesce(prediction_counts.c.predictions_count, 0).label("predictions_count"),
        )
        .outerjoin(prediction_counts, Match.id == prediction_counts.c.match_id)
        .order_by(Match.start_time.asc())
        .all()
    )

    return [
        {
            "id": m.id,
            "home_team": m.home_team,
            "away_team": m.away_team,
            "start_time": m.start_time,
            "stage": m.stage,
            "group_name": m.group_name,
            "external_source": m.external_source,
            "external_id": m.external_id,
            "is_finished": m.is_finished,
            "home_score": m.home_score,
            "away_score": m.away_score,
            "predictions_count": int(predictions_count or 0),
        }
        for m, predictions_count in matches
    ]


@router.delete(
    "/matches/{match_id}",
    summary="Usun mecz",
)
def delete_match(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    match = db.query(Match).filter(Match.id == match_id).first()

    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    db.delete(match)
    db.commit()

    return {"message": "Match deleted"}
