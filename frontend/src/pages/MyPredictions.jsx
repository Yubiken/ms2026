import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { apiRequest } from "../api"

const filters = [
  { key: "all", label: "Wszystkie" },
  { key: "upcoming", label: "Nadchodzące" },
  { key: "live", label: "Live" },
  { key: "finished", label: "Zakończone" },
  { key: "scored", label: "Punktowane" },
  { key: "zero", label: "Bez punktów" },
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

  const getPointsLabel = (prediction) => {
    const points = Number(prediction.points ?? 0)

    if (!prediction.is_finished) return null
    if (points === 2) return "Dokładny wynik"
    if (points === 1) return "Trafiony zwycięzca/remis"
    return "Nietrafiony"
  }

  const getPointsLabelClass = (points) => {
    if (points === 2) return "bg-green-500/15 text-green-300 border-green-400/30"
    if (points === 1) return "bg-yellow-500/15 text-yellow-300 border-yellow-400/30"
    return "bg-red-500/15 text-red-300 border-red-400/30"
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
    if (status === "finished") return "Zakończony"
    return "Nadchodzący"
  }

  return (
    <div className="min-h-screen overflow-x-hidden px-4 py-8 text-white sm:px-6 sm:py-10">

      <div className="w-full max-w-6xl mx-auto">

        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">

          <div>
            <h1 className="section-title text-3xl font-black">
              Moje Typy
            </h1>
            <div className="h-1 w-32 mt-3 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full" />
          </div>

          <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-black px-8 py-4 rounded-2xl shadow-xl text-2xl font-black tracking-wide">
            {totalPoints} pkt
          </div>

        </div>

        <div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-4">
          <div className="stadium-panel rounded-2xl p-4">
            <div className="text-xs uppercase tracking-wide text-gray-400">Obstawione</div>
            <div className="mt-1 text-2xl font-black">{predictions.length}</div>
          </div>

          <div className="stadium-panel rounded-2xl p-4">
            <div className="text-xs uppercase tracking-wide text-gray-400">Nadchodzące</div>
            <div className="mt-1 text-2xl font-black text-blue-300">{upcomingCount}</div>
          </div>

          <div className="stadium-panel rounded-2xl p-4">
            <div className="text-xs uppercase tracking-wide text-gray-400">Punktowane</div>
            <div className="mt-1 text-2xl font-black text-green-300">{scoredCount}</div>
          </div>

          <div className="stadium-panel rounded-2xl p-4">
            <div className="text-xs uppercase tracking-wide text-gray-400">Dokładne</div>
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
          <div className="stadium-panel rounded-2xl p-8 text-center">
            <div className="text-xl font-black">Nie masz jeszcze żadnych typów</div>
            <div className="mt-2 text-sm text-gray-400">
              Przejdź do listy meczów i obstaw pierwsze wyniki.
            </div>
            <Link
              to="/matches"
              className="mt-5 inline-block rounded-full bg-gradient-to-r from-green-600 to-emerald-500 px-6 py-2 font-bold uppercase text-white transition hover:from-green-700 hover:to-emerald-600"
            >
              Przejdź do meczów
            </Link>
          </div>
        ) : filteredPredictions.length === 0 ? (
          <div className="stadium-panel rounded-2xl p-8 text-center text-gray-300">
            Brak typów dla wybranego filtra.
          </div>
        ) : (
          <div className="space-y-6">

            {filteredPredictions.map(p => {

              const status = getMatchStatus(p)
              const points = Number(p.points ?? 0)
              const pointsLabel = getPointsLabel(p)

              return (
                <div
                  key={p.id}
                  className="match-ticket rounded-2xl p-4 sm:p-6 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center transition duration-300 hover:-translate-y-0.5"
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
                      Twój typ:
                      <span className="font-bold ml-2 text-yellow-400">
                        {p.prediction_home}:{p.prediction_away}
                      </span>
                    </div>

                    {p.is_finished && (
                      <div className="text-sm mt-2 text-gray-400">
                        Wynik końcowy: {p.final_home_score}:{p.final_away_score}
                      </div>
                    )}

                    {pointsLabel && (
                      <div className={`mt-3 inline-block rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${getPointsLabelClass(points)}`}>
                        {pointsLabel}
                      </div>
                    )}

                  </div>

                  <div className="w-full text-left sm:w-auto sm:flex-shrink-0 sm:text-right">

                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${getStatusBadge(status)}`}>
                      {getStatusLabel(status)}
                    </div>

                    {p.is_finished ? (
                      <div className={`text-3xl font-black ${getPointsColor(points)}`}>
                        {p.points} pkt
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
