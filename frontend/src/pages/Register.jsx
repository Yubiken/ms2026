import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import toast from "react-hot-toast"

export default function Register() {

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()

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

      toast.success("Konto utworzone 🚀")
      navigate("/login")

    } catch {
      toast.error("Rejestracja nie powiodła się")
    }

    setLoading(false)
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden 
                    bg-[#0b0f1a] px-4 animate-fadeIn">

      {/* 🏟️ STADIUM LIGHT EFFECT */}
      <div className="absolute inset-0 pointer-events-none">

        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px]
                        bg-gradient-to-r from-yellow-400/20 via-transparent to-transparent
                        blur-3xl rotate-[-20deg] animate-stadiumLight">
        </div>

        <div className="absolute top-[-20%] right-[-10%] w-[700px] h-[700px]
                        bg-gradient-to-l from-red-500/20 via-transparent to-transparent
                        blur-3xl rotate-[20deg] animate-stadiumLight">
        </div>

      </div>

      {/* FORM */}
      <form
        onSubmit={handleRegister}
        className="relative z-10 w-full max-w-md 
                   bg-white/5 backdrop-blur-xl 
                   border border-white/10 
                   p-10 rounded-3xl 
                   shadow-2xl text-center"
      >

        {/* 🥇 LOGO */}
        <div className="mb-8 animate-logoPulse">

          <div className="text-5xl font-black tracking-wide 
                          bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 
                          bg-clip-text text-transparent drop-shadow-lg">
            ⚽ 2026
          </div>

          <div className="text-xl text-yellow-400 tracking-widest mt-2">
            NAŁĘCZÓW CUP
          </div>

          <div className="h-1 w-24 mx-auto mt-3 
                          bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 
                          rounded-full animate-pulse">
          </div>

        </div>

        <h2 className="text-2xl font-bold text-white mb-6">
          Dołącz do ligi
        </h2>

        {/* USERNAME */}
        <input
          type="text"
          placeholder="Nick"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full mb-4 p-3 rounded-xl 
                     bg-white/10 text-white 
                     border border-white/20 
                     focus:border-red-500 
                     focus:ring-2 focus:ring-red-500/40 
                     outline-none transition"
        />

        {/* EMAIL */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 p-3 rounded-xl 
                     bg-white/10 text-white 
                     border border-white/20 
                     focus:border-red-500 
                     focus:ring-2 focus:ring-red-500/40 
                     outline-none transition"
        />

        {/* PASSWORD */}
        <input
          type="password"
          placeholder="Hasło"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 p-3 rounded-xl 
                     bg-white/10 text-white 
                     border border-white/20 
                     focus:border-red-500 
                     focus:ring-2 focus:ring-red-500/40 
                     outline-none transition"
        />

        {/* BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-full font-bold uppercase tracking-wider
                      transition duration-300 shadow-lg
            ${
              loading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            }`}
        >
          {loading ? "Tworzenie konta..." : "Zarejestruj się"}
        </button>

        {/* LOGIN LINK */}
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