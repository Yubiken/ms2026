import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import { saveToken } from "../auth"
import { APP_NAME } from "../constants"

export default function Login({ onLogin }) {
  const API = import.meta.env.VITE_API_URL
  const navigate = useNavigate()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [resetUsername, setResetUsername] = useState("")
  const [resetEmail, setResetEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [resetLoading, setResetLoading] = useState(false)

  const handleLogin = async (event) => {
    event.preventDefault()

    if (!username.trim() || !password) {
      toast.error("Uzupełnij nick i hasło")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.detail || "Błędne dane logowania")
        return
      }

      saveToken(data.access_token)
      onLogin(data.access_token)
      toast.success(`Cześć, ${username.trim()}!`)
      navigate("/dashboard")
    } catch {
      toast.error("Błąd serwera")
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async (event) => {
    event.preventDefault()

    if (!resetUsername.trim() || !resetEmail.trim() || !newPassword || !repeatPassword) {
      toast.error("Uzupełnij wszystkie pola")
      return
    }

    if (newPassword.length < 6) {
      toast.error("Nowe hasło musi mieć minimum 6 znaków")
      return
    }

    if (newPassword !== repeatPassword) {
      toast.error("Hasła nie są takie same")
      return
    }

    setResetLoading(true)

    try {
      const response = await fetch(`${API}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: resetUsername.trim(),
          email: resetEmail.trim(),
          new_password: newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.detail || "Nie udało się zmienić hasła")
        return
      }

      toast.success("Hasło zostało zmienione")
      setUsername(resetUsername.trim())
      setPassword("")
      setResetUsername("")
      setResetEmail("")
      setNewPassword("")
      setRepeatPassword("")
      setShowPasswordReset(false)
    } catch {
      toast.error("Błąd serwera")
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b12] px-4 py-8 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 -top-28 h-80 w-80 rounded-full bg-yellow-400/20 blur-3xl sm:h-[32rem] sm:w-[32rem]" />
        <div className="absolute -right-28 top-10 h-80 w-80 rounded-full bg-red-500/20 blur-3xl sm:h-[32rem] sm:w-[32rem]" />
        <div className="absolute bottom-0 left-1/2 h-72 w-[90vw] -translate-x-1/2 rounded-full bg-green-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_0.9fr]">
        <section className="hidden lg:block">
          <div className="inline-flex rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-yellow-200">
            {APP_NAME}
          </div>
          <h1 className="mt-6 max-w-xl text-6xl font-black leading-[0.95]">
            Typuj mecze.
            <span className="section-title block">Walcz o ranking.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg font-semibold leading-8 text-gray-300">
            Dołącz do aktywnego turnieju kodem ligi, obstawiaj wyniki i śledź swoje miejsce po każdym meczu.
          </p>

          <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
            {["Kod ligi", "Ranking", "Typy live"].map(item => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-gray-200">
                {item}
              </div>
            ))}
          </div>
        </section>

        <form
          onSubmit={showPasswordReset ? handlePasswordReset : handleLogin}
          className="mx-auto w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8"
        >
          <div className="mb-7 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 text-2xl font-black text-black shadow-xl shadow-orange-500/20">
              LT
            </div>
            <div className="mt-4 text-sm font-black uppercase tracking-[0.24em] text-yellow-300">
              {APP_NAME}
            </div>
            <h2 className="mt-3 text-3xl font-black">
              {showPasswordReset ? "Zmień hasło" : "Witaj z powrotem"}
            </h2>
            <p className="mt-2 text-sm font-semibold text-gray-400">
              {showPasswordReset
                ? "Podaj dane konta i ustaw nowe hasło."
                : "Zaloguj się, a potem dołącz do ligi kodem turnieju."}
            </p>
          </div>

          {showPasswordReset ? (
            <div className="grid gap-4">
              <label className="grid gap-2 text-sm font-bold text-gray-300">
                Nick
                <input
                  type="text"
                  value={resetUsername}
                  onChange={(event) => setResetUsername(event.target.value)}
                  autoComplete="username"
                  className="rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-yellow-300 focus:ring-2 focus:ring-yellow-400/20"
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-gray-300">
                Email
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(event) => setResetEmail(event.target.value)}
                  autoComplete="email"
                  className="rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-yellow-300 focus:ring-2 focus:ring-yellow-400/20"
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-gray-300">
                Nowe hasło
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  className="rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-yellow-300 focus:ring-2 focus:ring-yellow-400/20"
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-gray-300">
                Powtórz nowe hasło
                <input
                  type="password"
                  value={repeatPassword}
                  onChange={(event) => setRepeatPassword(event.target.value)}
                  autoComplete="new-password"
                  className="rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-yellow-300 focus:ring-2 focus:ring-yellow-400/20"
                />
              </label>
            </div>
          ) : (
            <div className="grid gap-4">
              <label className="grid gap-2 text-sm font-bold text-gray-300">
                Nick
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  placeholder="Twój nick"
                  className="rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-yellow-300 focus:ring-2 focus:ring-yellow-400/20"
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-gray-300">
                Hasło
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="Twoje hasło"
                  className="rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-yellow-300 focus:ring-2 focus:ring-yellow-400/20"
                />
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={showPasswordReset ? resetLoading : loading}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-green-500 to-emerald-400 px-5 py-3.5 font-black uppercase tracking-wide text-black shadow-xl shadow-green-500/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {showPasswordReset
              ? resetLoading ? "Zapisywanie..." : "Zapisz nowe hasło"
              : loading ? "Logowanie..." : "Zaloguj się"}
          </button>

          <div className="mt-5 flex flex-col items-center justify-center gap-3 text-sm font-bold text-gray-400 sm:flex-row">
            <button
              type="button"
              onClick={() => setShowPasswordReset(isVisible => !isVisible)}
              className="text-yellow-300 transition hover:text-yellow-200"
            >
              {showPasswordReset ? "Wróć do logowania" : "Nie pamiętasz hasła?"}
            </button>

            {!showPasswordReset && (
              <>
                <span className="hidden text-gray-600 sm:block">•</span>
                <Link to="/register" className="text-yellow-300 transition hover:text-yellow-200">
                  Załóż konto
                </Link>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
