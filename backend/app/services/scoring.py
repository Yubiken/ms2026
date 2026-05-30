from sqlalchemy.orm import Session

from app.models import Match, Prediction


def calculate_points(prediction: Prediction, match: Match) -> int:
    if prediction.home_score == match.home_score and prediction.away_score == match.away_score:
        return 2

    actual_diff = match.home_score - match.away_score
    predicted_diff = prediction.home_score - prediction.away_score

    if (
        (actual_diff == 0 and predicted_diff == 0)
        or (actual_diff > 0 and predicted_diff > 0)
        or (actual_diff < 0 and predicted_diff < 0)
    ):
        return 1

    return 0


def set_final_result(db: Session, match: Match, home_score: int, away_score: int) -> int:
    match.home_score = home_score
    match.away_score = away_score
    match.is_finished = True

    predictions = db.query(Prediction).filter(Prediction.match_id == match.id).all()

    for prediction in predictions:
        prediction.points = calculate_points(prediction, match)

    return len(predictions)


def clear_final_result(db: Session, match: Match) -> int:
    match.home_score = None
    match.away_score = None
    match.is_finished = False

    predictions = db.query(Prediction).filter(Prediction.match_id == match.id).all()

    for prediction in predictions:
        prediction.points = 0

    return len(predictions)
