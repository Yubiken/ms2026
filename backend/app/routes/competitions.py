from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Competition, CompetitionParticipant, User
from ..services.competitions import get_active_competition
from .users import get_current_user

router = APIRouter(tags=["Competitions"])


def serialize_competition(competition: Competition) -> dict:
    return {
        "id": competition.id,
        "name": competition.name,
        "slug": competition.slug,
        "is_active": competition.is_active,
        "created_at": competition.created_at,
    }


@router.get("/competitions")
def get_competitions(db: Session = Depends(get_db)):
    competitions = (
        db.query(Competition)
        .order_by(Competition.created_at.desc(), Competition.id.desc())
        .all()
    )

    return [serialize_competition(competition) for competition in competitions]


@router.get("/competitions/active")
def get_active_competition_route(db: Session = Depends(get_db)):
    competition = get_active_competition(db)

    return serialize_competition(competition) if competition else None


def get_participation(db: Session, competition_id: int, user_id: int) -> CompetitionParticipant | None:
    return (
        db.query(CompetitionParticipant)
        .filter(
            CompetitionParticipant.competition_id == competition_id,
            CompetitionParticipant.user_id == user_id,
        )
        .first()
    )


@router.get("/competition-participation/active")
def get_active_competition_participation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    competition = get_active_competition(db)

    if not competition:
        return {
            "competition": None,
            "is_participant": False,
            "joined_at": None,
        }

    participation = get_participation(db, competition.id, current_user.id)

    return {
        "competition": serialize_competition(competition),
        "is_participant": participation is not None,
        "joined_at": participation.joined_at if participation else None,
    }


@router.post("/competitions/{competition_id}/join")
def join_competition(
    competition_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    competition = db.query(Competition).filter(Competition.id == competition_id).first()

    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")

    existing = get_participation(db, competition.id, current_user.id)

    if existing:
        return {
            "competition": serialize_competition(competition),
            "is_participant": True,
            "joined_at": existing.joined_at,
        }

    participation = CompetitionParticipant(
        competition_id=competition.id,
        user_id=current_user.id,
    )

    db.add(participation)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        participation = get_participation(db, competition.id, current_user.id)
    else:
        db.refresh(participation)

    return {
        "competition": serialize_competition(competition),
        "is_participant": True,
        "joined_at": participation.joined_at if participation else None,
    }
