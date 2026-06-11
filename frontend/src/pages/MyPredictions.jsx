import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import toast from "react-hot-toast"
import { apiRequest } from "../api"
import EmptyState from "../components/EmptyState"
import PageLoader from "../components/PageLoader"

const filters = [
  { key: "all", label: "Wszystkie" },
  { key: "upcoming", label: "Nadchodzące" },
  { key: "live", label: "Live" },
  { key: "finished", label: "Rozliczone" },
  { key: "scored", label: "Punktowane" },
  { key: "zero", label: "Bez punktów" },
]

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
  const [activeFilter, setActiveFilter] = useState("all")
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
    return <PageLoader title="Moje Typy" subtitle="Zbieram Twoje typy i punkty" cards={3} />
  }

  const getMatchStatus = (prediction) => {
    const now = new Date()
    const start = new Date(prediction.start_time)

    if (prediction.is_finished) return "finished"
    if (start <= now) return "live"
    return "upcoming"
  }

  const sortedPredictions = predictions
    .slice()
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))

  const upcomingPredictions = sortedPredictions.filter(prediction => getMatchStatus(prediction) === "upcoming")
  const livePredictions = sortedPredictions.filter(prediction => getMatchStatus(prediction) === "live")
  const finishedPredictions = sortedPredictions
    .filter(prediction => getMatchStatus(prediction) === "finished")
    .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))

  const totalPoints = predictions.reduce((sum, prediction) => {
    return sum + Number(prediction.points ?? 0)
  }, 0)
  const totalBeers = predictions.reduce((sum, prediction) => {
    return sum + Number(prediction.beers_count ?? 0)
  }, 0)

  const finishedCount = finishedPredictions.length
  const exactCount = finishedPredictions.filter(prediction => Number(prediction.points) === 2).length
  const scoredCount = finishedPredictions.filter(prediction => Number(prediction.points) > 0).length
  const hitRate = finishedCount > 0 ? Math.round((scoredCount / finishedCount) * 100) : 0
  const nextPrediction = upcomingPredictions[0]
  const latestFinished = finishedPredictions[0]

  const getFilteredPredictions = () => {
    if (activeFilter === "all") return sortedPredictions
    if (activeFilter === "upcoming") return upcomingPredictions
    if (activeFilter === "live") return livePredictions
    if (activeFilter === "finished") return finishedPredictions
    if (activeFilter === "scored") return finishedPredictions.filter(prediction => Number(prediction.points) > 0)
    if (activeFilter === "zero") return finishedPredictions.filter(prediction => Number(prediction.points ?? 0) === 0)

    return sortedPredictions
  }

  const getPointsTone = (points) => {
    if (points === 2) return "text-green-300"
    if (points === 1) return "text-yellow-300"
    return "text-red-300"
  }

  const getPointsBadgeClass = (points) => {
    if (points === 2) return "border-green-400/30 bg-green-500/15 text-green-300"
    if (points === 1) return "border-yellow-400/30 bg-yellow-500/15 text-yellow-300"
    return "border-red-400/30 bg-red-500/15 text-red-300"
  }

  const getPointsLabel = (prediction) => {
    const points = Number(prediction.points ?? 0)

    if (!prediction.is_finished) return null
    if (points === 2) return "Dokładny wynik"
    if (points === 1) return "Trafiony zwycięzca/remis"
    return "Nietrafiony"
  }

  const getStatusBadge = (status) => {
    if (status === "live") return "border-red-400/30 bg-red-500/15 text-red-300"
    if (status === "finished") return "border-gray-400/30 bg-gray-500/15 text-gray-200"
    return "border-green-400/30 bg-green-500/15 text-green-300"
  }

  const getStatusLabel = (status) => {
    if (status === "live") return "W trakcie"
    if (status === "finished") return "Rozliczony"
    return "Do edycji"
  }

  const formatMatchDate = (startTime) => {
    return new Date(startTime).toLocaleString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const renderPredictionCard = (prediction) => {
    const status = getMatchStatus(prediction)
    const points = Number(prediction.points ?? 0)
    const pointsLabel = getPointsLabel(prediction)
    const beerValue = getBeerDraftValue(prediction)
    const isSavingBeer = savingBeerId === prediction.id

    return (
      <div
        key={prediction.id}
        className="match-ticket rounded-2xl p-4 transition duration-300 hover:-translate-y-0.5 sm:p-5"
      >
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide">
              <span className={`rounded-full border px-2.5 py-1 ${getStatusBadge(status)}`}>
                {getStatusLabel(status)}
              </span>
              <span className="text-gray-400">
                {formatMatchDate(prediction.start_time)}
              </span>
            </div>

            <div className="break-words text-lg font-black tracking-wide sm:text-xl">
              {prediction.home_team}
              <span className="mx-2 text-gray-500">vs</span>
              {prediction.away_team}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-gray-400">Twój typ</span>
              <span className="rounded-full bg-yellow-500/15 px-3 py-1 font-black text-yellow-300">
                {prediction.prediction_home}:{prediction.prediction_away}
              </span>

              {prediction.is_finished && (
                <>
                  <span className="text-gray-500">wynik</span>
                  <span className="rounded-full bg-white/10 px-3 py-1 font-bold text-gray-100">
                    {prediction.final_home_score}:{prediction.final_away_score}
                  </span>
                </>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-semibold">
              <span className="text-gray-400">Piwka przy meczu</span>
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
              <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                {isSavingBeer ? "Zapisuję..." : getBeerCountLabel(clampBeerCount(beerValue))}
              </span>
            </div>

            {pointsLabel && (
              <div className={`mt-3 inline-block rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${getPointsBadgeClass(points)}`}>
                {pointsLabel}
              </div>
            )}
          </div>

          <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:flex-col sm:items-end">
            {prediction.is_finished ? (
              <div className={`text-3xl font-black ${getPointsTone(points)}`}>
                +{points}
                <span className="ml-1 text-sm font-bold text-gray-500">pkt</span>
              </div>
            ) : status === "upcoming" ? (
              <Link
                to={`/matches?edit=${prediction.match_id}`}
                className="w-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2 text-center text-sm font-bold uppercase text-white shadow-lg transition hover:from-orange-600 hover:to-amber-600 sm:w-auto"
              >
                Edytuj
              </Link>
            ) : (
              <div className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-gray-300">
                Zamknięty
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const sections = [
    {
      key: "upcoming",
      title: "Nadchodzące",
      subtitle: "Typy, które możesz jeszcze edytować",
      items: upcomingPredictions,
    },
    {
      key: "live",
      title: "W trakcie",
      subtitle: "Typowanie zamknięte, czekamy na wynik",
      items: livePredictions,
    },
    {
      key: "finished",
      title: "Rozliczone",
      subtitle: "Punkty są już naliczone",
      items: finishedPredictions,
    },
  ]

  const filteredPredictions = getFilteredPredictions()
  const activeFilterLabel = filters.find(filter => filter.key === activeFilter)?.label ?? "Typy"

  return (
    <div className="min-h-screen overflow-x-hidden px-4 py-8 text-white sm:px-6 sm:py-10">

      <div className="mx-auto w-full max-w-6xl">

        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="section-title text-4xl font-black">
              Moje Typy
            </h1>
            <div className="mt-3 h-1 w-32 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500" />
          </div>

          <div className="rounded-2xl bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 px-7 py-4 text-black shadow-xl">
            <div className="text-xs font-black uppercase tracking-wide">Razem</div>
            <div className="text-3xl font-black">{totalPoints} pkt</div>
            <div className="mt-1 text-sm font-black">{getBeerCountLabel(totalBeers)}</div>
          </div>
        </div>

        <div className="mb-6 grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="stadium-panel rounded-2xl p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-green-300">
              Najbliższy typ
            </div>

            {nextPrediction ? (
              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="break-words text-xl font-black">
                    {nextPrediction.home_team}
                    <span className="mx-2 text-gray-500">vs</span>
                    {nextPrediction.away_team}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-gray-400">
                    {formatMatchDate(nextPrediction.start_time)}
                    <span className="mx-2 text-gray-600">•</span>
                    typ {nextPrediction.prediction_home}:{nextPrediction.prediction_away}
                  </div>
                </div>

                <Link
                  to={`/matches?edit=${nextPrediction.match_id}`}
                  className="w-full flex-shrink-0 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 text-center text-sm font-bold uppercase text-white shadow-lg transition hover:from-orange-600 hover:to-amber-600 sm:w-auto"
                >
                  Edytuj
                </Link>
              </div>
            ) : (
              <div className="mt-3 text-sm font-semibold text-gray-400">
                Nie masz nadchodzących typów do edycji.
              </div>
            )}
          </div>

          <div className="stadium-panel rounded-2xl p-4">
            <div className="text-xs uppercase tracking-wide text-gray-400">Do edycji</div>
            <div className="mt-1 text-3xl font-black text-green-300">{upcomingPredictions.length}</div>
            <div className="mt-2 text-xs font-semibold text-gray-500">przed startem</div>
          </div>

          <div className="stadium-panel rounded-2xl p-4">
            <div className="text-xs uppercase tracking-wide text-gray-400">Skuteczność</div>
            <div className="mt-1 text-3xl font-black text-yellow-300">{hitRate}%</div>
            <div className="mt-2 text-xs font-semibold text-gray-500">{scoredCount}/{finishedCount} punktowane</div>
          </div>

          <div className="stadium-panel rounded-2xl p-4">
            <div className="text-xs uppercase tracking-wide text-gray-400">Dokładne</div>
            <div className="mt-1 text-3xl font-black text-orange-300">{exactCount}</div>
            <div className="mt-2 text-xs font-semibold text-gray-500">
              ostatnio {latestFinished ? `+${Number(latestFinished.points ?? 0)} pkt` : "brak"}
            </div>
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
          <EmptyState
            icon="predictions"
            title="Nie masz jeszcze żadnych typów"
            description="Przejdź do listy meczów i obstaw pierwsze wyniki."
            actionLabel="Przejdź do meczów"
            actionTo="/matches"
          />
        ) : activeFilter === "all" ? (
          <div className="space-y-10">
            {sections.map(section => (
              <section key={section.key} className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-black">{section.title}</h2>
                    <div className="text-sm font-semibold text-gray-400">{section.subtitle}</div>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-gray-300">
                    {section.items.length}
                  </div>
                </div>

                {section.items.length === 0 ? (
                  <EmptyState
                    compact
                    icon="predictions"
                    title="Brak typów"
                    description="Ta sekcja uzupełni się automatycznie, gdy pojawią się pasujące typy."
                  />
                ) : (
                  <div className="space-y-4">
                    {section.items.map(renderPredictionCard)}
                  </div>
                )}
              </section>
            ))}
          </div>
        ) : filteredPredictions.length === 0 ? (
          <EmptyState
            icon="predictions"
            title="Brak typów dla tego filtra"
            description={`Nie znaleziono typów w widoku: ${activeFilterLabel}.`}
            actionLabel="Pokaż wszystkie"
            onAction={() => setActiveFilter("all")}
          />
        ) : (
          <div className="space-y-4">
            {filteredPredictions.map(renderPredictionCard)}
          </div>
        )}

      </div>

    </div>
  )
}
