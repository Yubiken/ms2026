from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Match, Prediction
from app.schemas.match import MatchResultUpdate
import logging

router = APIRouter(prefix="/admin", tags=["Admin"])

logger = logging.getLogger(__name__)


@router.put("/matches/{match_id}/result")
def set_match_result(match_id: int, result: MatchResultUpdate, db: Session = Depends(get_db)):

    match = db.query(Match).filter(Match.id == match_id).first()

    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if match.is_finished:
        raise HTTPException(status_code=400, detail="Match already finished")

    # zapis wyniku
    match.home_score = result.home_score
    match.away_score = result.away_score
    match.is_finished = True

    db.commit()
    db.refresh(match)

    logger.info(f"Result set for match {match_id}")

    # 🔥 PRZELICZANIE PUNKTÓW
    predictions = db.query(Prediction).filter(Prediction.match_id == match_id).all()

    for prediction in predictions:

        points = 0

        # kto wygrał?
        actual_diff = match.home_score - match.away_score
        predicted_diff = prediction.home_score - prediction.away_score

        # 1 punkt za trafienie zwycięzcy / remisu
        if (actual_diff == 0 and predicted_diff == 0) or \
           (actual_diff > 0 and predicted_diff > 0) or \
           (actual_diff < 0 and predicted_diff < 0):
            points += 1

        # +1 punkt za dokładny wynik
        if prediction.home_score == match.home_score and \
           prediction.away_score == match.away_score:
            points += 1

        prediction.points = points

        logger.info(
            f"Prediction {prediction.id} updated: user {prediction.user_id} got {points} points"
        )

    db.commit()

    return {"message": "Result saved and points calculated"}