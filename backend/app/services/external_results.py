import os
from dataclasses import dataclass
from datetime import date
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
import json


FINISHED_STATUSES = {"FT", "AET", "PEN"}


@dataclass
class ExternalMatchResult:
    external_id: str
    home_score: int
    away_score: int
    status: str


class ExternalResultsError(RuntimeError):
    pass


def fetch_finished_results(match_date: date | None = None) -> list[ExternalMatchResult]:
    api_key = os.getenv("FOOTBALL_API_KEY")

    if not api_key:
        raise ExternalResultsError("FOOTBALL_API_KEY is not configured")

    base_url = os.getenv("FOOTBALL_API_BASE_URL", "https://v3.football.api-sports.io")
    api_host = os.getenv("FOOTBALL_API_HOST", "v3.football.api-sports.io")
    league_id = os.getenv("FOOTBALL_API_LEAGUE_ID")
    season = os.getenv("FOOTBALL_API_SEASON", "2026")

    params: dict[str, str] = {"season": season}

    if league_id:
        params["league"] = league_id

    if match_date:
        params["date"] = match_date.isoformat()

    url = f"{base_url.rstrip('/')}/fixtures?{urlencode(params)}"
    request = Request(
        url,
        headers={
            "x-apisports-key": api_key,
            "x-rapidapi-host": api_host,
        },
    )

    try:
        with urlopen(request, timeout=20) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        raise ExternalResultsError(f"External API returned HTTP {exc.code}") from exc
    except URLError as exc:
        raise ExternalResultsError(f"External API request failed: {exc.reason}") from exc
    except json.JSONDecodeError as exc:
        raise ExternalResultsError("External API returned invalid JSON") from exc

    return _parse_api_football_results(payload)


def _parse_api_football_results(payload: dict[str, Any]) -> list[ExternalMatchResult]:
    results: list[ExternalMatchResult] = []

    for item in payload.get("response", []):
        fixture = item.get("fixture") or {}
        goals = item.get("goals") or {}
        status = (fixture.get("status") or {}).get("short")
        fixture_id = fixture.get("id")
        home_score = goals.get("home")
        away_score = goals.get("away")

        if (
            fixture_id is None
            or status not in FINISHED_STATUSES
            or home_score is None
            or away_score is None
        ):
            continue

        results.append(
            ExternalMatchResult(
                external_id=str(fixture_id),
                home_score=int(home_score),
                away_score=int(away_score),
                status=status,
            )
        )

    return results
