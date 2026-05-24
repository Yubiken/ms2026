from datetime import date
import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Match
from app.schemas.match import MatchResultUpdate
from app.services.external_results import ExternalResultsError, fetch_finished_results, fetch_fixtures
from app.services.scoring import set_final_result

router = APIRouter(prefix="/admin", tags=["Admin"])

logger = logging.getLogger(__name__)


@router.put("/matches/{match_id}/result")
def set_match_result(match_id: int, result: MatchResultUpdate, db: Session = Depends(get_db)):
    match = db.query(Match).filter(Match.id == match_id).first()

    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if match.is_finished:
        raise HTTPException(status_code=400, detail="Match already finished")

    predictions_updated = set_final_result(db, match, result.home_score, result.away_score)
    db.commit()
    db.refresh(match)

    logger.info("Result set for match %s; predictions updated=%s", match_id, predictions_updated)

    return {"message": "Result saved and points calculated"}


@router.post("/matches/sync-results")
def sync_match_results(
    match_date: date | None = Query(default=None, description="Optional date filter in YYYY-MM-DD format"),
    db: Session = Depends(get_db),
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
):
    try:
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
