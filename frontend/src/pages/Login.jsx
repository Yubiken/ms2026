import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { saveToken } from "../auth"
import toast from "react-hot-toast"

export default function Login({ onLogin }) {

  const API = import.meta.env.VITE_API_URL
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [resetUsername, setResetUsername] = useState("")
  const [resetEmail, setResetEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [resetLoading, setResetLoading] = useState(false)

  const navigate = useNavigate()

  const handleLogin = async (event) => {
    event.preventDefault()

    if (!username || !password) {
      toast.error("Uzupełnij wszystkie pola")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.detail || "Błędne dane logowania")
        setLoading(false)
        return
      }

      saveToken(data.access_token)
      onLogin(data.access_token)

      toast.success("Cześć, " + username + "!")
      navigate("/dashboard")

    } catch {
      toast.error("Błąd serwera")
    }

    setLoading(false)
  }

  const handlePasswordReset = async (event) => {
    event.preventDefault()

    if (!resetUsername || !resetEmail || !newPassword || !repeatPassword) {
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
          username: resetUsername,
          email: resetEmail,
          new_password: newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.detail || "Nie udało się zmienić hasła")
        setResetLoading(false)
        return
      }

      toast.success("Hasło zostało zmienione")
      setUsername(resetUsername)
      setPassword("")
      setResetUsername("")
      setResetEmail("")
      setNewPassword("")
      setRepeatPassword("")
      setShowPasswordReset(false)
    } catch {
      toast.error("Błąd serwera")
    }

    setResetLoading(false)
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0b0f1a] px-4 animate-fadeIn">

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] bg-gradient-to-r from-yellow-400/20 via-transparent to-transparent blur-3xl rotate-[-20deg] animate-stadiumLight" />
        <div className="absolute top-[-20%] right-[-10%] w-[700px] h-[700px] bg-gradient-to-l from-red-500/20 via-transparent to-transparent blur-3xl rotate-[20deg] animate-stadiumLight" />
      </div>

      <form
        onSubmit={showPasswordReset ? handlePasswordReset : handleLogin}
        className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl text-center"
      >

        <div className="mb-8 animate-logoPulse">
          <div className="text-5xl font-black tracking-wide bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-lg">
            2026
          </div>

          <div className="text-xl text-yellow-400 tracking-widest mt-2">
            NAŁĘCZOWSKA LIGA TYPERÓW
          </div>

          <div className="h-1 w-24 mx-auto mt-3 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full animate-pulse" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-6">
          {showPasswordReset ? "Zmień hasło" : "Zaloguj się do ligi"}
        </h2>

        {showPasswordReset ? (
          <>
            <p className="mb-5 text-sm font-medium text-gray-400">
              Podaj nick i email zapisane w bazie, a potem ustaw nowe hasło.
            </p>

            <input
              type="text"
              placeholder="Nick"
              value={resetUsername}
              onChange={(event) => setResetUsername(event.target.value)}
              className="w-full mb-4 p-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-red-500 focus:ring-2 focus:ring-red-500/40 outline-none transition"
            />

            <input
              type="email"
              placeholder="Email"
              value={resetEmail}
              onChange={(event) => setResetEmail(event.target.value)}
              className="w-full mb-4 p-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-red-500 focus:ring-2 focus:ring-red-500/40 outline-none transition"
            />

            <input
              type="password"
              placeholder="Nowe hasło"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full mb-4 p-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-red-500 focus:ring-2 focus:ring-red-500/40 outline-none transition"
            />

            <input
              type="password"
              placeholder="Powtórz nowe hasło"
              value={repeatPassword}
              onChange={(event) => setRepeatPassword(event.target.value)}
              className="w-full mb-6 p-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-red-500 focus:ring-2 focus:ring-red-500/40 outline-none transition"
            />
          </>
        ) : (
          <>
            <input
              type="text"
              placeholder="Nick"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full mb-5 p-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-red-500 focus:ring-2 focus:ring-red-500/40 outline-none transition"
            />

            <input
              type="password"
              placeholder="Hasło"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full mb-6 p-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-red-500 focus:ring-2 focus:ring-red-500/40 outline-none transition"
            />
          </>
        )}

        <button
          type="submit"
          disabled={showPasswordReset ? resetLoading : loading}
          className={`w-40 sm:w-44 py-3 rounded-full font-bold uppercase tracking-wider transition duration-300 shadow-lg ${
            (showPasswordReset ? resetLoading : loading)
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600"
          }`}
        >
          {showPasswordReset
            ? resetLoading ? "Zapisywanie..." : "Zmień hasło"
            : loading ? "Logowanie..." : "Zaloguj się"}
        </button>

        <button
          type="button"
          onClick={() => setShowPasswordReset(isVisible => !isVisible)}
          className="mt-5 text-sm font-bold text-yellow-300 transition hover:text-yellow-200"
        >
          {showPasswordReset ? "Wróć do logowania" : "Nie pamiętasz hasła?"}
        </button>

      </form>
    </div>
  )
}
