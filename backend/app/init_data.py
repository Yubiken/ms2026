from app.database import SessionLocal
from app.models import Match
from datetime import datetime

db = SessionLocal()

match = Match(
    home_team="Polska",
    away_team="Niemcy",
    match_date=datetime(2026, 6, 15, 18, 0)
)

db.add(match)
db.commit()

print("Match added")