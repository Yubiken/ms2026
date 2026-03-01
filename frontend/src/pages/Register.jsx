import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import toast from "react-hot-toast"

export default function Register() {

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleRegister = async (e) => {

    e.preventDefault()

    if (!username || !password) {
      toast.error("Fill all fields")
      return
    }

    if (password.length < 4) {
      toast.error("Password must be at least 4 characters")
      return
    }

    setLoading(true)

    try {

      const response = await fetch("http://127.0.0.1:8000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.detail || "Registration failed")
        setLoading(false)
        return
      }

      toast.success("Account created 🚀")

      navigate("/login")

    } catch {
      toast.error("Server error")
    }

    setLoading(false)
  }

  return (
    <div className="flex justify-center items-center h-screen bg-gray-900">

      <form
        onSubmit={handleRegister}
        className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-96 border border-gray-700"
      >

        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Create Account
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
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <div className="mt-4 text-sm text-gray-400 text-center">
          Already have an account?
          <Link
            to="/login"
            className="text-green-400 ml-1 hover:underline"
          >
            Sign In
          </Link>
        </div>

      </form>

    </div>
  )
}