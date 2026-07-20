from sqlalchemy.orm import Session

from ..models import Competition


def get_active_competition(db: Session) -> Competition | None:
    return (
        db.query(Competition)
        .filter(Competition.is_active.is_(True))
        .order_by(Competition.id.asc())
        .first()
    )


def get_active_competition_id(db: Session) -> int | None:
    competition = get_active_competition(db)

    return competition.id if competition else None
