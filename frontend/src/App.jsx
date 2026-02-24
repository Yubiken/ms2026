import { Routes, Route, Link, Navigate, useNavigate } from "react-router-dom"

import Login from "./pages/Login"
import Register from "./pages/Register"
import Matches from "./pages/Matches"

// utworzymy za chwilę
import MyPredictions from "./pages/MyPredictions"
import Leaderboard from "./pages/Leaderboard"

export default function App() {

  const token = localStorage.getItem("token")
  const navigate = useNavigate()

  const logout = () => {
    localStorage.removeItem("token")
    navigate("/login")
  }

  return (
    <div>

      {/* MENU */}
      <nav className="bg-gray-800 text-white p-4 flex gap-4 items-center">

        {!token && (
          <>
            <Link to="/login">Logowanie</Link>
            <Link to="/register">Rejestracja</Link>
          </>
        )}

        {token && (
          <>
            <Link to="/matches">Mecze</Link>

            <Link to="/my-predictions">
              Moje Typy
            </Link>

            <Link to="/leaderboard">
              Ranking
            </Link>

            <button
              onClick={logout}
              className="ml-auto bg-red-600 px-3 py-1 rounded hover:bg-red-700"
            >
              Wyloguj
            </button>
          </>
        )}

      </nav>


      {/* ROUTES */}
      <Routes>

        {/* PUBLIC */}
        <Route
          path="/login"
          element={token ? <Navigate to="/matches" /> : <Login />}
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