import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { getToken } from "../auth"

export default function Matches() {

  const [matches, setMatches] = useState([])
  const [myPredictions, setMyPredictions] = useState([])
  const [loading, setLoading] = useState(true)

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

      const [matchesRes, predictionsRes] = await Promise.all([
        fetch("https://ligabejow.onrender.com/matches", {
          headers: { Authorization: `Bearer ${getToken()}` }
        }),
        fetch("https://ligabejow.onrender.com/my-predictions", {
          headers: { Authorization: `Bearer ${getToken()}` }
        })
      ])

      const matchesData = await matchesRes.json()
      const predictionsData = await predictionsRes.json()

      setMatches(matchesData)
      setMyPredictions(Array.isArray(predictionsData) ? predictionsData : [])

    } catch {
      toast.error("Failed to load data")
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
      const response = await fetch(
        `https://ligabejow.onrender.com/matches/${match.id}/predictions`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        }
      )

      if (!response.ok) {
        toast.error("Typy nie są jeszcze dostępne")
        return
      }

      const data = await response.json()
      setMatchPredictions(data)
      setPredictionsModal(match)

    } catch {
      toast.error("Server error")
    }
  }

  const submitPrediction = async () => {

    if (homeScore === "" || awayScore === "") {
      toast.error("Wprowadź wynik meczu")
      return
    }

    const existing = myPredictions.find(
      p => p.match_id === selectedMatch.id
    )

    try {

      if (!existing) {

        const response = await fetch("https://ligabejow.onrender.com/predictions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getToken()}`
          },
          body: JSON.stringify({
            match_id: selectedMatch.id,
            home_score: Number(homeScore),
            away_score: Number(awayScore)
          })
        })

        const data = await response.json()

        if (!response.ok) {
          toast.error(data.detail || "Prediction failed")
          return
        }

        toast.success("Twój typ został zapisany 🚀")

      } else {

        const response = await fetch(
          `https://ligabejow.onrender.com/predictions/${existing.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${getToken()}`
            },
            body: JSON.stringify({
              home_score: Number(homeScore),
              away_score: Number(awayScore)
            })
          }
        )

        const data = await response.json()

        if (!response.ok) {
          toast.error(data.detail || "Update failed")
          return
        }

        toast.success("Twój typ został zaktualizowany 🔄")
      }

      setSelectedMatch(null)
      fetchData()

    } catch {
      toast.error("Server error")
    }
  }

  if (loading) {
    return <div className="p-6 text-white">Loading...</div>
  }

  return (
    <div className="relative min-h-screen bg-[#0b0f1a] text-white px-6 py-10">

      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black 
                         bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 
                         bg-clip-text text-transparent">
            Mecze
          </h1>
          <div className="h-1 w-32 mx-auto mt-3 
                          bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 
                          rounded-full">
          </div>
        </div>

        {/* MATCHES */}
        <div className="grid gap-6">

          {matches.map(match => {

            const isStarted = new Date(match.start_time) <= new Date()
            const myPrediction = myPredictions.find(p => p.match_id === match.id)

            return (
              <div
                key={match.id}
                className="bg-white/5 backdrop-blur-lg 
                           border border-white/10 
                           p-6 rounded-2xl 
                           flex justify-between items-center 
                           hover:bg-white/10 transition duration-300"
              >
                <div>
                  <div className="text-lg font-bold tracking-wide">
                    {match.home_team}
                    <span className="mx-2 text-gray-400">vs</span>
                    {match.away_team}
                  </div>

                  <div className="text-sm text-gray-400 mt-1">
                    {new Date(match.start_time).toLocaleString("pl-PL")}
                  </div>

                  {myPrediction && (
                    <div className="text-sm text-yellow-400 mt-2 font-semibold">
                      Twój typ: {myPrediction.prediction_home}:{myPrediction.prediction_away}
                    </div>
                  )}
                </div>

                <div>
                  {!isStarted ? (
                    <button
                      onClick={() => openModal(match)}
                      className="px-5 py-2 rounded-full font-bold uppercase text-sm
                                 bg-gradient-to-r from-red-600 to-red-700
                                 hover:from-red-700 hover:to-red-800
                                 transition shadow-lg"
                    >
                      {myPrediction ? "Edytuj" : "Typuj"}
                    </button>
                  ) : (
                    <button
                      onClick={() => fetchMatchPredictions(match)}
                      className="px-5 py-2 rounded-full font-bold uppercase text-sm
                                 bg-gradient-to-r from-purple-600 to-purple-700
                                 hover:from-purple-700 hover:to-purple-800
                                 transition shadow-lg"
                    >
                      Zobacz typy
                    </button>
                  )}
                </div>

              </div>
            )
          })}

        </div>
      </div>

      {/* ===== MODAL TYP ===== */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">

          <div className="bg-[#111827] border border-white/10 
                          p-8 rounded-3xl w-96 shadow-2xl text-center">

            <h2 className="text-2xl font-bold mb-6">
              {selectedMatch.home_team} vs {selectedMatch.away_team}
            </h2>

            <div className="flex justify-center items-center gap-6 mb-6">

              <input
                type="number"
                min="0"
                max="20"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                className="w-20 p-3 rounded-xl bg-white/10 text-white text-center
                           border border-white/20 focus:border-red-500 outline-none"
              />

              <span className="text-2xl font-bold">:</span>

              <input
                type="number"
                min="0"
                max="20"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                className="w-20 p-3 rounded-xl bg-white/10 text-white text-center
                           border border-white/20 focus:border-red-500 outline-none"
              />

            </div>

            <div className="flex justify-between">

              <button
                onClick={() => setSelectedMatch(null)}
                className="px-5 py-2 bg-gray-600 rounded-full hover:bg-gray-700 transition"
              >
                Anuluj
              </button>

              <button
                onClick={submitPrediction}
                className="px-5 py-2 rounded-full font-bold
                           bg-gradient-to-r from-red-600 to-red-700
                           hover:from-red-700 hover:to-red-800 transition"
              >
                Zapisz
              </button>

            </div>

          </div>
        </div>
      )}

      {/* ===== MODAL TYPOW ===== */}
      {predictionsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">

          <div className="bg-[#111827] border border-white/10 
                          p-8 rounded-3xl w-96 shadow-2xl">

            <h2 className="text-2xl font-bold mb-6 text-center">
              Typy użytkowników
            </h2>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {matchPredictions.map((p, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center 
                             border-b border-white/10 pb-2"
                >
                  <div className="font-semibold">{p.username}</div>
                  <div>{p.prediction}</div>
                  {p.points !== null && (
                    <div className="text-yellow-400 font-bold">
                      {p.points}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setPredictionsModal(null)}
                className="px-6 py-2 bg-gray-600 rounded-full hover:bg-gray-700 transition"
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