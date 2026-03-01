import { Routes, Route, Navigate } from "react-router-dom"
import { useState } from "react"

import Login from "./pages/Login"
import Register from "./pages/Register"
import Matches from "./pages/Matches"
import MyPredictions from "./pages/MyPredictions"
import Leaderboard from "./pages/Leaderboard"

import Navbar from "./components/Navbar"

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"))

  const handleLogout = () => {
    localStorage.removeItem("token")
    setToken(null)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar token={token} onLogout={handleLogout} />

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
          element={token ? <Matches /> : <Navigate to="/login" />}
        />
        <Route
          path="/my-predictions"
          element={token ? <MyPredictions /> : <Navigate to="/login" />}
        />
        <Route
          path="/leaderboard"
          element={token ? <Leaderboard /> : <Navigate to="/login" />}
        />

        

        {/* DEFAULT */}
        <Route
          path="*"
          element={<Navigate to={token ? "/matches" : "/login"} />}
        />
      </Routes>
    </div>
  )
}