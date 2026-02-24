import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Register() {

  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()

    setError("")
    setSuccess("")

    if (password !== confirmPassword) {
      setError("Hasła nie są takie same")
      return
    }

    if (password.length < 6) {
      setError("Hasło musi mieć minimum 6 znaków")
      return
    }

    setLoading(true)

    try {

      const response = await fetch("http://127.0.0.1:8000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "Błąd rejestracji")
      }

      setSuccess("Konto utworzone! Logowanie...")

      // automatyczne logowanie po rejestracji
      const loginResponse = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      })

      const loginData = await loginResponse.json()

      localStorage.setItem("token", loginData.access_token)

      setTimeout(() => {
        navigate("/matches")
      }, 1000)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900">

      <form
        onSubmit={handleRegister}
        className="bg-gray-800 p-8 rounded-2xl shadow-xl w-96 border border-gray-700"
      >

        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Rejestracja
        </h2>

        {/* EMAIL */}
        <div className="mb-4">
          <label className="block text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 rounded bg-white text-black border border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* PASSWORD */}
        <div className="mb-4">
          <label className="block text-gray-300 mb-1">
            Hasło
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3 rounded bg-white text-black border border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* CONFIRM PASSWORD */}
        <div className="mb-4">
          <label className="block text-gray-300 mb-1">
            Powtórz hasło
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full p-3 rounded bg-white text-black border border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* ERROR */}
        {error && (
          <div className="text-red-400 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* SUCCESS */}
        {success && (
          <div className="text-green-400 mb-4 text-sm">
            {success}
          </div>
        )}

        {/* BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg font-semibold transition"
        >
          {loading ? "Tworzenie konta..." : "Zarejestruj się"}
        </button>

      </form>

    </div>
  )
}