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

  // 🔥 nowy modal
  const [predictionsModal, setPredictionsModal] = useState(null)
  const [matchPredictions, setMatchPredictions] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {

      const [matchesRes, predictionsRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/matches", {
          headers: { Authorization: `Bearer ${getToken()}` }
        }),
        fetch("http://127.0.0.1:8000/my-predictions", {
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
        `http://127.0.0.1:8000/matches/${match.id}/predictions`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        }
      )

      if (!response.ok) {
        toast.error("Predictions not available yet")
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
      toast.error("Enter score")
      return
    }

    const existing = myPredictions.find(
      p => p.match_id === selectedMatch.id
    )

    try {

      if (!existing) {

        const response = await fetch("http://127.0.0.1:8000/predictions", {
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

        toast.success("Prediction saved 🚀")

      } else {

        const response = await fetch(
          `http://127.0.0.1:8000/predictions/${existing.id}`,
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

        toast.success("Prediction updated 🔄")
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
    <div className="p-8">

      <h1 className="text-2xl font-bold mb-6">Matches</h1>

      <div className="grid gap-4">

        {matches.map(match => {

          const isStarted = new Date(match.start_time) <= new Date()
          const myPrediction = myPredictions.find(p => p.match_id === match.id)

          return (
            <div
              key={match.id}
              className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex justify-between items-center"
            >
              <div>
                <div className="font-semibold">
                  {match.home_team} vs {match.away_team}
                </div>

                <div className="text-sm text-gray-400">
                  {new Date(match.start_time).toLocaleString("pl-PL")}
                </div>

                {myPrediction && (
                  <div className="text-sm text-green-400 mt-1">
                    Your prediction: {myPrediction.prediction_home}:{myPrediction.prediction_away}
                  </div>
                )}
              </div>

              <div>

                {!isStarted ? (
                  <button
                    onClick={() => openModal(match)}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
                  >
                    {myPrediction ? "Edit" : "Predict"}
                  </button>
                ) : (
                  <button
                    onClick={() => fetchMatchPredictions(match)}
                    className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
                  >
                    View Predictions
                  </button>
                )}

              </div>
            </div>
          )
        })}

      </div>

      {/* PREDICT MODAL */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center">
          <div className="bg-gray-800 p-6 rounded-xl w-96 border border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-center">
              {selectedMatch.home_team} vs {selectedMatch.away_team}
            </h2>

            <div className="flex justify-between items-center mb-4">
              <input
                type="number"
                min="0"
                max="20"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                className="w-20 p-2 rounded bg-gray-700 text-white border border-gray-600 text-center"
              />
              <span className="text-xl">:</span>
              <input
                type="number"
                min="0"
                max="20"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                className="w-20 p-2 rounded bg-gray-700 text-white border border-gray-600 text-center"
              />
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setSelectedMatch(null)}
                className="px-4 py-2 bg-gray-600 rounded"
              >
                Cancel
              </button>
              <button
                onClick={submitPrediction}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW PREDICTIONS MODAL */}
      {predictionsModal && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center">
          <div className="bg-gray-800 p-6 rounded-xl w-96 border border-gray-700">

            <h2 className="text-xl font-bold mb-4 text-center">
              Predictions
            </h2>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {matchPredictions.map((p, index) => (
                <div
                  key={index}
                  className="flex justify-between border-b border-gray-600 pb-2"
                >
                  <div>{p.username}</div>
                  <div>{p.prediction}</div>
                  {p.points !== null && (
                    <div className="text-yellow-400 font-bold">
                      {p.points}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => setPredictionsModal(null)}
                className="px-4 py-2 bg-gray-600 rounded"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}