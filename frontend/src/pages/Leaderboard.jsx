import { useEffect, useState } from "react"
import { getUsername } from "../auth"
import { apiRequest } from "../api"
import EmptyState from "../components/EmptyState"
import PageLoader from "../components/PageLoader"

export default function Leaderboard() {

  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const currentUser = getUsername()

  useEffect(() => {

    apiRequest("/leaderboard")
      .then(data => {

        if (!data) return

        const sorted = [...data].sort((a, b) => b.points - a.points)
        const withPosition = sorted.map((user, index) => ({
          ...user,
          position: index + 1
        }))

        setRanking(withPosition)
        setLoading(false)
      })
      .catch(() => setLoading(false))

  }, [])

  if (loading) {
    return <PageLoader title="Ranking Ligi" subtitle="Przeliczam tabelę" cards={5} />
  }

  const leader = ranking[0]
  const leaderPoints = leader?.points ?? 0
  const totalPlayers = ranking.length
  const totalPoints = ranking.reduce((sum, user) => sum + Number(user.points ?? 0), 0)
  const averagePoints = totalPlayers > 0 ? (totalPoints / totalPlayers).toFixed(1) : "0.0"
  const currentUserRank = ranking.find(user => user.username === currentUser)

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

        <div className="text-center mb-10">
          <h1 className="section-title text-3xl font-black">
            Ranking Ligi
          </h1>
          <div className="h-1 w-40 mx-auto mt-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full" />
        </div>

        {ranking.length === 0 ? (
          <EmptyState
            icon="ranking"
            title="Ranking jest jeszcze pusty"
            description="Tabela zacznie żyć, gdy pojawią się pierwsze typy i rozliczone wyniki."
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
                <div className="mt-1 text-2xl font-black text-yellow-300">{averagePoints}</div>
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
                    {user.points}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-wide text-gray-400">
                    punktów
                  </div>
                </div>
              ))}

            </div>

            <div className="space-y-3">

              {ranking.map((user) => {

                const isCurrentUser = user.username === currentUser
                const diff = leaderPoints - user.points

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
                              {diff} pkt do lidera
                            </div>
                          )}
                        </div>

                      </div>

                      <div className="flex-shrink-0 text-right">
                        <div className="text-3xl font-black text-yellow-400">
                          {user.points}
                        </div>
                        <div className="text-xs uppercase tracking-wide text-gray-500">
                          pkt
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
