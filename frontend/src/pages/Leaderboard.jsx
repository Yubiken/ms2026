import { useEffect, useState } from "react"
import { getUsername } from "../auth"
import { apiRequest } from "../api"
import EmptyState from "../components/EmptyState"
import PageLoader from "../components/PageLoader"

const rankingModes = [
  { key: "points", label: "Punkty", endpoint: "/leaderboard", valueKey: "points" },
  { key: "beers", label: "Piwka", endpoint: "/beer-leaderboard", valueKey: "beers" },
]

const getBeerCountLabel = (count) => {
  const value = Number(count ?? 0)

  if (value === 1) return "1 piwo"
  if (value >= 2 && value <= 4) return `${value} piwa`

  return `${value} piwek`
}

export default function Leaderboard() {

  const [rankings, setRankings] = useState({
    points: [],
    beers: [],
  })
  const [activeMode, setActiveMode] = useState("points")
  const [loading, setLoading] = useState(true)
  const [historyModal, setHistoryModal] = useState(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const currentUser = getUsername()

  useEffect(() => {
    Promise.all([
      apiRequest("/leaderboard"),
      apiRequest("/beer-leaderboard"),
    ])
      .then(([pointsData, beersData]) => {
        const buildRanking = (data, valueKey) => {
          if (!Array.isArray(data)) return []

          return [...data]
            .sort((a, b) => Number(b[valueKey] ?? 0) - Number(a[valueKey] ?? 0))
            .map((user, index) => ({
              ...user,
              position: index + 1,
            }))
        }

        setRankings({
          points: buildRanking(pointsData, "points"),
          beers: buildRanking(beersData, "beers"),
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const activeConfig = rankingModes.find(mode => mode.key === activeMode) ?? rankingModes[0]
  const ranking = rankings[activeConfig.key]
  const valueKey = activeConfig.valueKey
  const isBeerMode = activeMode === "beers"

  if (loading) {
    return <PageLoader title="Ranking Ligi" subtitle="Przeliczam tabelę" cards={5} />
  }

  const leader = ranking[0]
  const leaderValue = Number(leader?.[valueKey] ?? 0)
  const totalPlayers = ranking.length
  const totalValue = ranking.reduce((sum, user) => sum + Number(user[valueKey] ?? 0), 0)
  const averageValue = totalPlayers > 0 ? (totalValue / totalPlayers).toFixed(1) : "0.0"
  const currentUserRank = ranking.find(user => user.username === currentUser)

  const formatValue = (value) => {
    const normalizedValue = Number(value ?? 0)

    return isBeerMode ? getBeerCountLabel(normalizedValue) : `${normalizedValue} pkt`
  }

  const getMedal = (position) => {
    if (position === 1) return "1"
    if (position === 2) return "2"
    if (position === 3) return "3"
    return position
  }

  const openHistory = async (user) => {
    setHistoryLoading(true)
    setHistoryModal({
      username: user.username,
      predictions: [],
      points: 0,
      beers: 0,
    })

    try {
      const data = await apiRequest(`/leaderboard/${user.user_id}/history`)

      if (!data) {
        setHistoryModal(null)
        return
      }

      setHistoryModal(data)
    } finally {
      setHistoryLoading(false)
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden px-4 py-8 text-white sm:px-6 sm:py-12">

      <div className="w-full max-w-5xl mx-auto">

        <div className="text-center mb-8">
          <h1 className="section-title text-3xl font-black">
            {isBeerMode ? "Ranking Piwny" : "Ranking Ligi"}
          </h1>
          <div className="h-1 w-40 mx-auto mt-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full" />
        </div>

        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-full border border-white/10 bg-white/10 p-1">
            {rankingModes.map(mode => {
              const isActive = mode.key === activeMode

              return (
                <button
                  key={mode.key}
                  type="button"
                  onClick={() => setActiveMode(mode.key)}
                  className={`rounded-full px-5 py-2 text-sm font-bold uppercase transition ${
                    isActive
                      ? "bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-black"
                      : "text-gray-300 hover:bg-white/10"
                  }`}
                >
                  {mode.label}
                </button>
              )
            })}
          </div>
        </div>

        {ranking.length === 0 ? (
          <EmptyState
            icon="ranking"
            title="Ranking jest jeszcze pusty"
            description={isBeerMode
              ? "Ranking piwny ruszy, gdy ktoś zapisze pierwsze piwka przy meczu."
              : "Tabela zacznie żyć, gdy pojawią się pierwsze typy i rozliczone wyniki."
            }
            actionLabel="Przejdź do meczów"
            actionTo="/matches"
          />
        ) : (
          <>
            <div className="grid gap-3 mb-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="stadium-panel rounded-2xl p-4">
                <div className="text-xs uppercase tracking-wide text-gray-400">Lider</div>
                <div className="mt-1 truncate text-2xl font-black">{leader.username}</div>
              </div>

              <div className="stadium-panel rounded-2xl p-4">
                <div className="text-xs uppercase tracking-wide text-gray-400">Graczy</div>
                <div className="mt-1 text-2xl font-black text-blue-300">{totalPlayers}</div>
              </div>

              <div className="stadium-panel rounded-2xl p-4">
                <div className="text-xs uppercase tracking-wide text-gray-400">Średnia</div>
                <div className="mt-1 text-2xl font-black text-yellow-300">
                  {isBeerMode ? getBeerCountLabel(averageValue) : averageValue}
                </div>
              </div>

              <div className="stadium-panel rounded-2xl p-4">
                <div className="text-xs uppercase tracking-wide text-gray-400">Twoje miejsce</div>
                <div className="mt-1 text-2xl font-black text-green-300">
                  {currentUserRank ? `#${currentUserRank.position}` : "-"}
                </div>
              </div>
            </div>

            <div className="space-y-3">

              {ranking.map((user) => {

                const isCurrentUser = user.username === currentUser
                const value = Number(user[valueKey] ?? 0)
                const diff = leaderValue - value

                return (
                  <button
                    type="button"
                    key={user.user_id}
                    onClick={() => openHistory(user)}
                    className={`match-ticket w-full rounded-2xl p-4 text-left transition-all duration-300 sm:p-5
                      ${isCurrentUser
                        ? "border-green-400 bg-green-600/20 shadow-lg"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                  >

                    <div className="flex items-center justify-between gap-4">

                      <div className="flex min-w-0 items-center gap-4">

                        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-lg font-black ${
                          user.position <= 3 ? "bg-yellow-400 text-black" : "bg-white/10 text-gray-200"
                        }`}>
                          {getMedal(user.position)}
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-lg font-bold tracking-wide">
                            {user.username}
                            {isCurrentUser && (
                              <span className="ml-2 text-sm text-green-400">
                                Ty
                              </span>
                            )}
                          </div>

                          {!isCurrentUser && diff > 0 && (
                            <div className="mt-1 text-xs text-gray-400">
                              {formatValue(diff)} do lidera
                            </div>
                          )}
                        </div>

                      </div>

                      <div className="flex-shrink-0 text-right">
                        <div className="text-3xl font-black text-yellow-400">
                          {value}
                        </div>
                        <div className="text-xs uppercase tracking-wide text-gray-500">
                          {isBeerMode ? "piwka" : "pkt"}
                        </div>
                      </div>

                    </div>

                  </button>
                )
              })}

            </div>
          </>
        )}

      </div>

      {historyModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 px-4 pb-4 pt-10 backdrop-blur-sm sm:items-center sm:p-6">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#111827] p-5 shadow-2xl sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
                  Historia gracza
                </div>
                <h2 className="mt-1 truncate text-2xl font-black">
                  {historyModal.username}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setHistoryModal(null)}
                className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-gray-200 transition hover:bg-white/15"
              >
                Zamknij
              </button>
            </div>

            {historyLoading ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center font-semibold text-gray-300">
                Ładuję historię...
              </div>
            ) : historyModal.predictions.length === 0 ? (
              <EmptyState
                compact
                icon="predictions"
                title="Brak widocznej historii"
                description="Typy gracza będą widoczne po starcie obstawionych meczów."
              />
            ) : (
              <>
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Punkty</div>
                    <div className="mt-1 text-2xl font-black text-yellow-300">{historyModal.points}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Piwka</div>
                    <div className="mt-1 text-2xl font-black text-green-300">
                      {getBeerCountLabel(historyModal.beers)}
                    </div>
                  </div>
                </div>

                <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                  {historyModal.predictions.map(prediction => {
                    const hasFinalScore = prediction.is_finished
                      && prediction.final_home_score != null
                      && prediction.final_away_score != null

                    return (
                      <div
                        key={`${prediction.match_id}-${prediction.start_time}`}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                      >
                        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                          <span>
                            {new Date(prediction.start_time).toLocaleString("pl-PL", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {prediction.points != null && (
                            <span className="rounded-full bg-yellow-500/15 px-2 py-1 text-yellow-300">
                              +{prediction.points} pkt
                            </span>
                          )}
                        </div>

                        <div className="font-black text-white">
                          {prediction.home_team}
                          <span className="mx-2 text-gray-500">vs</span>
                          {prediction.away_team}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
                          <span className="rounded-full border border-yellow-400/25 bg-yellow-500/15 px-2.5 py-1 text-yellow-300">
                            Typ: {prediction.prediction_home}:{prediction.prediction_away}
                          </span>
                          {hasFinalScore && (
                            <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-gray-200">
                              Wynik: {prediction.final_home_score}:{prediction.final_away_score}
                            </span>
                          )}
                          {Number(prediction.beers_count ?? 0) > 0 && (
                            <span className="rounded-full border border-green-400/25 bg-green-500/15 px-2.5 py-1 text-green-300">
                              {getBeerCountLabel(prediction.beers_count)}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
