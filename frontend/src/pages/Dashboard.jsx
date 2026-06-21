import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { apiRequest } from "../api"
import { getUsername } from "../auth"
import PageLoader from "../components/PageLoader"

const formatDate = (date) => new Date(date).toLocaleString("pl-PL", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
})

const getTimeLabel = (date) => {
  const minutes = Math.max(0, Math.round((new Date(date) - new Date()) / 60000))
  if (minutes < 60) return `za ${minutes} min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `za ${hours} godz.`

  const days = Math.floor(hours / 24)
  return `za ${days} ${days === 1 ? "dzień" : "dni"}`
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

export default function Dashboard() {
  const [data, setData] = useState({ matches: [], predictions: [], ranking: [] })
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const username = getUsername()

  useEffect(() => {
    Promise.all([
      apiRequest("/matches"),
      apiRequest("/my-predictions"),
      apiRequest("/leaderboard"),
    ])
      .then(([matches, predictions, ranking]) => {
        setData({
          matches: Array.isArray(matches) ? matches : [],
          predictions: Array.isArray(predictions) ? predictions : [],
          ranking: Array.isArray(ranking) ? ranking : [],
        })
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false))
  }, [])

  const summary = useMemo(() => {
    const now = new Date()
    const predictionByMatch = new Map(
      data.predictions.map(prediction => [String(prediction.match_id), prediction])
    )
    const upcoming = data.matches
      .filter(match => !match.is_finished && new Date(match.start_time) > now)
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    const missing = upcoming.filter(match => !predictionByMatch.has(String(match.id)))
    const settled = data.predictions.filter(prediction => prediction.is_finished)
    const points = settled.reduce((total, prediction) => total + Number(prediction.points ?? 0), 0)
    const ranking = [...data.ranking]
      .sort((a, b) => Number(b.points ?? 0) - Number(a.points ?? 0))
    const rankIndex = ranking.findIndex(player => player.username === username)

    return {
      upcoming,
      missing,
      nextMatch: upcoming[0],
      nextPrediction: upcoming[0] ? predictionByMatch.get(String(upcoming[0].id)) : null,
      nextMissing: missing[0],
      points,
      settledCount: settled.length,
      exactCount: settled.filter(prediction => Number(prediction.points) === 2).length,
      rank: rankIndex >= 0 ? rankIndex + 1 : null,
      playersCount: ranking.length,
      progress: upcoming.length > 0
        ? Math.round(((upcoming.length - missing.length) / upcoming.length) * 100)
        : 100,
    }
  }, [data, username])

  if (loading) {
    return <PageLoader title="Twój pulpit" subtitle="Układam najważniejsze informacje" cards={4} />
  }

  const primaryMatch = summary.nextMissing || summary.nextMatch
  const primaryAction = summary.nextMissing ? "Obstaw teraz" : "Zobacz mecz"

  return (
    <div className="min-h-screen px-4 py-7 text-white sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm font-bold uppercase tracking-[0.22em] text-green-300">Centrum ligi</div>
            <h1 className="mt-2 text-3xl font-black sm:text-5xl">
              Cześć, <span className="section-title">{username || "Typerze"}</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm font-medium text-gray-400 sm:text-base">
              Wszystko, co ważne przed pierwszym gwizdkiem, w jednym miejscu.
            </p>
          </div>
          <Link to="/matches" className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/[0.06] px-5 py-2.5 text-sm font-bold transition hover:bg-white/10 sm:self-auto">
            Pełny terminarz <ArrowIcon />
          </Link>
        </header>

        {failed && (
          <div className="mb-5 rounded-2xl border border-orange-400/30 bg-orange-500/10 px-4 py-3 text-sm font-semibold text-orange-200">
            Nie udało się pobrać części danych. Odśwież stronę za chwilę.
          </div>
        )}

        <section className="dashboard-hero mb-5 overflow-hidden rounded-3xl p-5 sm:p-8">
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.16em]">
                <span className={`rounded-full px-3 py-1 ${summary.nextMissing ? "bg-green-400 text-black" : "bg-white/10 text-gray-200"}`}>
                  {summary.nextMissing ? "Najważniejsza akcja" : "Najbliższy mecz"}
                </span>
                {primaryMatch && <span className="text-green-200">{getTimeLabel(primaryMatch.start_time)}</span>}
              </div>

              {primaryMatch ? (
                <>
                  <h2 className="mt-4 text-2xl font-black leading-tight sm:text-4xl">
                    {primaryMatch.home_team}
                    <span className="mx-2 text-white/35">vs</span>
                    {primaryMatch.away_team}
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold text-gray-300">
                    {primaryMatch.group_name && <span>Grupa {primaryMatch.group_name}</span>}
                    <span className="text-white/30">•</span>
                    <span>{formatDate(primaryMatch.start_time)}</span>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="mt-4 text-3xl font-black">Wszystko gotowe</h2>
                  <p className="mt-2 text-gray-300">Nie masz teraz żadnych meczów do obstawienia.</p>
                </>
              )}
            </div>

            {primaryMatch && (
              <Link
                to={`/matches?edit=${primaryMatch.id}`}
                className="inline-flex min-w-44 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 px-6 py-3.5 font-black uppercase text-black shadow-xl shadow-green-500/20 transition hover:scale-[1.02]"
              >
                {primaryAction} <ArrowIcon />
              </Link>
            )}
          </div>
        </section>

        <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Link to="/matches" className="dashboard-stat rounded-2xl p-4 transition hover:-translate-y-0.5 sm:p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-400">Do obstawienia</div>
            <div className="mt-2 text-3xl font-black text-green-300">{summary.missing.length}</div>
            <div className="mt-2 text-xs font-semibold text-gray-500">z {summary.upcoming.length} nadchodzących</div>
          </Link>
          <Link to="/leaderboard" className="dashboard-stat rounded-2xl p-4 transition hover:-translate-y-0.5 sm:p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-400">Twoje miejsce</div>
            <div className="mt-2 text-3xl font-black text-yellow-300">{summary.rank ? `#${summary.rank}` : "–"}</div>
            <div className="mt-2 text-xs font-semibold text-gray-500">na {summary.playersCount} graczy</div>
          </Link>
          <Link to="/my-predictions" className="dashboard-stat rounded-2xl p-4 transition hover:-translate-y-0.5 sm:p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-400">Zdobyte punkty</div>
            <div className="mt-2 text-3xl font-black text-orange-300">{summary.points}</div>
            <div className="mt-2 text-xs font-semibold text-gray-500">{summary.settledCount} rozliczonych typów</div>
          </Link>
          <Link to="/my-predictions" className="dashboard-stat rounded-2xl p-4 transition hover:-translate-y-0.5 sm:p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-400">Dokładne wyniki</div>
            <div className="mt-2 text-3xl font-black text-red-300">{summary.exactCount}</div>
            <div className="mt-2 text-xs font-semibold text-gray-500">trafienia za 2 punkty</div>
          </Link>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="stadium-panel rounded-3xl p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-gray-400">Gotowość na kolejne mecze</div>
                <div className="mt-1 text-xl font-black">{summary.progress}% obstawione</div>
              </div>
              <div className="text-3xl font-black text-green-300">{summary.upcoming.length - summary.missing.length}/{summary.upcoming.length}</div>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-green-500 via-yellow-400 to-orange-500 transition-all" style={{ width: `${summary.progress}%` }} />
            </div>
            <p className="mt-4 text-sm font-medium text-gray-400">
              {summary.missing.length > 0
                ? `Zostało ${summary.missing.length} ${summary.missing.length === 1 ? "spotkanie" : "spotkań"}. Zacznij od najbliższego, reszta pójdzie szybko.`
                : "Świetnie, wszystkie dostępne mecze mają już Twój typ."}
            </p>
          </div>

          <div className="stadium-panel rounded-3xl p-5 sm:p-6">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-400">Szybkie przejścia</div>
            <div className="mt-4 grid gap-2">
              <Link to="/my-predictions" className="dashboard-shortcut">Sprawdź moje typy <ArrowIcon /></Link>
              <Link to="/leaderboard" className="dashboard-shortcut">Zobacz ranking ligi <ArrowIcon /></Link>
              <Link to="/champion" className="dashboard-shortcut">Wybierz mistrza <ArrowIcon /></Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
