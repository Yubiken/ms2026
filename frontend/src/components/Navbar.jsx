import { Link, useNavigate } from "react-router-dom"
import { jwtDecode } from "jwt-decode"
import { useState } from "react"
import { isAdminToken } from "../admin"

export default function Navbar({ token, onLogout }) {

  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isAdmin = isAdminToken(token)

  let username = null

  if (token) {
    try {

      const decoded = jwtDecode(token)

      const now = Date.now() / 1000

      // TOKEN WYGASŁ
      if (decoded.exp && decoded.exp < now) {

        localStorage.removeItem("token")
        onLogout()
        navigate("/login")

      } else {

        username = decoded.sub

      }

    } catch {
      username = null
    }
  }

  const handleLogout = () => {
    onLogout()
    navigate("/login")
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#070b12]/85 text-white shadow-xl backdrop-blur-xl">

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4">

        <div className="flex items-center justify-between gap-4">

          <Link
            to="/matches"
            className="min-w-0 text-lg sm:text-2xl font-black tracking-wide"
          >
            <span className="block truncate bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400 bg-clip-text text-transparent">
              ⚽ Liga Typerów 2026
            </span>
          </Link>

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

              {isAdmin && (
                <Link to="/admin" className="hover:text-red-500 transition">
                  Admin
                </Link>
              )}

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

          {token && (
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex-shrink-0 text-2xl"
            >
              ☰
            </button>
          )}

        </div>

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

            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className="hover:text-red-500"
              >
                Admin
              </Link>
            )}

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
