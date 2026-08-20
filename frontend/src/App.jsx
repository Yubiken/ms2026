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
import MyLeagues from "./pages/MyLeagues"
import { isAdminToken } from "./admin"
import { apiRequest } from "./api"
import { useMyLeagues } from "./hooks/useMyLeagues"

import Navbar from "./components/Navbar"
import PageLoader from "./components/PageLoader"

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"))
  const [pendingPredictionsCount, setPendingPredictionsCount] = useState(0)
  const isAdmin = isAdminToken(token)
  const {
    participations,
    selectedCompetition,
    selectedCompetitionId,
    loading: leaguesLoading,
    refreshLeagues,
    joinLeague,
    setSelectedCompetitionId,
    resetLeagues,
  } = useMyLeagues(token)
  const competitionQuery = selectedCompetitionId ? `?competition_id=${selectedCompetitionId}` : ""

  const handleLogout = useCallback(() => {
    setPendingPredictionsCount(0)
    resetLeagues()
    localStorage.removeItem("token")
    setToken(null)
  }, [resetLeagues])

  const refreshPendingPredictionsCount = useCallback(async () => {
    if (!token) {
      setPendingPredictionsCount(0)
      return
    }

    if (!isAdmin && (leaguesLoading || !selectedCompetitionId)) {
      setPendingPredictionsCount(0)
      return
    }

    try {
      const [matchesData, predictionsData] = await Promise.all([
        apiRequest(`/matches${competitionQuery}`),
        apiRequest(`/my-predictions${competitionQuery}`),
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
  }, [competitionQuery, isAdmin, leaguesLoading, selectedCompetitionId, token])

  const handlePredictionsChange = useCallback((pendingDelta = 0) => {
    if (pendingDelta !== 0) {
      setPendingPredictionsCount(currentCount => Math.max(0, currentCount + pendingDelta))
    }

    refreshPendingPredictionsCount()
  }, [refreshPendingPredictionsCount])

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

  const requiresLeagueSelection = Boolean(token && !isAdmin && !selectedCompetitionId)

  const renderProtectedRoute = (element) => {
    if (!token) return <Navigate to="/login" />

    if (!isAdmin && leaguesLoading) {
      return <PageLoader title="Liga" subtitle="Sprawdzam dostęp do ligi" cards={2} />
    }

    if (requiresLeagueSelection) {
      return <Navigate to="/my-leagues" />
    }

    return element
  }

  return (
    <div className="app-shell text-white">
      <Navbar
        token={token}
        onLogout={handleLogout}
        pendingPredictionsCount={pendingPredictionsCount}
        currentTournament={selectedCompetition}
      />

      <main className={token ? "pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0" : ""}>
        <Routes>
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

          <Route
            path="/dashboard"
            element={renderProtectedRoute(<Dashboard selectedCompetitionId={selectedCompetitionId} />)}
          />

          <Route
            path="/my-leagues"
            element={
              token
                ? (
                  <MyLeagues
                    participations={participations}
                    selectedCompetitionId={selectedCompetitionId}
                    loading={leaguesLoading}
                    onSelectCompetition={(competitionId) => {
                      setSelectedCompetitionId(competitionId)
                      refreshPendingPredictionsCount()
                    }}
                    onJoinLeague={async (joinCode) => {
                      const data = await joinLeague(joinCode)
                      refreshPendingPredictionsCount()
                      return data
                    }}
                  />
                )
                : <Navigate to="/login" />
            }
          />

          <Route
            path="/matches"
            element={renderProtectedRoute(
              <Matches
                selectedCompetitionId={selectedCompetitionId}
                onPredictionsChange={handlePredictionsChange}
              />
            )}
          />

          <Route
            path="/leaderboard"
            element={renderProtectedRoute(<Leaderboard selectedCompetitionId={selectedCompetitionId} />)}
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
            element={token && isAdmin ? <Admin onTournamentChange={refreshLeagues} /> : <Navigate to={token ? "/dashboard" : "/login"} />}
          />

          <Route
            path="*"
            element={<Navigate to={token ? "/dashboard" : "/login"} />}
          />
        </Routes>
      </main>
    </div>
  )
}
