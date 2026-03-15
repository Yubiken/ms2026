import { useEffect, useState } from "react"
import { getUsername } from "../auth"
import { apiRequest } from "../api"

export default function Leaderboard() {

  const [ranking, setRanking] = useState([])
  const currentUser = getUsername()

  useEffect(() => {

    apiRequest("/leaderboard")
      .then(data => {

        if (!data) return

        // SORTOWANIE PO PUNKTACH
        const sorted = [...data].sort((a, b) => b.points - a.points)

        // NADANIE POZYCJI W RANKINGU
        const withPosition = sorted.map((user, index) => ({
          ...user,
          position: index + 1
        }))

        setRanking(withPosition)
      })

  }, [])

  if (ranking.length === 0) {
    return <div className="p-8 text-white">Loading...</div>
  }

  const leaderPoints = ranking[0].points

  const getMedal = (position) => {
    if (position === 1) return "🥇"
    if (position === 2) return "🥈"
    if (position === 3) return "🥉"
    return `#${position}`
  }

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white px-6 py-12">

      <div className="max-w-5xl mx-auto">

        {/* HEADER */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-black 
                         bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 
                         bg-clip-text text-transparent">
            🏆 Ranking Ligi
          </h1>
          <div className="h-1 w-40 mx-auto mt-4 
                          bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 
                          rounded-full">
          </div>
        </div>

        {/* PODIUM TOP 3 */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">

          {ranking.slice(0, 3).map((user) => (
            <div
              key={user.user_id}
              className={`text-center p-6 rounded-2xl shadow-xl border
                ${user.position === 1
                  ? "bg-gradient-to-b from-yellow-400/20 to-yellow-600/10 border-yellow-400"
                  : user.position === 2
                  ? "bg-gradient-to-b from-gray-400/20 to-gray-600/10 border-gray-400"
                  : "bg-gradient-to-b from-orange-400/20 to-orange-600/10 border-orange-400"
                }`}
            >
              <div className="text-4xl mb-3">
                {getMedal(user.position)}
              </div>
              <div className="text-xl font-bold">
                {user.username}
              </div>
              <div className="text-3xl font-black mt-3 text-yellow-400">
                {user.points}
              </div>
            </div>
          ))}

        </div>

        {/* FULL RANKING */}
        <div className="space-y-4">

          {ranking.map((user) => {

            const isCurrentUser = user.username === currentUser
            const diff = leaderPoints - user.points

            return (
              <div
                key={user.user_id}
                className={`p-6 rounded-2xl border flex justify-between items-center
                  backdrop-blur-lg transition-all duration-300
                  ${isCurrentUser
                    ? "bg-gradient-to-r from-green-600/30 to-green-500/20 border-green-400 scale-105 shadow-lg"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
              >

                <div className="flex items-center gap-5">

                  <div className="text-2xl w-12 font-bold text-center">
                    {getMedal(user.position)}
                  </div>

                  <div>
                    <div className="font-bold text-lg tracking-wide">
                      {user.username}
                      {isCurrentUser && (
                        <span className="ml-2 text-green-400 text-sm">
                          (Ty)
                        </span>
                      )}
                    </div>

                    {!isCurrentUser && diff > 0 && (
                      <div className="text-xs text-gray-400 mt-1">
                        {diff} pkt do lidera
                      </div>
                    )}
                  </div>

                </div>

                <div className="text-3xl font-black text-yellow-400">
                  {user.points}
                </div>

              </div>
            )
          })}

        </div>

      </div>

    </div>
  )
}