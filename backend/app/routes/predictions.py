from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy import case, func, true
from pydantic import BaseModel, Field
from datetime import datetime, timezone

from ..database import get_db
from ..models import CompetitionParticipant, Prediction, Match, User
from ..services.competitions import get_active_competition_id
from ..services.scoring import set_final_result
from .users import get_current_user

import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(tags=["Predictions"])


# ==============================
# SCHEMAS
# ==============================

class PredictionCreate(BaseModel):
    match_id: int
    home_score: int = Field(..., ge=0, le=20)
    away_score: int = Field(..., ge=0, le=20)


class PredictionUpdate(BaseModel):
    home_score: int = Field(..., ge=0, le=20)
    away_score: int = Field(..., ge=0, le=20)


class MatchResult(BaseModel):
    home_score: int
    away_score: int


# ==============================
# UTC HELPER
# ==============================

def to_utc(dt: datetime) -> datetime:
    """
    Zawsze zwracamy timezone-aware UTC datetime
    """
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def prediction_payload(prediction: Prediction, match: Match) -> dict:
    return {
        "id": prediction.id,
        "match_id": match.id,
        "home_team": match.home_team,
        "away_team": match.away_team,
        "start_time": match.start_time,
        "is_finished": match.is_finished,
        "final_home_score": match.home_score,
        "final_away_score": match.away_score,
        "prediction_home": prediction.home_score,
        "prediction_away": prediction.away_score,
        "points": prediction.points,
    }


# ==============================
# CREATE PREDICTION
# ==============================

@router.post("/predictions")
def create_prediction(
    prediction: PredictionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    match = db.query(Match).filter(Match.id == prediction.match_id).first()

    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if match.competition_id is not None:
        participation = (
            db.query(CompetitionParticipant)
            .filter(
                CompetitionParticipant.competition_id == match.competition_id,
                CompetitionParticipant.user_id == current_user.id,
            )
            .first()
        )

        if not participation:
            raise HTTPException(
                status_code=403,
                detail="Join this competition before predicting"
            )

    now = datetime.now(timezone.utc)
    match_start = to_utc(match.start_time)

    if now >= match_start:
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
        points=0,
    )

    db.add(new_prediction)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Prediction already exists"
        ) from exc

    db.refresh(new_prediction)

    logger.info(f"Prediction created user={current_user.id} match={match.id}")

    return prediction_payload(new_prediction, match)


# ==============================
# UPDATE PREDICTION
# ==============================

@router.put("/predictions/{prediction_id}")
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

    if prediction.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="To nie Twój typ")

    match = db.query(Match).filter(
        Match.id == prediction.match_id
    ).first()

    now = datetime.now(timezone.utc)
    match_start = to_utc(match.start_time)

    if now >= match_start:
        raise HTTPException(
            status_code=400,
            detail="Typowanie zamknięte – mecz już się rozpoczął"
        )

    prediction.home_score = data.home_score
    prediction.away_score = data.away_score

    db.commit()
    db.refresh(prediction)

    logger.info(f"Prediction updated user={current_user.id}")

    return prediction_payload(prediction, match)


# ==============================
# MY PREDICTIONS
# ==============================

@router.get("/my-predictions")
def get_my_predictions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    active_competition_id = get_active_competition_id(db)

    query = (
        db.query(Prediction)
        .join(Match)
        .filter(Prediction.user_id == current_user.id)
    )

    if active_competition_id is not None:
        query = query.filter(Match.competition_id == active_competition_id)

    predictions = query.all()

    return [
        {
            "id": p.id,
            "match_id": p.match.id,
            "home_team": p.match.home_team,
            "away_team": p.match.away_team,
            "start_time": p.match.start_time,
            "is_finished": p.match.is_finished,
            "final_home_score": p.match.home_score,
            "final_away_score": p.match.away_score,
            "prediction_home": p.home_score,
            "prediction_away": p.away_score,
            "points": p.points
        }
        for p in predictions
    ]


# ==============================
# FINISH MATCH
# ==============================

