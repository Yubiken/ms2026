from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ChampionPick, Match, User
from .users import get_current_user

router = APIRouter(tags=["Champion"])


class ChampionPickCreate(BaseModel):
    team_name: str


def serialize_pick(pick: ChampionPick | None) -> dict | None:
    if not pick:
        return None

    return {
        "team_name": pick.team_name,
        "created_at": pick.created_at,
    }


def normalize_team_name(team_name: str) -> str:
    return team_name.strip()


def team_exists(db: Session, team_name: str) -> bool:
    return db.query(Match).filter(
        or_(
            Match.home_team == team_name,
            Match.away_team == team_name,
        )
    ).first() is not None


@router.get("/champion-pick")
def get_champion_pick(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pick = db.query(ChampionPick).filter(
        ChampionPick.user_id == current_user.id
    ).first()

    return serialize_pick(pick)


@router.post("/champion-pick")
def create_champion_pick(
    payload: ChampionPickCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    team_name = normalize_team_name(payload.team_name)

    if not team_name:
        raise HTTPException(status_code=400, detail="Team name is required")

    existing_pick = db.query(ChampionPick).filter(
        ChampionPick.user_id == current_user.id
    ).first()

    if existing_pick:
        raise HTTPException(status_code=400, detail="Champion pick already exists")

    if not team_exists(db, team_name):
        raise HTTPException(status_code=400, detail="Unknown team")

    pick = ChampionPick(
        user_id=current_user.id,
        team_name=team_name,
    )

    db.add(pick)
    db.commit()
    db.refresh(pick)

    return serialize_pick(pick)


@router.get("/champion-picks/summary")
def get_champion_picks_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_pick = db.query(ChampionPick).filter(
        ChampionPick.user_id == current_user.id
    ).first()

    if not current_pick:
        raise HTTPException(status_code=403, detail="Pick a champion first")

    picks = (
        db.query(ChampionPick)
        .join(User)
        .order_by(ChampionPick.team_name.asc(), User.username.asc())
        .all()
    )

    grouped_picks = {}

    for pick in picks:
        if pick.team_name not in grouped_picks:
            grouped_picks[pick.team_name] = {
                "team_name": pick.team_name,
                "votes": 0,
                "users": [],
            }

        grouped_picks[pick.team_name]["votes"] += 1
        grouped_picks[pick.team_name]["users"].append(pick.user.username)

    return sorted(
        grouped_picks.values(),
        key=lambda item: (-item["votes"], item["team_name"]),
    )
