import { Link, useNavigate } from "react-router-dom"
import { jwtDecode } from "jwt-decode"

export default function Navbar({ token, onLogout }) {

  const navigate = useNavigate()

  let username = null

  if (token) {
    try {
      username = jwtDecode(token).sub
    } catch {
      username = null
    }
  }

  const handleLogout = () => {
    onLogout()
    navigate("/login")
  }

  return (

    <nav className="bg-gray-800 text-white px-6 py-3 flex items-center gap-4">

      <div className="font-bold text-lg">
        MS 2026 Predictor
      </div>

      {/* 🔓 BEFORE LOGIN */}
      {!token && (
        <>
          <Link className="hover:text-green-400" to="/login">
            Login
          </Link>

          <Link className="hover:text-green-400" to="/register">
            Register
          </Link>
        </>
      )}

      {/* 🔐 AFTER LOGIN */}
      {token && (
        <>
          <Link className="hover:text-green-400" to="/matches">
            Matches
          </Link>

          <Link className="hover:text-green-400" to="/my-predictions">
            My Predictions
          </Link>

          <Link className="hover:text-green-400" to="/leaderboard">
            Leaderboard
          </Link>

          <div className="ml-auto flex items-center gap-4">
            <span className="text-green-400">
              👤 {username}
            </span>

            <button
              onClick={handleLogout}
              className="bg-red-600 px-3 py-1 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </>
      )}

    </nav>

  )
}