@router.post("/matches/{match_id}/finish")
def finish_match(
    match_id: int,
    result: MatchResult,
    db: Session = Depends(get_db)
):

    match = db.query(Match).filter(Match.id == match_id).first()

    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if match.is_finished:
        raise HTTPException(status_code=400, detail="Match already finished")

    set_final_result(db, match, result.home_score, result.away_score)
    db.commit()

    return {"message": "Match finished and points calculated"}


# ==============================
# LEADERBOARD
# ==============================

@router.get("/leaderboard")
def leaderboard(db: Session = Depends(get_db)):
    active_competition_id = get_active_competition_id(db)
    competition_filter = (
        Match.competition_id == active_competition_id
        if active_competition_id is not None
        else true()
    )
    total_points = func.coalesce(
        func.sum(
            case(
                (competition_filter, Prediction.points),
                else_=0,
            )
        ),
        0,
    )
    exact_score_count = func.coalesce(
        func.sum(
            case(
                (
                    competition_filter
                    & (Match.is_finished.is_(True))
                    & (Prediction.home_score == Match.home_score)
                    & (Prediction.away_score == Match.away_score),
                    1,
                ),
                else_=0,
            )
        ),
        0,
    )

    query = (
        db.query(
            User.id,
            User.username,
            total_points.label("total_points"),
            func.count(Match.id).filter(
                Match.is_finished.is_(True),
                competition_filter,
            ).label("settled_predictions_count"),
            exact_score_count.label("exact_score_count"),
        )
        .join(CompetitionParticipant, CompetitionParticipant.user_id == User.id)
        .outerjoin(Prediction, Prediction.user_id == User.id)
        .outerjoin(Match, Match.id == Prediction.match_id)
    )

    if active_competition_id is not None:
        query = query.filter(CompetitionParticipant.competition_id == active_competition_id)

    results = (
        query
        .group_by(User.id)
        .order_by(total_points.desc(), exact_score_count.desc(), User.username.asc())
        .all()
    )

    return [
        {
            "position": index + 1,
            "user_id": r.id,
            "username": r.username,
            "points": int(r.total_points),
            "settled_predictions_count": int(r.settled_predictions_count),
            "exact_score_count": int(r.exact_score_count),
            "accuracy": round((int(r.total_points) / (int(r.settled_predictions_count) * 2)) * 100)
            if int(r.settled_predictions_count) > 0
            else None,
        }
        for index, r in enumerate(results)
    ]


