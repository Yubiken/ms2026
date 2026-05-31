import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest } from "../api"
import PageLoader from "../components/PageLoader"

const statusFilters = [
  { key: "all", label: "Wszystkie" },
  { key: "todo", label: "Do typowania" },
  { key: "predicted", label: "Obstawione" },
  { key: "locked", label: "Zamknięte" },
  { key: "finished", label: "Zakończone" },
]

const groupFilters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]
const popularScores = ["1:0", "1:1", "2:1", "2:0"]

const clampScore = (value) => {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) return 0

  return Math.min(20, Math.max(0, Math.trunc(parsed)))
}

function ScoreControl({ label, value, onChange }) {
  const currentValue = value === "" ? 0 : clampScore(value)

  const updateValue = (nextValue) => {
    onChange(String(clampScore(nextValue)))
  }

  const handleInputChange = (event) => {
    const nextValue = event.target.value

    if (nextValue === "") {
      onChange("")
      return
    }

    updateValue(nextValue)
  }

  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className="truncate text-center text-xs font-bold uppercase tracking-wide text-gray-400">
        {label}
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => updateValue(currentValue - 1)}
          disabled={currentValue <= 0}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl font-black text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label={`Zmniejsz wynik: ${label}`}
        >
          -
        </button>

        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={handleInputChange}
          className="h-12 w-14 rounded-2xl border border-white/15 bg-black/25 text-center text-2xl font-black text-white outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-500/30"
        />

        <button
          type="button"
          onClick={() => updateValue(currentValue + 1)}
          disabled={currentValue >= 20}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl font-black text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label={`Zwiększ wynik: ${label}`}
        >
          +
        </button>
      </div>
    </div>
  )
}

