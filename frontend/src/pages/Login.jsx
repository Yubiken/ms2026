import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { saveToken } from "../auth"
import toast from "react-hot-toast"

export default function Login({ onLogin }) {

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleLogin = async (e) => {

    e.preventDefault()

    if (!username || !password) {
      toast.error("Fill all fields")
      return
    }

    setLoading(true)

    try {

      const response = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.detail || "Invalid credentials")
        setLoading(false)
        return
      }

      saveToken(data.access_token)
      onLogin(data.access_token)
      navigate("/matches")
      onLogin(data.access_token)

      toast.success("Welcome back 🚀")

      navigate("/matches")

    } catch {
      toast.error("Server error")
    }

    setLoading(false)
  }

  return (
    <div className="flex justify-center items-center h-screen bg-gray-900">

      <form
        onSubmit={handleLogin}
        className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-96 border border-gray-700"
      >

        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Welcome Back
        </h2>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full mb-4 p-3 rounded bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-green-500 outline-none transition"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 p-3 rounded bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-green-500 outline-none transition"
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full p-3 rounded font-semibold transition ${
            loading
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <div className="mt-4 text-sm text-gray-400 text-center">
          No account?
          <Link
            to="/register"
            className="text-green-400 ml-1 hover:underline"
          >
            Create one
          </Link>
        </div>

      </form>

    </div>
  )
}