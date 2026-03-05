import { useEffect, useState } from "react"
import { getToken } from "../auth"

export default function MyPredictions() {

  const API = import.meta.env.VITE_API_URL
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/my-predictions`, {
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

  const getStatusBadge = (status) => {
    if (status === "Live")
      return "bg-red-600 text-white animate-pulse"
    if (status === "Finished")
      return "bg-gray-600 text-white"
    return "bg-blue-600 text-white"
  }

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white px-6 py-10">

      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">

          <div>
            <h1 className="text-3xl font-black 
                           bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 
                           bg-clip-text text-transparent">
              Moje Typy
            </h1>
            <div className="h-1 w-50 mt-3 
                            bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 
                            rounded-full">
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 
                          text-black px-8 py-4 rounded-2xl shadow-xl 
                          text-2xl font-black tracking-wide">
            {totalPoints} pts
          </div>

        </div>

        {/* LISTA */}
        <div className="space-y-6">

          {predictions.map(p => {

            const status = getMatchStatus(p)

            return (
              <div
                key={p.id}
                className="bg-white/5 backdrop-blur-lg 
                           border border-white/10 
                           rounded-2xl p-6 
                           flex justify-between items-center
                           hover:bg-white/10 transition duration-300"
              >

                {/* LEFT */}
                <div>

                  <div className="text-lg font-bold tracking-wide">
                    {p.home_team}
                    <span className="mx-2 text-gray-400">vs</span>
                    {p.away_team}
                  </div>

                  <div className="text-sm text-gray-400 mt-1">
                    Kickoff: {new Date(p.start_time).toLocaleString("pl-PL")}
                  </div>

                  <div className="mt-3 text-sm">
                    Twój typ:
                    <span className="font-bold ml-2 text-yellow-400">
                      {p.prediction_home}:{p.prediction_away}
                    </span>
                  </div>

                  {p.is_finished && (
                    <div className="text-sm mt-2 text-gray-400">
                      Wynik końcowy: {p.final_home_score}:{p.final_away_score}
                    </div>
                  )}

                </div>

                {/* RIGHT */}
                <div className="text-right">

                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${getStatusBadge(status)}`}>
                    {status}
                  </div>

                  {p.is_finished ? (
                    <div className={`text-3xl font-black ${getPointsColor(p.points)}`}>
                      {p.points} pts
                    </div>
                  ) : (
                    <div className="text-gray-500 text-xl">
                      —
                    </div>
                  )}

                </div>

              </div>
            )
          })}

        </div>

      </div>

    </div>
  )
}