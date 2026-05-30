import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest } from "../api"

export default function Matches() {

  const [matches, setMatches] = useState([])
  const [myPredictions, setMyPredictions] = useState([])
  const [loading, setLoading] = useState(true)

  const [selectedMatch, setSelectedMatch] = useState(null)
  const [homeScore, setHomeScore] = useState("")
  const [awayScore, setAwayScore] = useState("")

  const [predictionsModal, setPredictionsModal] = useState(null)
  const [matchPredictions, setMatchPredictions] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {

      const [matchesData, predictionsData] = await Promise.all([
        apiRequest("/matches"),
        apiRequest("/my-predictions")
      ])

      if (!matchesData || !predictionsData) return

      setMatches(matchesData)
      setMyPredictions(Array.isArray(predictionsData) ? predictionsData : [])

    } catch {
      toast.error("Failed to load data")
    }

    setLoading(false)
  }

  const openModal = (match) => {
    const existing = myPredictions.find(p => p.match_id === match.id)

    if (existing) {
      setHomeScore(existing.prediction_home)
      setAwayScore(existing.prediction_away)
    } else {
      setHomeScore("")
      setAwayScore("")
    }

    setSelectedMatch(match)
  }

  const fetchMatchPredictions = async (match) => {
    try {

      const data = await apiRequest(`/matches/${match.id}/predictions`)

      if (!data) {
        toast.error("Typy nie sa jeszcze dostepne")
        return
      }

      setMatchPredictions(data)
      setPredictionsModal(match)

    } catch {
      toast.error("Server error")
    }
  }

  const submitPrediction = async () => {

    if (homeScore === "" || awayScore === "") {
      toast.error("Wprowadz wynik meczu")
      return
    }

    const existing = myPredictions.find(
      p => p.match_id === selectedMatch.id
    )

    try {

      if (!existing) {

        const data = await apiRequest("/predictions", {
          method: "POST",
          body: JSON.stringify({
            match_id: selectedMatch.id,
            home_score: Number(homeScore),
            away_score: Number(awayScore)
          })
        })

        if (!data) return

        toast.success("Twoj typ zostal zapisany")

      } else {

        const data = await apiRequest(`/predictions/${existing.id}`, {
          method: "PUT",
          body: JSON.stringify({
            home_score: Number(homeScore),
            away_score: Number(awayScore)
          })
        })

        if (!data) return

        toast.success("Twoj typ zostal zaktualizowany")
      }

      setSelectedMatch(null)
      fetchData()

    } catch {
      toast.error("Server error")
    }
  }

  const formatDayHeader = (date) => {
    return new Intl.DateTimeFormat("pl-PL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(date)
  }

  const getDayKey = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
  }

  const matchGroups = Object.entries(
    matches
      .slice()
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      .reduce((groups, match) => {
        const matchDate = new Date(match.start_time)
        const dayKey = getDayKey(matchDate)

        if (!groups[dayKey]) {
          groups[dayKey] = {
            label: formatDayHeader(matchDate),
            matches: [],
          }
        }

        groups[dayKey].matches.push(match)
        return groups
      }, {})
  )

  if (loading) {
    return <div className="p-6 text-white">Loading...</div>
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0b0f1a] text-white px-4 py-8 sm:px-6 sm:py-10">

      <div className="w-full max-w-6xl mx-auto">

        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            Mecze
          </h1>
          <div className="h-1 w-32 mx-auto mt-3 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full" />
        </div>

        <div className="space-y-10">

          {matchGroups.map(([dayKey, group]) => {

            const missingPredictions = group.matches.filter(match => {
              const isStarted = new Date(match.start_time) <= new Date()
              const myPrediction = myPredictions.find(p => p.match_id === match.id)

              return !isStarted && !myPrediction
            }).length

            return (
              <section key={dayKey} className="space-y-4">

                <div className="flex flex-col gap-2 border-b border-white/10 pb-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-xl font-black capitalize text-white sm:text-2xl">
                      {group.label}
                    </h2>
                    <div className="mt-1 h-1 w-20 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500" />
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-gray-300">
                      {group.matches.length} {group.matches.length === 1 ? "mecz" : "mecze"}
                    </span>

                    {missingPredictions > 0 && (
                      <span className="rounded-full bg-green-500/15 px-3 py-1 text-green-300">
                        {missingPredictions} do typowania
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:gap-6">

                  {group.matches.map(match => {

                    const isStarted = new Date(match.start_time) <= new Date()
                    const myPrediction = myPredictions.find(p => p.match_id === match.id)
                    const predictionButtonClass = myPrediction
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                      : "bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white"

                    return (
                      <div
                        key={match.id}
                        className="w-full bg-white/5 backdrop-blur-lg border border-white/10 p-4 sm:p-6 rounded-2xl flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center hover:bg-white/10 transition duration-300"
                      >
                        <div className="min-w-0 w-full">
                          <div className="text-base sm:text-lg font-bold tracking-wide break-words">
                            {match.home_team}
                            <span className="mx-2 text-gray-400">vs</span>
                            {match.away_team}
                          </div>

                          <div className="text-sm text-gray-400 mt-1">
                            {new Date(match.start_time).toLocaleString("pl-PL", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </div>

                          {myPrediction && (
                            <div className="text-sm text-yellow-400 mt-2 font-semibold">
                              Twoj typ: {myPrediction.prediction_home}:{myPrediction.prediction_away}
                            </div>
                          )}
                        </div>

                        <div className="w-full sm:w-auto sm:flex-shrink-0">
                          {!isStarted ? (
                            <button
                              onClick={() => openModal(match)}
                              className={`w-full sm:w-auto px-5 py-2 rounded-full font-bold uppercase text-sm transition shadow-lg ${predictionButtonClass}`}
                            >
                              {myPrediction ? "Edytuj" : "Typuj"}
                            </button>
                          ) : (
                            <button
                              onClick={() => fetchMatchPredictions(match)}
                              className="w-full sm:w-auto px-5 py-2 rounded-full font-bold uppercase text-sm bg-gray-600 hover:bg-gray-500 text-white transition shadow-lg"
                            >
                              Zobacz typy
                            </button>
                          )}
                        </div>

                      </div>
                    )
                  })}

                </div>

              </section>
            )
          })}

        </div>
      </div>

      {selectedMatch && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">

          <div className="bg-[#111827] border border-white/10 p-6 sm:p-8 rounded-3xl w-[calc(100%-2rem)] max-w-sm shadow-2xl text-center">

            <h2 className="text-2xl font-bold mb-6">
              {selectedMatch.home_team} vs {selectedMatch.away_team}
            </h2>

            <div className="flex justify-center items-center gap-6 mb-6">

              <input
                type="number"
                min="0"
                max="20"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                className="w-20 p-3 rounded-xl bg-white/10 text-white text-center border border-white/20 focus:border-red-500 outline-none"
              />

              <span className="text-2xl font-bold">:</span>

              <input
                type="number"
                min="0"
                max="20"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                className="w-20 p-3 rounded-xl bg-white/10 text-white text-center border border-white/20 focus:border-red-500 outline-none"
              />

            </div>

            <div className="flex justify-between">

              <button
                onClick={() => setSelectedMatch(null)}
                className="px-5 py-2 bg-gray-600 rounded-full hover:bg-gray-700 transition"
              >
                Anuluj
              </button>

              <button
                onClick={submitPrediction}
                className="px-5 py-2 rounded-full font-bold bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 transition"
              >
                Zapisz
              </button>

            </div>

          </div>
        </div>
      )}

      {predictionsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">

          <div className="bg-[#111827] border border-white/10 p-6 sm:p-8 rounded-3xl w-[calc(100%-2rem)] max-w-sm shadow-2xl">

            <h2 className="text-2xl font-bold mb-6 text-center">
              Typy uzytkownikow
            </h2>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {matchPredictions.map((p, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center border-b border-white/10 pb-2"
                >
                  <div className="font-semibold">{p.username}</div>
                  <div>{p.prediction}</div>
                  {p.points !== null && (
                    <div className="text-yellow-400 font-bold">
                      {p.points}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setPredictionsModal(null)}
                className="px-6 py-2 bg-gray-600 rounded-full hover:bg-gray-700 transition"
              >
                Zamknij
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
