from datetime import date
import logging
import re
import unicodedata

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Competition, CompetitionParticipant, Match, User
from app.schemas.match import MatchResultUpdate
from app.services.admins import get_admin_users
from app.services.competitions import get_active_competition_id
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


class CompetitionCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    slug: str | None = Field(default=None, max_length=80)
    join_code: str = Field(..., min_length=3, max_length=32)


def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    admin_users = get_admin_users()

    if current_user.username not in admin_users:
        raise HTTPException(status_code=403, detail="Admin access required")

    return current_user


def serialize_competition(competition: Competition) -> dict:
    return {
        "id": competition.id,
        "name": competition.name,
        "slug": competition.slug,
        "join_code": competition.join_code,
        "is_active": competition.is_active,
        "created_at": competition.created_at,
    }


def normalize_slug(slug: str) -> str:
    ascii_slug = (
        unicodedata.normalize("NFKD", slug.strip().lower())
        .encode("ascii", "ignore")
        .decode("ascii")
    )

    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", ascii_slug)).strip("-")


def build_unique_slug(db: Session, slug: str | None, name: str) -> str:
    base_slug = normalize_slug(slug or name) or "turniej"
    candidate = base_slug[:72].strip("-") or "turniej"
    suffix = 2

    while db.query(Competition).filter(Competition.slug == candidate).first():
        candidate = f"{base_slug[:68].strip('-')}-{suffix}"
        suffix += 1

    return candidate


def normalize_join_code(join_code: str) -> str:
    return "".join(character for character in join_code.strip().upper() if character.isalnum() or character in "-_")


def ensure_competition_participant(db: Session, competition_id: int, user_id: int) -> None:
    existing = (
        db.query(CompetitionParticipant)
        .filter(
            CompetitionParticipant.competition_id == competition_id,
            CompetitionParticipant.user_id == user_id,
        )
        .first()
    )

    if not existing:
        db.add(
            CompetitionParticipant(
                competition_id=competition_id,
                user_id=user_id,
            )
        )


@router.get("/competitions")
def get_admin_competitions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    competitions = (
        db.query(Competition)
        .order_by(Competition.created_at.desc(), Competition.id.desc())
        .all()
    )

    return [serialize_competition(competition) for competition in competitions]


@router.post("/competitions")
def create_competition(
    payload: CompetitionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    name = payload.name.strip()
    slug = build_unique_slug(db, payload.slug, name)
    join_code = normalize_join_code(payload.join_code)

    if not name or not slug or not join_code:
        raise HTTPException(status_code=400, detail="Name, slug and join code are required")

    existing = (
        db.query(Competition)
        .filter(
            (Competition.name == name)
            | (Competition.slug == slug)
            | (Competition.join_code == join_code)
        )
        .first()
    )

    if existing:
        raise HTTPException(status_code=400, detail="Competition already exists")

    competition = Competition(
        name=name,
        slug=slug,
        join_code=join_code,
        is_active=False,
    )

    db.add(competition)
    db.flush()
    ensure_competition_participant(db, competition.id, current_user.id)
    db.commit()
    db.refresh(competition)

    logger.info("Competition %s created by %s", competition.slug, current_user.username)

    return serialize_competition(competition)


@router.put("/competitions/{competition_id}/activate")
def activate_competition(
    competition_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    competition = db.query(Competition).filter(Competition.id == competition_id).first()

    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")

    db.query(Competition).update({Competition.is_active: False})
    competition.is_active = True
    ensure_competition_participant(db, competition.id, current_user.id)
    db.commit()
    db.refresh(competition)

    logger.info("Competition %s activated by %s", competition.slug, current_user.username)

    return serialize_competition(competition)


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
    active_competition_id = get_active_competition_id(db)

    try:
        external_results = fetch_finished_results(match_date)
    except ExternalResultsError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    updated = []
    skipped_finished = []
    unmatched = []

    for external_result in external_results:
        query = (
            db.query(Match)
            .filter(
                Match.external_source == "api-football",
                Match.external_id == external_result.external_id,
            )
        )

        if active_competition_id is not None:
            query = query.filter(Match.competition_id == active_competition_id)

        match = query.first()

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
