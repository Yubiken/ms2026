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

  const getPodiumClass = (position) => {
    if (position === 1) return "border-yellow-400 bg-yellow-400/10"
    if (position === 2) return "border-slate-300 bg-slate-300/10"
    return "border-orange-400 bg-orange-400/10"
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

            <div className="grid gap-4 mb-10 md:grid-cols-3">

              {ranking.slice(0, 3).map((user) => (
                <div
                  key={user.user_id}
                  className={`rounded-2xl border p-5 text-center shadow-xl ${getPodiumClass(user.position)}`}
                >
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-xl font-black">
                    {getMedal(user.position)}
                  </div>
                  <div className="truncate text-xl font-bold">
                    {user.username}
                  </div>
                  <div className="mt-3 text-3xl font-black text-yellow-400">
                    {Number(user[valueKey] ?? 0)}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-wide text-gray-400">
                    {isBeerMode ? "piwka" : "punktów"}
                  </div>
                </div>
              ))}

            </div>

            <div className="space-y-3">

              {ranking.map((user) => {

                const isCurrentUser = user.username === currentUser
                const value = Number(user[valueKey] ?? 0)
                const diff = leaderValue - value

                return (
                  <div
                    key={user.user_id}
                    className={`match-ticket rounded-2xl p-4 transition-all duration-300 sm:p-5
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
