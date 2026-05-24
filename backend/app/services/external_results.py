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


@dataclass
class ExternalFixture:
    external_id: str
    date: str | None
    status: str | None
    elapsed: int | None
    home_team: str | None
    away_team: str | None
    home_score: int | None
    away_score: int | None


class ExternalResultsError(RuntimeError):
    pass


def fetch_fixtures(match_date: date | None = None) -> list[ExternalFixture]:
    payload = _fetch_fixtures_payload(match_date)
    return _parse_api_football_fixtures(payload)


def fetch_finished_results(match_date: date | None = None) -> list[ExternalMatchResult]:
    payload = _fetch_fixtures_payload(match_date)
    return _parse_api_football_results(payload)


def _fetch_fixtures_payload(match_date: date | None = None) -> dict[str, Any]:
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

    return payload


def _parse_api_football_fixtures(payload: dict[str, Any]) -> list[ExternalFixture]:
    fixtures: list[ExternalFixture] = []

    for item in payload.get("response", []):
        fixture = item.get("fixture") or {}
        goals = item.get("goals") or {}
        teams = item.get("teams") or {}
        home_team = teams.get("home") or {}
        away_team = teams.get("away") or {}
        status = fixture.get("status") or {}
        fixture_id = fixture.get("id")

        if fixture_id is None:
            continue

        fixtures.append(
            ExternalFixture(
                external_id=str(fixture_id),
                date=fixture.get("date"),
                status=status.get("short"),
                elapsed=status.get("elapsed"),
                home_team=home_team.get("name"),
                away_team=away_team.get("name"),
                home_score=goals.get("home"),
                away_score=goals.get("away"),
            )
        )

    return fixtures


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
