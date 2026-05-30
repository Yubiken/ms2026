import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { apiRequest } from "../api"

const filters = [
  { key: "all", label: "Wszystkie" },
  { key: "upcoming", label: "Nadchodzace" },
  { key: "live", label: "Live" },
  { key: "finished", label: "Zakonczone" },
  { key: "scored", label: "Punktowane" },
  { key: "zero", label: "Bez punktow" },
]

export default function MyPredictions() {

  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState("all")

  useEffect(() => {

    apiRequest("/my-predictions")
      .then(data => {

        if (!data) return

        setPredictions(data)
        setLoading(false)

      })
      .catch(() => setLoading(false))

  }, [])

  if (loading) {
    return <div className="p-8 text-white">Loading...</div>
  }

  const getMatchStatus = (match) => {
    const now = new Date()
    const start = new Date(match.start_time)

    if (match.is_finished) return "finished"
    if (start <= now) return "live"
    return "upcoming"
  }

  const totalPoints = predictions.reduce((sum, p) => {
    return sum + Number(p.points ?? 0)
  }, 0)

  const finishedCount = predictions.filter(p => p.is_finished).length
  const exactCount = predictions.filter(p => p.is_finished && Number(p.points) === 2).length
  const scoredCount = predictions.filter(p => p.is_finished && Number(p.points) > 0).length
  const upcomingCount = predictions.filter(p => getMatchStatus(p) === "upcoming").length

  const filteredPredictions = predictions.filter(prediction => {
    const status = getMatchStatus(prediction)
    const points = Number(prediction.points ?? 0)

    if (activeFilter === "all") return true
    if (activeFilter === "scored") return prediction.is_finished && points > 0
    if (activeFilter === "zero") return prediction.is_finished && points === 0

    return status === activeFilter
  })

  const getPointsColor = (points) => {
    if (points === 2) return "text-green-400"
    if (points === 1) return "text-yellow-400"
    return "text-red-400"
  }

  const getStatusBadge = (status) => {
    if (status === "live")
      return "bg-red-600 text-white animate-pulse"
    if (status === "finished")
      return "bg-gray-600 text-white"
    return "bg-blue-600 text-white"
  }

  const getStatusLabel = (status) => {
    if (status === "live") return "Live"
    if (status === "finished") return "Zakonczony"
    return "Nadchodzacy"
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0b0f1a] text-white px-4 py-8 sm:px-6 sm:py-10">

      <div className="w-full max-w-6xl mx-auto">

        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">

          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              Moje Typy
            </h1>
            <div className="h-1 w-32 mt-3 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full" />
          </div>

          <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-black px-8 py-4 rounded-2xl shadow-xl text-2xl font-black tracking-wide">
            {totalPoints} pts
          </div>

        </div>

        <div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-wide text-gray-400">Obstawione</div>
            <div className="mt-1 text-2xl font-black">{predictions.length}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-wide text-gray-400">Nadchodzace</div>
            <div className="mt-1 text-2xl font-black text-blue-300">{upcomingCount}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-wide text-gray-400">Punktowane</div>
            <div className="mt-1 text-2xl font-black text-green-300">{scoredCount}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-wide text-gray-400">Dokladne</div>
            <div className="mt-1 text-2xl font-black text-yellow-300">{exactCount}/{finishedCount}</div>
          </div>
        </div>

        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {filters.map(filter => {
            const isActive = activeFilter === filter.key

            return (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
                  isActive
                    ? "bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-black"
                    : "bg-white/10 text-gray-300 hover:bg-white/15"
                }`}
              >
                {filter.label}
              </button>
            )
          })}
        </div>

        {predictions.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <div className="text-xl font-black">Nie masz jeszcze zadnych typow</div>
            <div className="mt-2 text-sm text-gray-400">
              Przejdz do listy meczow i obstaw pierwsze wyniki.
            </div>
            <Link
              to="/matches"
              className="mt-5 inline-block rounded-full bg-gradient-to-r from-green-600 to-emerald-500 px-6 py-2 font-bold uppercase text-white transition hover:from-green-700 hover:to-emerald-600"
            >
              Przejdz do meczow
            </Link>
          </div>
        ) : filteredPredictions.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-gray-300">
            Brak typow dla wybranego filtra.
          </div>
        ) : (
          <div className="space-y-6">

            {filteredPredictions.map(p => {

              const status = getMatchStatus(p)

              return (
                <div
                  key={p.id}
                  className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 sm:p-6 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center hover:bg-white/10 transition duration-300"
                >

                  <div className="min-w-0 w-full">

                    <div className="text-base sm:text-lg font-bold tracking-wide break-words">
                      {p.home_team}
                      <span className="mx-2 text-gray-400">vs</span>
                      {p.away_team}
                    </div>

                    <div className="text-sm text-gray-400 mt-1">
                      {new Date(p.start_time).toLocaleString("pl-PL", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </div>

                    <div className="mt-3 text-sm">
                      Twoj typ:
                      <span className="font-bold ml-2 text-yellow-400">
                        {p.prediction_home}:{p.prediction_away}
                      </span>
                    </div>

                    {p.is_finished && (
                      <div className="text-sm mt-2 text-gray-400">
                        Wynik koncowy: {p.final_home_score}:{p.final_away_score}
                      </div>
                    )}

                  </div>

                  <div className="w-full text-left sm:w-auto sm:flex-shrink-0 sm:text-right">

                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${getStatusBadge(status)}`}>
                      {getStatusLabel(status)}
                    </div>

                    {p.is_finished ? (
                      <div className={`text-3xl font-black ${getPointsColor(Number(p.points))}`}>
                        {p.points} pts
                      </div>
                    ) : (
                      <div className="text-gray-500 text-xl">
                        -
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