export default function Matches() {

  const [matches, setMatches] = useState([])
  const [myPredictions, setMyPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeStatusFilter, setActiveStatusFilter] = useState("all")
  const [activeGroupFilter, setActiveGroupFilter] = useState("all")

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
      toast.error("Nie udało się załadować danych")
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
        toast.error("Typy nie są jeszcze dostępne")
        return
      }

      setMatchPredictions(data)
      setPredictionsModal(match)

    } catch {
      toast.error("Błąd serwera")
    }
  }

  const submitPrediction = async () => {
    if (homeScore === "" || awayScore === "") {
      toast.error("Wprowadź wynik meczu")
      return
    }

    const normalizedHomeScore = Number(homeScore)
    const normalizedAwayScore = Number(awayScore)

    if (
      !Number.isInteger(normalizedHomeScore) ||
      !Number.isInteger(normalizedAwayScore) ||
      normalizedHomeScore < 0 ||
      normalizedAwayScore < 0 ||
      normalizedHomeScore > 20 ||
      normalizedAwayScore > 20
    ) {
      toast.error("Wynik musi być liczbą od 0 do 20")
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
            home_score: normalizedHomeScore,
            away_score: normalizedAwayScore
          })
        })

        if (!data) return

        toast.success("Twój typ został zapisany")

      } else {
        const data = await apiRequest(`/predictions/${existing.id}`, {
          method: "PUT",
          body: JSON.stringify({
            home_score: normalizedHomeScore,
            away_score: normalizedAwayScore
          })
        })

        if (!data) return

        toast.success("Twój typ został zaktualizowany")
      }

      setSelectedMatch(null)
      fetchData()

    } catch {
      toast.error("Błąd serwera")
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

  const groupColors = {
    A: "bg-yellow-400",
    B: "bg-emerald-400",
    C: "bg-sky-400",
    D: "bg-red-400",
    E: "bg-violet-400",
    F: "bg-cyan-300",
    G: "bg-lime-400",
    H: "bg-orange-400",
    I: "bg-blue-400",
    J: "bg-fuchsia-400",
    K: "bg-teal-400",
    L: "bg-rose-400",
  }

  const getMatchState = (match) => {
    const isStarted = new Date(match.start_time) <= new Date()
    const myPrediction = myPredictions.find(p => p.match_id === match.id)

    if (match.is_finished) return "finished"
    if (isStarted) return "locked"
    if (myPrediction) return "predicted"
    return "todo"
  }

  const getMatchStatus = (match) => {
    const state = getMatchState(match)

    if (state === "finished") {
      return {
        label: "Zakończony",
        className: "bg-gray-500/20 text-gray-200 border-gray-400/30",
      }
    }

    if (state === "locked") {
      return {
        label: "Zamknięte",
        className: "bg-red-500/15 text-red-300 border-red-400/30",
      }
    }

    if (state === "predicted") {
      return {
        label: "Obstawione",
        className: "bg-orange-500/15 text-orange-300 border-orange-400/30",
      }
    }

    return {
      label: "Do typowania",
      className: "bg-green-500/15 text-green-300 border-green-400/30",
    }
  }

  const filteredMatches = matches.filter(match => {
    const statusMatch = activeStatusFilter === "all" || getMatchState(match) === activeStatusFilter
    const groupMatch = activeGroupFilter === "all" || match.group_name === activeGroupFilter

    return statusMatch && groupMatch
  })

  const statusCounts = matches.reduce((counts, match) => {
    const state = getMatchState(match)
    counts[state] = (counts[state] || 0) + 1
    return counts
  }, {})

  const matchGroups = Object.entries(
    filteredMatches
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
    return <PageLoader title="Mecze" subtitle="Ładuję terminarz i Twoje typy" cards={5} />
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden px-4 py-8 text-white sm:px-6 sm:py-10">

      <div className="w-full max-w-6xl mx-auto">

        <div className="mb-8 text-center">
          <h1 className="section-title text-4xl font-black">
            Mecze
          </h1>
          <div className="h-1 w-32 mx-auto mt-3 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full" />
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="stadium-panel rounded-2xl p-4">
            <div className="text-xs uppercase tracking-wide text-gray-400">Do typowania</div>
            <div className="mt-1 text-2xl font-black text-green-300">{statusCounts.todo || 0}</div>
          </div>

          <div className="stadium-panel rounded-2xl p-4">
            <div className="text-xs uppercase tracking-wide text-gray-400">Obstawione</div>
            <div className="mt-1 text-2xl font-black text-orange-300">{statusCounts.predicted || 0}</div>
          </div>

          <div className="stadium-panel rounded-2xl p-4">
            <div className="text-xs uppercase tracking-wide text-gray-400">Zamknięte</div>
            <div className="mt-1 text-2xl font-black text-red-300">{statusCounts.locked || 0}</div>
          </div>

          <div className="stadium-panel rounded-2xl p-4">
            <div className="text-xs uppercase tracking-wide text-gray-400">Zakończone</div>
            <div className="mt-1 text-2xl font-black text-gray-200">{statusCounts.finished || 0}</div>
          </div>
        </div>

        <div className="stadium-panel mb-8 rounded-2xl p-4">
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {statusFilters.map(filter => {
              const isActive = activeStatusFilter === filter.key

              return (
                <button
                  key={filter.key}
                  onClick={() => setActiveStatusFilter(filter.key)}
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

          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveGroupFilter("all")}
              className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
                activeGroupFilter === "all"
                  ? "bg-white text-black"
                  : "bg-white/10 text-gray-300 hover:bg-white/15"
              }`}
            >
              Wszystkie grupy
            </button>

            {groupFilters.map(group => (
              <button
                key={group}
                onClick={() => setActiveGroupFilter(group)}
                className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
                  activeGroupFilter === group
                    ? `${groupColors[group]} text-black`
                    : "bg-white/10 text-gray-300 hover:bg-white/15"
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>

        {matchGroups.length === 0 ? (
          <div className="stadium-panel rounded-2xl p-8 text-center text-gray-300">
            Brak meczów dla wybranych filtrów.
          </div>
        ) : (
          <div className="space-y-10">

            {matchGroups.map(([dayKey, group]) => {
              const missingPredictions = group.matches.filter(match => getMatchState(match) === "todo").length

              return (
                <section key={dayKey} className="space-y-4">

                  <div className="relative overflow-hidden rounded-xl border border-orange-400/20 bg-gradient-to-r from-orange-500/20 via-yellow-500/10 to-white/[0.03] px-4 py-3 shadow-lg sm:flex sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-black capitalize text-white sm:text-2xl">
                        {group.label}
                      </h2>
                      <div className="mt-2 h-1 w-24 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500" />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide sm:mt-0">
                      <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-gray-200">
                        {group.matches.length} {group.matches.length === 1 ? "mecz" : "mecze"}
                      </span>

                      {missingPredictions > 0 && (
                        <span className="rounded-full border border-green-400/20 bg-green-500/15 px-3 py-1 text-green-300">
                          {missingPredictions} do typowania
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:gap-6">

                    {group.matches.map(match => {
                      const isStarted = new Date(match.start_time) <= new Date()
                      const myPrediction = myPredictions.find(p => p.match_id === match.id)
                      const status = getMatchStatus(match)
                      const predictionButtonClass = myPrediction
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                        : "bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white"

                      return (
                        <div
                          key={match.id}
                          className="match-ticket w-full rounded-2xl p-4 pl-6 transition duration-300 hover:-translate-y-0.5 sm:p-6 sm:pl-8"
                        >
                          <span className={`group-strip ${groupColors[match.group_name] || "bg-white/40"}`} />

                          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0 w-full">
                              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">
                                {match.group_name && (
                                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-gray-200">
                                    Grupa {match.group_name}
                                  </span>
                                )}
                                <span className={`rounded-full border px-2.5 py-1 ${status.className}`}>
                                  {status.label}
                                </span>
                                <span>
                                  {new Date(match.start_time).toLocaleString("pl-PL", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })}
                                </span>
                              </div>

                              <div className="text-lg font-black tracking-wide break-words sm:text-xl">
                                {match.home_team}
                                <span className="mx-2 text-gray-500">vs</span>
                                {match.away_team}
                              </div>

                              {myPrediction && (
                                <div className="text-sm text-yellow-400 mt-3 font-semibold">
                                  Twój typ: {myPrediction.prediction_home}:{myPrediction.prediction_away}
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

                        </div>
                      )
                    })}

                  </div>

                </section>
              )
            })}

          </div>
        )}
      </div>

      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 px-4 pb-4 pt-10 backdrop-blur-sm sm:items-center sm:p-6">

          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111827] p-5 text-left shadow-2xl sm:p-7">

            <div className="mb-5">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">
                {selectedMatch.group_name && (
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-gray-200">
                    Grupa {selectedMatch.group_name}
                  </span>
                )}
                <span>
                  {new Date(selectedMatch.start_time).toLocaleString("pl-PL", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <h2 className="text-2xl font-black leading-tight text-white">
                {selectedMatch.home_team}
                <span className="mx-2 text-gray-500">vs</span>
                {selectedMatch.away_team}
              </h2>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
              <ScoreControl
                label={selectedMatch.home_team}
                value={homeScore}
                onChange={setHomeScore}
              />

              <div className="pt-14 text-2xl font-black text-gray-500">:</div>

              <ScoreControl
                label={selectedMatch.away_team}
                value={awayScore}
                onChange={setAwayScore}
              />
            </div>

            <div className="mt-5">
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                Szybki wybór
              </div>
              <div className="flex flex-wrap gap-2">
                {popularScores.map(score => {
                  const [home, away] = score.split(":")

                  return (
                    <button
                      key={score}
                      type="button"
                      onClick={() => {
                        setHomeScore(home)
                        setAwayScore(away)
                      }}
                      className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm font-bold text-gray-100 transition hover:bg-white/15"
                    >
                      {score}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedMatch(null)}
                className="rounded-full bg-gray-600 px-5 py-3 font-bold transition hover:bg-gray-700"
              >
                Anuluj
              </button>

              <button
                type="button"
                onClick={submitPrediction}
                className="rounded-full bg-gradient-to-r from-green-600 to-emerald-500 px-5 py-3 font-bold transition hover:from-green-700 hover:to-emerald-600"
              >
                Zapisz
              </button>
            </div>
          </div>
        </div>
      )}

      {predictionsModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 px-4 pb-4 pt-10 backdrop-blur-sm sm:items-center sm:p-6">

          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111827] p-5 shadow-2xl sm:p-7">

            <div className="mb-5 text-center">
              <h2 className="text-2xl font-black">
                Typy użytkowników
              </h2>
              <div className="mt-2 text-sm text-gray-400">
                {predictionsModal.home_team} vs {predictionsModal.away_team}
              </div>
            </div>

            {matchPredictions.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center text-sm text-gray-400">
                Brak widocznych typów dla tego meczu.
              </div>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {matchPredictions.map((p, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
                  >
                    <div className="min-w-0 truncate font-semibold">{p.username}</div>
                    <div className="font-black text-yellow-300">{p.prediction}</div>
                    {p.points !== null && (
                      <div className="rounded-full bg-white/10 px-2 py-1 text-xs font-bold text-gray-200">
                        {p.points} pkt
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setPredictionsModal(null)}
                className="rounded-full bg-gray-600 px-6 py-3 font-bold transition hover:bg-gray-700"
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
