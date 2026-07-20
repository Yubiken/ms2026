import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { APP_NAME } from "../constants"
import toast from "react-hot-toast"

export default function Register() {

  const API = import.meta.env.VITE_API_URL
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleRegister = async (event) => {
    event.preventDefault()

    if (!username || !email || !password) {
      toast.error("Uzupełnij wszystkie pola")
      return
    }

    if (password.length < 4) {
      toast.error("Hasło musi mieć co najmniej 4 znaki")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.detail && Array.isArray(data.detail)) {
          toast.error(data.detail[0].msg)
        } else if (typeof data.detail === "string") {
          toast.error(data.detail)
        } else {
          toast.error("Rejestracja nie powiodła się")
        }
        setLoading(false)
        return
      }

      toast.success("Konto utworzone")
      navigate("/login")

    } catch {
      toast.error("Rejestracja nie powiodła się")
    }

    setLoading(false)
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0b0f1a] px-4 animate-fadeIn">

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] bg-gradient-to-r from-yellow-400/20 via-transparent to-transparent blur-3xl rotate-[-20deg] animate-stadiumLight" />
        <div className="absolute top-[-20%] right-[-10%] w-[700px] h-[700px] bg-gradient-to-l from-red-500/20 via-transparent to-transparent blur-3xl rotate-[20deg] animate-stadiumLight" />
      </div>

      <form
        onSubmit={handleRegister}
        className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl text-center"
      >

        <div className="mb-8 animate-logoPulse">
          <div className="text-5xl font-black tracking-wide bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-lg">
            2026
          </div>

          <div className="text-xl text-yellow-400 tracking-widest mt-2">
            {APP_NAME}
          </div>

          <div className="h-1 w-24 mx-auto mt-3 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full animate-pulse" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-6">
          Dołącz do ligi
        </h2>

        <input
          type="text"
          placeholder="Nick"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="field-input mb-4"
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="field-input mb-4"
        />

        <input
          type="password"
          placeholder="Hasło"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="field-input mb-6"
        />

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3"
        >
          {loading ? "Tworzenie konta..." : "Zarejestruj się"}
        </button>

        <div className="mt-6 text-sm text-gray-400">
          Masz już konto?
          <Link
            to="/login"
            className="text-yellow-400 ml-2 hover:text-yellow-300 transition"
          >
            Zaloguj się
          </Link>
        </div>

      </form>
    </div>
  )
}
