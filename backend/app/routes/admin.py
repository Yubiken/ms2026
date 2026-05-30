from datetime import date
import logging
import os

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Match, User
from app.schemas.match import MatchResultUpdate
from app.services.external_results import (
    ExternalResultsError,
    fetch_finished_results,
    fetch_fixtures,
    fetch_fixtures_debug,
)
from app.services.scoring import clear_final_result, set_final_result
from app.routes.users import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin"])

logger = logging.getLogger(__name__)


def get_admin_users() -> set[str]:
    return {
        username.strip()
        for username in os.getenv("ADMIN_USERS", "").split(",")
        if username.strip()
    }


def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    admin_users = get_admin_users()

    if current_user.username not in admin_users:
        raise HTTPException(status_code=403, detail="Admin access required")

    return current_user


@router.put("/matches/{match_id}/result")
def set_match_result(
    match_id: int,
    result: MatchResultUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    match = db.query(Match).filter(Match.id == match_id).first()

    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    was_finished = match.is_finished
    predictions_updated = set_final_result(db, match, result.home_score, result.away_score)
    db.commit()
    db.refresh(match)

    logger.info(
        "Result %s for match %s by %s; predictions updated=%s",
        "corrected" if was_finished else "set",
        match_id,
        current_user.username,
        predictions_updated,
    )

    return {
        "message": "Result corrected and points recalculated" if was_finished else "Result saved and points calculated",
        "was_correction": was_finished,
        "predictions_updated": predictions_updated,
    }


@router.delete("/matches/{match_id}/result")
def clear_match_result(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    match = db.query(Match).filter(Match.id == match_id).first()

    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    predictions_updated = clear_final_result(db, match)
    db.commit()
    db.refresh(match)

    logger.info(
        "Result cleared for match %s by %s; predictions reset=%s",
        match_id,
        current_user.username,
        predictions_updated,
    )

    return {
        "message": "Result cleared and prediction points reset",
        "predictions_updated": predictions_updated,
    }


@router.post("/matches/sync-results")
def sync_match_results(
    match_date: date | None = Query(default=None, description="Optional date filter in YYYY-MM-DD format"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    try:
        external_results = fetch_finished_results(match_date)
    except ExternalResultsError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    updated = []
    skipped_finished = []
    unmatched = []

    for external_result in external_results:
        match = (
            db.query(Match)
            .filter(
                Match.external_source == "api-football",
                Match.external_id == external_result.external_id,
            )
            .first()
        )

        if not match:
            unmatched.append(external_result.external_id)
            continue

        if match.is_finished:
            skipped_finished.append(match.id)
            continue

        predictions_updated = set_final_result(
            db,
            match,
            external_result.home_score,
            external_result.away_score,
        )

        updated.append(
            {
                "match_id": match.id,
                "external_id": external_result.external_id,
                "score": f"{external_result.home_score}:{external_result.away_score}",
                "predictions_updated": predictions_updated,
            }
        )

    db.commit()

    return {
        "updated": updated,
        "skipped_finished": skipped_finished,
        "unmatched_external_ids": unmatched,
    }


@router.get("/external-fixtures")
def get_external_fixtures(
    match_date: date | None = Query(default=None, description="Optional date filter in YYYY-MM-DD format"),
    debug: bool = Query(default=False, description="Return API-Football parameters and errors"),
    current_user: User = Depends(get_current_admin_user),
):
    try:
        if debug:
            return fetch_fixtures_debug(match_date)

        fixtures = fetch_fixtures(match_date)
    except ExternalResultsError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return [
        {
            "external_source": "api-football",
            "external_id": fixture.external_id,
            "date": fixture.date,
            "status": fixture.status,
            "elapsed": fixture.elapsed,
            "home_team": fixture.home_team,
            "away_team": fixture.away_team,
            "home_score": fixture.home_score,
            "away_score": fixture.away_score,
        }
        for fixture in fixtures
    ]
