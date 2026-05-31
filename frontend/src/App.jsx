import { Routes, Route, Navigate } from "react-router-dom"
import { useState, useEffect, useCallback } from "react"

import Login from "./pages/Login"
import Register from "./pages/Register"
import Matches from "./pages/Matches"
import MyPredictions from "./pages/MyPredictions"
import Leaderboard from "./pages/Leaderboard"
import Admin from "./pages/Admin"
import { isAdminToken } from "./admin"
import { apiRequest } from "./api"

import Navbar from "./components/Navbar"

export default function App() {

  const [token, setToken] = useState(localStorage.getItem("token"))
  const [pendingPredictionsCount, setPendingPredictionsCount] = useState(0)

  const handleLogout = () => {
    localStorage.removeItem("token")
    setPendingPredictionsCount(0)
    setToken(null)
  }

  const refreshPendingPredictionsCount = useCallback(async () => {
    if (!token) {
      setPendingPredictionsCount(0)
      return
    }

    try {
      const [matchesData, predictionsData] = await Promise.all([
        apiRequest("/matches"),
        apiRequest("/my-predictions"),
      ])

      if (!Array.isArray(matchesData) || !Array.isArray(predictionsData)) {
        setPendingPredictionsCount(0)
        return
      }

      const predictedMatchIds = new Set(
        predictionsData.map(prediction => String(prediction.match_id))
      )
      const now = new Date()
      const count = matchesData.filter(match => {
        const matchStarted = new Date(match.start_time) <= now

        return !match.is_finished && !matchStarted && !predictedMatchIds.has(String(match.id))
      }).length

      setPendingPredictionsCount(count)
    } catch {
      setPendingPredictionsCount(0)
    }
  }, [token])

  const handlePredictionsChange = useCallback((pendingDelta = 0) => {
    if (pendingDelta !== 0) {
      setPendingPredictionsCount(currentCount => Math.max(0, currentCount + pendingDelta))
    }

    refreshPendingPredictionsCount()
  }, [refreshPendingPredictionsCount])

  // 🔐 synchronizacja tokena z localStorage
  useEffect(() => {

    const handleStorageChange = () => {
      const storedToken = localStorage.getItem("token")
      setToken(storedToken)
    }

    window.addEventListener("storage", handleStorageChange)

    return () => window.removeEventListener("storage", handleStorageChange)

  }, [])

  useEffect(() => {
    refreshPendingPredictionsCount()
  }, [refreshPendingPredictionsCount])

  return (
    <div className="app-shell text-white">

      <Navbar
        token={token}
        onLogout={handleLogout}
        pendingPredictionsCount={pendingPredictionsCount}
      />

      <main className={token ? "pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0" : ""}>
        <Routes>

        {/* PUBLIC */}
        <Route
          path="/login"
          element={
            token
              ? <Navigate to="/matches" />
              : <Login onLogin={(newToken) => setToken(newToken)} />
          }
        />

        <Route
          path="/register"
          element={token ? <Navigate to="/matches" /> : <Register />}
        />

        {/* PROTECTED */}
        <Route
          path="/matches"
          element={token ? <Matches onPredictionsChange={handlePredictionsChange} /> : <Navigate to="/login" />}
        />

        <Route
          path="/my-predictions"
          element={token ? <MyPredictions /> : <Navigate to="/login" />}
        />

        <Route
          path="/leaderboard"
          element={token ? <Leaderboard /> : <Navigate to="/login" />}
        />

        <Route
          path="/admin"
          element={token && isAdminToken(token) ? <Admin /> : <Navigate to={token ? "/matches" : "/login"} />}
        />

        {/* DEFAULT */}
        <Route
          path="*"
          element={<Navigate to={token ? "/matches" : "/login"} />}
        />

        </Routes>
      </main>

    </div>
  )
}
