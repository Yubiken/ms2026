import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest } from "../api"

export default function Admin() {

  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [scores, setScores] = useState({})
  const [filter, setFilter] = useState("unfinished")

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    try {
      const data = await apiRequest("/matches")

      if (!data) return

      setMatches(Array.isArray(data) ? data : [])
    } catch {
      toast.error("Nie udało się pobrać meczów")
    }

    setLoading(false)
  }

  const updateScore = (matchId, side, value) => {
    setScores(current => ({
      ...current,
      [matchId]: {
        ...(current[matchId] || {}),
        [side]: value,
      },
    }))
  }

  const saveResult = async (match) => {
    const score = scores[match.id] || {}

    if (score.home_score === "" || score.away_score === "" || score.home_score == null || score.away_score == null) {
      toast.error("Wpisz wynik meczu")
      return
    }

    try {
      const data = await apiRequest(`/admin/matches/${match.id}/result`, {
        method: "PUT",
        body: JSON.stringify({
          home_score: Number(score.home_score),
          away_score: Number(score.away_score),
        }),
      })

      if (!data) return

      toast.success("Wynik zapisany")
      setScores(current => {
        const next = { ...current }
        delete next[match.id]
        return next
      })
      fetchMatches()
    } catch {
      toast.error("Nie udało się zapisać wyniku")
    }
  }

  const visibleMatches = matches
    .filter(match => {
      if (filter === "finished") return match.is_finished
      if (filter === "unfinished") return !match.is_finished
      return true
    })
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))

  if (loading) {
    return <div className="p-8 text-white">Loading...</div>
  }

  return (
    <div className="min-h-screen overflow-x-hidden px-4 py-8 text-white sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-6xl">

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="section-title text-4xl font-black">
              Admin
            </h1>
            <div className="mt-3 h-1 w-28 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500" />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              ["unfinished", "Nierozliczone"],
              ["finished", "Zakończone"],
              ["all", "Wszystkie"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
                  filter === key
                    ? "bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-black"
                    : "bg-white/10 text-gray-300 hover:bg-white/15"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {visibleMatches.length === 0 ? (
          <div className="stadium-panel rounded-2xl p-8 text-center text-gray-300">
            Brak meczów w tym widoku.
          </div>
        ) : (
          <div className="grid gap-4">
            {visibleMatches.map(match => {
              const score = scores[match.id] || {}

              return (
                <div
                  key={match.id}
                  className="match-ticket rounded-2xl p-4 sm:p-5"
                >
                  <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">
                        {match.group_name && (
                          <span className="rounded-full bg-white/10 px-2.5 py-1 text-gray-200">
                            Grupa {match.group_name}
                          </span>
                        )}
                        <span>
                          {new Date(match.start_time).toLocaleString("pl-PL", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {match.is_finished && (
                          <span className="rounded-full border border-gray-400/30 bg-gray-500/20 px-2.5 py-1 text-gray-200">
                            Zakończony
                          </span>
                        )}
                      </div>

                      <div className="text-lg font-black sm:text-xl">
                        {match.home_team}
                        <span className="mx-2 text-gray-500">vs</span>
                        {match.away_team}
                      </div>

                      {match.is_finished && (
                        <div className="mt-2 text-sm text-yellow-400">
                          Wynik: {match.home_score}:{match.away_score}
                        </div>
                      )}
                    </div>

                    {!match.is_finished && (
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="flex items-center justify-center gap-3">
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={score.home_score ?? ""}
                            onChange={(event) => updateScore(match.id, "home_score", event.target.value)}
                            className="w-20 rounded-xl border border-white/20 bg-white/10 p-3 text-center text-white outline-none focus:border-green-500"
                          />
                          <span className="text-2xl font-black">:</span>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={score.away_score ?? ""}
                            onChange={(event) => updateScore(match.id, "away_score", event.target.value)}
                            className="w-20 rounded-xl border border-white/20 bg-white/10 p-3 text-center text-white outline-none focus:border-green-500"
                          />
                        </div>

                        <button
                          onClick={() => saveResult(match)}
                          className="rounded-full bg-gradient-to-r from-green-600 to-emerald-500 px-5 py-2 text-sm font-bold uppercase text-white shadow-lg transition hover:from-green-700 hover:to-emerald-600"
                        >
                          Zapisz wynik
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
