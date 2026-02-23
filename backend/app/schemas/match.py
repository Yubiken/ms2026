from pydantic import BaseModel

class MatchResultUpdate(BaseModel):
    home_score: int
    away_score: int