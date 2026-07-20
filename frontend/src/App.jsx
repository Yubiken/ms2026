import { Routes, Route, Navigate } from "react-router-dom"
import { useState, useEffect, useCallback } from "react"

import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import Matches from "./pages/Matches"
import Leaderboard from "./pages/Leaderboard"
import Champion from "./pages/Champion"
import Admin from "./pages/Admin"
import Profile from "./pages/Profile"
import { isAdminToken } from "./admin"
import { apiRequest } from "./api"

import Navbar from "./components/Navbar"
import PageLoader from "./components/PageLoader"

export default function App() {

  const [token, setToken] = useState(localStorage.getItem("token"))
  const [pendingPredictionsCount, setPendingPredictionsCount] = useState(0)
  const [activeParticipation, setActiveParticipation] = useState(null)
  const [participationLoading, setParticipationLoading] = useState(false)
  const isAdmin = isAdminToken(token)

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token")
    setPendingPredictionsCount(0)
    setActiveParticipation(null)
    setToken(null)
  }, [])

  const refreshActiveParticipation = useCallback(async () => {
    if (!token || isAdmin) {
      setActiveParticipation(null)
      setParticipationLoading(false)
      return
    }

    setParticipationLoading(true)

    try {
      const data = await apiRequest("/competition-participation/active")
      setActiveParticipation(data)
    } catch {
      setActiveParticipation(null)
    } finally {
      setParticipationLoading(false)
    }
  }, [isAdmin, token])

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
      const participationData = await apiRequest("/competition-participation/active")

      if (participationData && participationData.is_participant === false) {
        setPendingPredictionsCount(0)
        return
      }

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
      if (!storedToken) {
        setPendingPredictionsCount(0)
      }
      setToken(storedToken)
    }

    window.addEventListener("storage", handleStorageChange)

    return () => window.removeEventListener("storage", handleStorageChange)

  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      refreshPendingPredictionsCount()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [refreshPendingPredictionsCount])

  useEffect(() => {
    refreshActiveParticipation()
  }, [refreshActiveParticipation])

  const requiresLeagueCode = Boolean(
    token
    && !isAdmin
    && activeParticipation?.competition
    && activeParticipation.is_participant === false
  )

  const renderProtectedRoute = (element) => {
    if (!token) return <Navigate to="/login" />

    if (!isAdmin && participationLoading) {
      return <PageLoader title="Liga" subtitle="Sprawdzam dostÄ™p do turnieju" cards={2} />
    }

    if (requiresLeagueCode) {
      return <Navigate to="/dashboard" />
    }

    return element
  }

  const handleCompetitionJoined = (participationData) => {
    setActiveParticipation(participationData)
    refreshPendingPredictionsCount()
  }

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
              ? <Navigate to="/dashboard" />
              : <Login onLogin={(newToken) => setToken(newToken)} />
          }
        />

        <Route
          path="/register"
          element={token ? <Navigate to="/dashboard" /> : <Register />}
        />

        {/* PROTECTED */}
        <Route
          path="/dashboard"
          element={
            token
              ? <Dashboard isAdmin={isAdmin} onCompetitionJoined={handleCompetitionJoined} />
              : <Navigate to="/login" />
          }
        />

        <Route
          path="/matches"
          element={renderProtectedRoute(<Matches onPredictionsChange={handlePredictionsChange} />)}
        />

        <Route
          path="/leaderboard"
          element={renderProtectedRoute(<Leaderboard />)}
        />

        <Route
          path="/champion"
          element={renderProtectedRoute(<Champion />)}
        />

        <Route
          path="/profile"
          element={renderProtectedRoute(<Profile onProfileUpdate={(newToken) => setToken(newToken)} />)}
        />

        <Route
          path="/admin"
          element={token && isAdmin ? <Admin /> : <Navigate to={token ? "/dashboard" : "/login"} />}
        />

        {/* DEFAULT */}
        <Route
          path="*"
          element={<Navigate to={token ? "/dashboard" : "/login"} />}
        />

        </Routes>
      </main>

    </div>
  )
}
