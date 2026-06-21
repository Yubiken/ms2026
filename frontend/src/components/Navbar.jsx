import { Link, NavLink, useNavigate } from "react-router-dom"
import { jwtDecode } from "jwt-decode"
import { useState } from "react"
import { isAdminToken } from "../admin"

function NavIcon({ type }) {
  const sharedProps = {
    width: "22",
    height: "22",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  }

  if (type === "predictions") {
    return (
      <svg {...sharedProps}>
        <path d="M12 3v18" />
        <path d="M7 8h10" />
        <path d="M7 16h10" />
        <path d="M5 5h14" />
        <path d="M5 19h14" />
      </svg>
    )
  }

  if (type === "dashboard") {
    return (
      <svg {...sharedProps}>
        <path d="M4 13h6V4H4v9Z" />
        <path d="M14 20h6v-9h-6v9Z" />
        <path d="M14 7h6V4h-6v3Z" />
        <path d="M4 20h6v-3H4v3Z" />
      </svg>
    )
  }

  if (type === "ranking") {
    return (
      <svg {...sharedProps}>
        <path d="M8 21h8" />
        <path d="M12 17v4" />
        <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
        <path d="M7 7H4a3 3 0 0 0 3 3" />
        <path d="M17 7h3a3 3 0 0 1-3 3" />
      </svg>
    )
  }

  if (type === "champion") {
    return (
      <svg {...sharedProps}>
        <path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.6 7.1 18.2l.9-5.5-4-3.9 5.5-.8L12 3Z" />
      </svg>
    )
  }

  if (type === "admin") {
    return (
      <svg {...sharedProps}>
        <path d="M12 3l7 3v5c0 4.5-2.8 8.6-7 10-4.2-1.4-7-5.5-7-10V6l7-3Z" />
        <path d="M9 12h6" />
        <path d="M12 9v6" />
      </svg>
    )
  }

  return (
    <svg {...sharedProps}>
      <path d="M7 3v4" />
      <path d="M17 3v4" />
      <path d="M4 9h16" />
      <path d="M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" />
      <path d="M8 13h3" />
      <path d="M13 16h3" />
    </svg>
  )
}

export default function Navbar({ token, onLogout, pendingPredictionsCount = 0 }) {

  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isAdmin = isAdminToken(token)

  let username = null

  if (token) {
    try {
      username = jwtDecode(token).sub
    } catch {
      username = null
    }
  }

  const mobileNavItems = [
    { to: "/dashboard", label: "Start", icon: "dashboard" },
    {
      to: "/matches",
      label: "Mecze",
      icon: "matches",
      badge: pendingPredictionsCount > 0
        ? pendingPredictionsCount > 9 ? "9+" : pendingPredictionsCount
        : null,
    },
    { to: "/my-predictions", label: "Moje typy", icon: "predictions" },
    { to: "/leaderboard", label: "Ranking", icon: "ranking" },
    ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: "admin" }] : []),
  ]

  const handleLogout = () => {
    setMobileOpen(false)
    onLogout()
    navigate("/login")
  }

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#070b12]/85 text-white shadow-xl backdrop-blur-xl">

        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-8">

          <div className="flex items-center justify-between gap-4">

            <Link
              to="/dashboard"
              className="min-w-0 text-lg font-black tracking-wide sm:text-2xl"
            >
              <span className="block truncate bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400 bg-clip-text text-transparent">
                Mistrzostwa Świata 2026
              </span>
            </Link>

            {token && (
              <div className="hidden items-center gap-8 text-sm font-semibold uppercase tracking-widest md:flex">

                {mobileNavItems.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `relative py-2 transition hover:text-white ${
                      isActive ? "text-green-300" : "text-gray-300"
                    }`}
                  >
                    {item.label === "Start" ? "Pulpit" : item.label}
                    {item.badge && (
                      <span className="absolute -right-4 -top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-green-400 px-1 text-[10px] font-black text-black">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}

                <span className="font-semibold text-yellow-400">
                  {username}
                </span>

                <button
                  onClick={handleLogout}
                  className="rounded-full bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-bold transition hover:from-red-700 hover:to-red-800"
                >
                  Wyloguj
                </button>

              </div>
            )}

            {token && (
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="flex-shrink-0 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-wide transition hover:bg-white/15 md:hidden"
                aria-label="Otwórz menu konta"
              >
                Konto
              </button>
            )}

          </div>

          {mobileOpen && token && (
            <div className="mt-4 flex flex-col gap-4 border-t border-white/10 pt-4 text-sm font-semibold uppercase tracking-widest md:hidden">

              <div className="text-yellow-400">
                {username}
              </div>

              <button
                onClick={handleLogout}
                className="rounded-full bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 font-bold"
              >
                Wyloguj
              </button>

            </div>
          )}

        </div>
      </nav>

      {token && (
        <nav className="fixed inset-x-3 bottom-3 z-40 rounded-3xl border border-white/10 bg-[#070b12]/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 text-white shadow-2xl shadow-black/50 backdrop-blur-xl md:hidden">
          <div className={`grid gap-1 ${isAdmin ? "grid-cols-5" : "grid-cols-4"}`}>
            {mobileNavItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-bold transition ${
                  isActive
                    ? "bg-green-500/15 text-green-300"
                    : "text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="relative">
                  <NavIcon type={item.icon} />
                  {item.badge && (
                    <span className="absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border border-[#070b12] bg-green-400 px-1 text-[10px] font-black leading-none text-black shadow-lg shadow-green-500/25">
                      {item.badge}
                    </span>
                  )}
                </span>
                <span className="max-w-full truncate">
                  {item.label}
                </span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </>
  )
}
