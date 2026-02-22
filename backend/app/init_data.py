from app.database import SessionLocal
from app.models import Match
from datetime import datetime, timezone

db = SessionLocal()

match = Match(
    home_team="Poland",
    away_team="Germany",

    # 👇 TU ustawiasz godzinę meczu
    start_time=datetime(2026, 6, 12, 18, 0, tzinfo=timezone.utc)
)

db.add(match)
db.commit()
db.close()

print("Match added")