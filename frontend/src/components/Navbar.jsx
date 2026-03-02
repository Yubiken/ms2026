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
    <nav className="relative bg-gradient-to-r from-[#0b0f1a] via-[#111827] to-[#0b0f1a] text-white shadow-2xl border-b border-red-600/40">

      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center">

        {/* LEWA STRONA */}
        {token && (
          <div className="flex gap-8 text-sm uppercase tracking-widest font-semibold">
            <Link
              to="/matches"
              className="hover:text-red-500 transition duration-200"
            >
              Mecze
            </Link>

            <Link
              to="/my-predictions"
              className="hover:text-red-500 transition duration-200"
            >
              Moje Typy
            </Link>

            <Link
              to="/leaderboard"
              className="hover:text-red-500 transition duration-200"
            >
              Ranking
            </Link>
          </div>
        )}

        {/* CENTRALNE LOGO */}
        <div className="absolute left-1/2 -translate-x-1/2 text-center">
          <div className="text-xl md:text-3xl font-black tracking-wide">
            <span className="bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400 bg-clip-text text-transparent">
              Nałęczowska Liga Typerów
            </span>
          </div>
          <div className="h-1 w-32 mx-auto mt-2 bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400 rounded-full"></div>
        </div>

        {/* PRAWA STRONA */}
        {token && (
          <div className="ml-auto flex items-center gap-6">

            <span className="text-sm text-yellow-400 font-semibold tracking-wide">
              👤 {username}
            </span>

            <button
              onClick={handleLogout}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition px-5 py-2 rounded-full text-sm font-bold shadow-lg"
            >
              Wyloguj
            </button>

          </div>
        )}

      </div>
    </nav>
  )
}