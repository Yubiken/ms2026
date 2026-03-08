import { Link, useNavigate } from "react-router-dom"
import { jwtDecode } from "jwt-decode"
import { useState } from "react"

export default function Navbar({ token, onLogout }) {

  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

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
    <nav className="bg-gradient-to-r from-[#0b0f1a] via-[#111827] to-[#0b0f1a] text-white border-b border-red-600/40 shadow-xl">

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4">

        {/* GŁÓWNY WIERSZ */}
        <div className="flex items-center justify-between">

          {/* LOGO */}
          <Link
            to="/matches"
            className="text-lg sm:text-2xl font-black tracking-wide"
          >
            <span className="bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400 bg-clip-text text-transparent">
              ⚽ Liga Bejów 2026
            </span>
          </Link>

          {/* DESKTOP MENU */}
          {token && (
            <div className="hidden md:flex items-center gap-8 text-sm uppercase tracking-widest font-semibold">

              <Link to="/matches" className="hover:text-red-500 transition">
                Mecze
              </Link>

              <Link to="/my-predictions" className="hover:text-red-500 transition">
                Moje Typy
              </Link>

              <Link to="/leaderboard" className="hover:text-red-500 transition">
                Ranking
              </Link>

              <span className="text-yellow-400 font-semibold">
                👤 {username}
              </span>

              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition px-4 py-2 rounded-full text-sm font-bold"
              >
                Wyloguj
              </button>

            </div>
          )}

          {/* MOBILE HAMBURGER */}
          {token && (
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-2xl"
            >
              ☰
            </button>
          )}

        </div>

        {/* MOBILE DROPDOWN */}
        {mobileOpen && token && (
          <div className="md:hidden mt-4 flex flex-col gap-4 text-sm uppercase tracking-widest font-semibold border-t border-white/10 pt-4">

            <Link
              to="/matches"
              onClick={() => setMobileOpen(false)}
              className="hover:text-red-500"
            >
              Mecze
            </Link>

            <Link
              to="/my-predictions"
              onClick={() => setMobileOpen(false)}
              className="hover:text-red-500"
            >
              Moje Typy
            </Link>

            <Link
              to="/leaderboard"
              onClick={() => setMobileOpen(false)}
              className="hover:text-red-500"
            >
              Ranking
            </Link>

            <div className="text-yellow-400">
              👤 {username}
            </div>

            <button
              onClick={handleLogout}
              className="bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 rounded-full font-bold"
            >
              Wyloguj
            </button>

          </div>
        )}

      </div>
    </nav>
  )
}