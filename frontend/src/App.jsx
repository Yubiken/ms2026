import { Routes, Route, Link } from "react-router-dom"

import Login from "./pages/Login"
import Register from "./pages/Register"
import Matches from "./pages/Matches"
import MyPredictions from "./pages/MyPredictions"
import Leaderboard from "./pages/Leaderboard"

export default function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">

      {/* NAVBAR */}
      <nav className="bg-gray-800 p-4 flex gap-4">
        <Link to="/">Mecze</Link>
        <Link to="/my-predictions">Moje typy</Link>
        <Link to="/leaderboard">Ranking</Link>
        <Link to="/login">Login</Link>
        <Link to="/register">Rejestracja</Link>
      </nav>

      {/* ROUTES */}
      <div className="p-6">
        <Routes>
          <Route path="/" element={<Matches />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/my-predictions" element={<MyPredictions />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </div>

    </div>
  )
}