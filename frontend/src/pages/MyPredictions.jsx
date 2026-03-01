import { useEffect, useState } from "react"
import { getToken } from "../auth"

export default function MyPredictions() {

  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("http://127.0.0.1:8000/my-predictions", {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setPredictions(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="p-8 text-white">Loading...</div>
  }

  // 🔥 SUMA PUNKTÓW
  const totalPoints = predictions?.reduce((sum, p) => {
    return sum + Number(p.points ?? 0)
  }, 0) ?? 0

  const getPointsColor = (points) => {
    if (points === 2) return "text-green-400"
    if (points === 1) return "text-yellow-400"
    return "text-red-400"
  }

  const getMatchStatus = (match) => {
    const now = new Date()
    const start = new Date(match.start_time)

    if (match.is_finished) return "Finished"
    if (start <= now) return "Live"
    return "Upcoming"
  }

  return (
    <div className="p-8 text-white">

      <div className="flex justify-between items-center mb-8">

        <h1 className="text-3xl font-bold">
          🎯 My Predictions
        </h1>

        <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-3 rounded-xl shadow-lg text-xl font-bold">
          {totalPoints} pts
        </div>

      </div>

      <div className="space-y-4">

        {predictions.map(p => {

          const status = getMatchStatus(p)

          return (
            <div
              key={p.id}
              className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex justify-between items-center"
            >

              {/* LEFT */}
              <div>

                <div className="text-lg font-semibold">
                  {p.home_team} vs {p.away_team}
                </div>

                <div className="text-sm text-gray-400 mt-1">
                  Kickoff: {new Date(p.start_time).toLocaleString("pl-PL")}
                </div>

                <div className="mt-2">
                  Your prediction:
                  <span className="font-bold ml-1">
                    {p.prediction_home}:{p.prediction_away}
                  </span>
                </div>

                {p.is_finished && (
                  <div className="text-sm mt-1 text-gray-400">
                    Final score: {p.final_home_score}:{p.final_away_score}
                  </div>
                )}

              </div>

              {/* RIGHT */}
              <div className="text-right">

                <div className="text-sm text-gray-400 mb-2">
                  {status}
                </div>

                {p.is_finished ? (
                  <div className={`text-2xl font-bold ${getPointsColor(p.points)}`}>
                    {p.points} pts
                  </div>
                ) : (
                  <div className="text-gray-500">
                    —
                  </div>
                )}

              </div>

            </div>
          )
        })}

      </div>

    </div>
  )
}