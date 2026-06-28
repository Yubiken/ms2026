import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import toast from "react-hot-toast"
import { apiRequest } from "../api"
import EmptyState from "../components/EmptyState"
import PageLoader from "../components/PageLoader"
import TeamName from "../components/TeamName"

const clampBeerCount = (value) => {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) return 0

  return Math.min(99, Math.max(0, Math.trunc(parsed)))
}

const getBeerCountLabel = (count) => {
  const value = Number(count ?? 0)

  if (value === 1) return "1 piwo"
  if (value >= 2 && value <= 4) return `${value} piwa`

  return `${value} piwek`
}

export default function MyPredictions() {
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [beerDrafts, setBeerDrafts] = useState({})
  const [savingBeerId, setSavingBeerId] = useState(null)

  useEffect(() => {
    apiRequest("/my-predictions")
      .then(data => {
        if (!data) return

        setPredictions(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const getMatchStatus = (prediction) => {
    const now = new Date()
    const start = new Date(prediction.start_time)

    if (prediction.is_finished) return "finished"
    if (start <= now) return "locked"
    return "upcoming"
  }

  const getStatusLabel = (status) => {
    if (status === "finished") return "Rozliczony"
    if (status === "locked") return "Zamknięty"
    return "Do edycji"
  }

  const getStatusClass = (status) => {
    if (status === "finished") return "border-gray-400/30 bg-gray-500/15 text-gray-200"
    if (status === "locked") return "border-red-400/30 bg-red-500/15 text-red-300"
    return "border-green-400/30 bg-green-500/15 text-green-300"
  }

  const formatMatchDate = (startTime) => {
    return new Date(startTime).toLocaleString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getBeerDraftValue = (prediction) => {
    const draft = beerDrafts[prediction.id]

    if (draft != null) return draft

    return String(Number(prediction.beers_count ?? 0))
  }

  const setBeerDraftValue = (predictionId, value) => {
    if (value === "") {
      setBeerDrafts(current => ({
        ...current,
        [predictionId]: "",
      }))
      return
    }

    setBeerDrafts(current => ({
      ...current,
      [predictionId]: String(clampBeerCount(value)),
    }))
  }

  const updatePredictionBeerCount = (updatedPrediction) => {
    setPredictions(currentPredictions =>
      currentPredictions.map(prediction =>
        prediction.id === updatedPrediction.id
          ? {
              ...prediction,
              beers_count: updatedPrediction.beers_count,
            }
          : prediction
      )
    )
  }

  const saveBeerCount = async (prediction, rawValue) => {
    const beersCount = clampBeerCount(rawValue)

    setSavingBeerId(prediction.id)

    try {
      const data = await apiRequest(`/predictions/${prediction.id}/beers`, {
        method: "PUT",
        body: JSON.stringify({
          beers_count: beersCount,
        }),
      })

      if (!data) return

      updatePredictionBeerCount(data)
      setBeerDrafts(current => ({
        ...current,
        [prediction.id]: String(data.beers_count ?? beersCount),
      }))
    } catch {
      toast.error("Nie udało się zapisać piwek")
    } finally {
      setSavingBeerId(null)
    }
  }

  const adjustBeerCount = (prediction, delta) => {
    const currentValue = clampBeerCount(getBeerDraftValue(prediction))
    const nextValue = clampBeerCount(currentValue + delta)

    setBeerDrafts(current => ({
      ...current,
      [prediction.id]: String(nextValue),
    }))

    saveBeerCount(prediction, nextValue)
  }

  if (loading) {
    return <PageLoader title="Moje typy" subtitle="Zbieram Twoje typy i punkty" cards={3} />
  }

  const sortedPredictions = predictions
    .slice()
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))

  const totalPoints = predictions.reduce((sum, prediction) => {
    return sum + Number(prediction.points ?? 0)
  }, 0)
  const totalBeers = predictions.reduce((sum, prediction) => {
    return sum + Number(prediction.beers_count ?? 0)
  }, 0)
  const editableCount = predictions.filter(prediction => getMatchStatus(prediction) === "upcoming").length
  const settledCount = predictions.filter(prediction => prediction.is_finished).length

  return (
    <div className="min-h-screen overflow-x-hidden px-4 py-8 text-white sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="section-title text-4xl font-black">
              Moje typy
            </h1>
            <div className="mt-3 h-1 w-32 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500" />
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center">
            <div className="px-2">
              <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Typy</div>
              <div className="mt-1 text-xl font-black text-white">{predictions.length}</div>
            </div>
            <div className="px-2">
              <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Punkty</div>
              <div className="mt-1 text-xl font-black text-yellow-300">{totalPoints}</div>
            </div>
            <div className="px-2">
              <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Piwka</div>
              <div className="mt-1 text-xl font-black text-green-300">{getBeerCountLabel(totalBeers)}</div>
            </div>
          </div>
        </div>

        {predictions.length === 0 ? (
          <EmptyState
            icon="predictions"
            title="Nie masz jeszcze żadnych typów"
            description="Przejdź do listy meczów i obstaw pierwsze wyniki."
            actionLabel="Przejdź do meczów"
            actionTo="/matches"
          />
        ) : (
          <>
            <div className="mb-5 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1">
                {editableCount} do edycji
              </span>
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1">
                {settledCount} rozliczone
              </span>
            </div>

            <div className="space-y-3">
              {sortedPredictions.map(prediction => {
                const status = getMatchStatus(prediction)
                const beerValue = getBeerDraftValue(prediction)
                const isSavingBeer = savingBeerId === prediction.id
                const hasFinalScore = prediction.is_finished
                  && prediction.final_home_score != null
                  && prediction.final_away_score != null
                const points = Number(prediction.points ?? 0)

                return (
                  <div
                    key={prediction.id}
                    className="match-ticket rounded-2xl p-4 transition duration-300 sm:p-5"
                  >
                    <div className="relative z-10 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide">
                          <span className={`rounded-full border px-2.5 py-1 ${getStatusClass(status)}`}>
                            {getStatusLabel(status)}
                          </span>
                          <span className="text-gray-400">
                            {formatMatchDate(prediction.start_time)}
                          </span>
                        </div>

                        <div className="break-words text-base font-black sm:text-lg">
                          <TeamName name={prediction.home_team} />
                          <span className="mx-2 text-gray-500">vs</span>
                          <TeamName name={prediction.away_team} />
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold">
                          <span className="rounded-full border border-yellow-400/25 bg-yellow-500/15 px-2.5 py-1 text-yellow-300">
                            Typ: {prediction.prediction_home}:{prediction.prediction_away}
                          </span>

                          {hasFinalScore && (
                            <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-gray-200">
                              Wynik: {prediction.final_home_score}:{prediction.final_away_score}
                            </span>
                          )}

                          {prediction.is_finished && (
                            <span className={`rounded-full border px-2.5 py-1 ${
                              points > 0
                                ? "border-green-400/25 bg-green-500/15 text-green-300"
                                : "border-red-400/25 bg-red-500/15 text-red-300"
                            }`}>
                              +{points} pkt
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 lg:justify-end">
                        <div className="flex items-center rounded-full border border-white/10 bg-white/[0.06] p-1">
                          <button
                            type="button"
                            onClick={() => adjustBeerCount(prediction, -1)}
                            disabled={isSavingBeer || clampBeerCount(beerValue) <= 0}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-lg font-black text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-35"
                            aria-label="Zmniejsz liczbę piwek"
                          >
                            -
                          </button>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={beerValue}
                            onChange={(event) => setBeerDraftValue(prediction.id, event.target.value)}
                            onBlur={() => saveBeerCount(prediction, beerValue)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.currentTarget.blur()
                              }
                            }}
                            className="h-8 w-12 bg-transparent text-center text-base font-black text-green-300 outline-none"
                            aria-label="Liczba piwek wypitych podczas meczu"
                          />
                          <button
                            type="button"
                            onClick={() => adjustBeerCount(prediction, 1)}
                            disabled={isSavingBeer || clampBeerCount(beerValue) >= 99}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-lg font-black text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-35"
                            aria-label="Zwiększ liczbę piwek"
                          >
                            +
                          </button>
                        </div>

                        {status === "upcoming" && (
                          <Link
                            to={`/matches?edit=${prediction.match_id}`}
                            className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-bold uppercase text-white shadow-lg transition hover:from-orange-600 hover:to-amber-600"
                          >
                            Edytuj
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
