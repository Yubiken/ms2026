import { useEffect, useState } from "react"
import { getToken, getUsername } from "../auth"

export default function Leaderboard() {

  const [ranking, setRanking] = useState([])
  const currentUser = getUsername()

  useEffect(() => {
    fetch("http://127.0.0.1:8000/leaderboard", {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    })
      .then(res => res.json())
      .then(data => setRanking(data))
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
    <div className="p-8 text-white">

      <h1 className="text-3xl font-bold mb-8 text-center">
        🏆 Leaderboard
      </h1>

      <div className="space-y-4">

        {ranking.map((user) => {

          const isCurrentUser = user.username === currentUser
          const diff = leaderPoints - user.points

          return (
            <div
              key={user.user_id}
              className={`p-5 rounded-xl border flex justify-between items-center transition-all
                ${isCurrentUser
                  ? "bg-gradient-to-r from-green-700 to-green-600 border-green-400 scale-105"
                  : "bg-gray-800 border-gray-700"
                }`}
            >

              {/* LEFT */}
              <div className="flex items-center gap-4">

                <div className="text-2xl w-10">
                  {getMedal(user.position)}
                </div>

                <div>
                  <div className="font-semibold text-lg">
                    {user.username}
                    {isCurrentUser}
                  </div>

                  {!isCurrentUser && diff > 0 && (
                    <div className="text-xs text-gray-400">
                      {diff} pts behind leader
                    </div>
                  )}
                </div>

              </div>

              {/* RIGHT */}
              <div className="text-2xl font-bold text-yellow-400">
                {user.points}
              </div>

            </div>
          )
        })}

      </div>

    </div>
  )
}