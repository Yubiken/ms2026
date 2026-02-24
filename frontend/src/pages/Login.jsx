import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Login() {

  const navigate = useNavigate()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
  e.preventDefault()

  setLoading(true)
  setError("")

  try {

    const response = await fetch("http://127.0.0.1:8000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: username,   // albo zmień state na email
        password: password,
      }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.detail || "Błąd logowania")
    }

    const data = await response.json()

    localStorage.setItem("token", data.access_token)

    navigate("/matches")

  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900">

      <form
        onSubmit={handleLogin}
        className="bg-gray-800 p-8 rounded-xl shadow-lg w-96"
      >

        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Logowanie
        </h2>

        {/* username */}
        <div className="mb-4">
          <label className="block text-gray-300 mb-1">
            Login
          </label>

          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full p-2 rounded bg-white text-black border border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* password */}
        <div className="mb-4">
          <label className="block text-gray-300 mb-1">
            Hasło
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 rounded bg-white text-black border border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* error */}
        {error && (
          <div className="text-red-400 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded font-semibold transition"
        >
          {loading ? "Logowanie..." : "Zaloguj"}
        </button>

      </form>

    </div>
  )
}