@router.get("/leaderboard/{user_id}/history")
def leaderboard_user_history(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    now = datetime.now(timezone.utc)
    active_competition_id = get_active_competition_id(db)
    query = (
        db.query(Prediction)
        .join(Match)
        .filter(Prediction.user_id == user_id)
    )

    if active_competition_id is not None:
        query = query.filter(Match.competition_id == active_competition_id)

    predictions = query.order_by(Match.start_time.desc()).all()
    visible_predictions = [
        prediction
        for prediction in predictions
        if to_utc(prediction.match.start_time) <= now
    ]

    return {
        "user_id": user.id,
        "username": user.username,
        "points": sum(int(prediction.points or 0) for prediction in visible_predictions),
        "predictions": [
            {
                "match_id": prediction.match.id,
                "home_team": prediction.match.home_team,
                "away_team": prediction.match.away_team,
                "start_time": prediction.match.start_time,
                "is_finished": prediction.match.is_finished,
                "final_home_score": prediction.match.home_score,
                "final_away_score": prediction.match.away_score,
                "prediction_home": prediction.home_score,
                "prediction_away": prediction.away_score,
                "points": prediction.points if prediction.match.is_finished else None,
            }
            for prediction in visible_predictions
        ],
    }


# ==============================
# SEASON STATS
# ==============================

@router.get("/season-stats")
def season_stats(db: Session = Depends(get_db)):
    active_competition_id = get_active_competition_id(db)
    finished_matches_query = db.query(Match).filter(Match.is_finished.is_(True))
    predictions_query = (
        db.query(Prediction)
        .join(Match)
        .join(User)
        .filter(Match.is_finished.is_(True))
    )

    if active_competition_id is not None:
        finished_matches_query = finished_matches_query.filter(Match.competition_id == active_competition_id)
        predictions_query = predictions_query.filter(Match.competition_id == active_competition_id)

    finished_matches_count = finished_matches_query.count()
    predictions = predictions_query.all()

    total_predictions = len(predictions)
    total_points = sum(int(prediction.points or 0) for prediction in predictions)
    exact_hits = sum(
        1
        for prediction in predictions
        if prediction.home_score == prediction.match.home_score
        and prediction.away_score == prediction.match.away_score
    )
    partial_hits = sum(1 for prediction in predictions if int(prediction.points or 0) == 1)
    misses = sum(1 for prediction in predictions if int(prediction.points or 0) == 0)

    match_stats = {}
    score_counts = {}
    stage_stats = {}

    for prediction in predictions:
        match = prediction.match
        match_key = match.id
        score = f"{prediction.home_score}:{prediction.away_score}"
        stage = match.stage or "group"

        score_counts[score] = score_counts.get(score, 0) + 1

        if match_key not in match_stats:
            match_stats[match_key] = {
                "match_id": match.id,
                "home_team": match.home_team,
                "away_team": match.away_team,
                "final_score": f"{match.home_score}:{match.away_score}",
                "predictions_count": 0,
                "points": 0,
                "exact_hits": 0,
            }

        match_stats[match_key]["predictions_count"] += 1
        match_stats[match_key]["points"] += int(prediction.points or 0)

        if prediction.home_score == match.home_score and prediction.away_score == match.away_score:
            match_stats[match_key]["exact_hits"] += 1

        if stage not in stage_stats:
            stage_stats[stage] = {
                "stage": stage,
                "predictions_count": 0,
                "points": 0,
                "exact_hits": 0,
            }

        stage_stats[stage]["predictions_count"] += 1
        stage_stats[stage]["points"] += int(prediction.points or 0)

        if prediction.home_score == match.home_score and prediction.away_score == match.away_score:
            stage_stats[stage]["exact_hits"] += 1

    enriched_match_stats = [
        {
            **item,
            "average_points": round(item["points"] / item["predictions_count"], 2)
            if item["predictions_count"] > 0
            else 0,
        }
        for item in match_stats.values()
    ]
    matches_with_predictions = [
        item for item in enriched_match_stats if item["predictions_count"] > 0
    ]

    top_scores = sorted(
        score_counts.items(),
        key=lambda item: (-item[1], item[0]),
    )[:5]

    return {
        "finished_matches_count": finished_matches_count,
        "total_predictions": total_predictions,
        "total_points": total_points,
        "exact_hits": exact_hits,
        "partial_hits": partial_hits,
        "misses": misses,
        "league_accuracy": round((total_points / (total_predictions * 2)) * 100)
        if total_predictions > 0
        else None,
        "exact_rate": round((exact_hits / total_predictions) * 100)
        if total_predictions > 0
        else None,
        "most_predictable_match": max(
            matches_with_predictions,
            key=lambda item: (item["average_points"], item["exact_hits"], item["predictions_count"]),
            default=None,
        ),
        "hardest_match": min(
            matches_with_predictions,
            key=lambda item: (item["average_points"], item["exact_hits"], -item["predictions_count"]),
            default=None,
        ),
        "popular_scores": [
            {"score": score, "count": count}
            for score, count in top_scores
        ],
        "stage_stats": [
            {
                **item,
                "accuracy": round((item["points"] / (item["predictions_count"] * 2)) * 100)
                if item["predictions_count"] > 0
                else None,
            }
            for item in stage_stats.values()
        ],
    }


# ==============================
# VIEW ALL PREDICTIONS (AFTER START)
# ==============================

@router.get("/matches/{match_id}/predictions")
def get_match_predictions(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    match = db.query(Match).filter(Match.id == match_id).first()

    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    now = datetime.now(timezone.utc)
    match_start = to_utc(match.start_time)

    if now < match_start:
        raise HTTPException(
            status_code=403,
            detail="Predictions visible only after match start"
        )

    predictions = (
        db.query(Prediction)
        .join(User)
        .filter(Prediction.match_id == match_id)
        .all()
    )

    return [
        {
            "username": p.user.username,
            "prediction": f"{p.home_score}:{p.away_score}",
            "points": p.points if match.is_finished else None
        }
        for p in predictions
    ]
