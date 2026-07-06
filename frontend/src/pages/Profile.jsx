import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { getToken, saveToken } from "../auth"
import { apiRequest } from "../api"
import PageLoader from "../components/PageLoader"
import UserAvatar from "../components/UserAvatar"

export default function Profile({ onProfileUpdate }) {
  const API = import.meta.env.VITE_API_URL
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")

  useEffect(() => {
    apiRequest("/me")
      .then((data) => {
        if (!data) return

        setUsername(data.username || "")
        setEmail(data.email || "")
        setAvatarUrl(data.avatar_url || "")
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!username.trim()) {
      toast.error("Nick jest wymagany")
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`${API}/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          username,
          avatar_url: avatarUrl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.detail || "Nie udało się zapisać profilu")
        return
      }

      saveToken(data.access_token)
      onProfileUpdate(data.access_token)
      setUsername(data.user.username || "")
      setEmail(data.user.email || "")
      setAvatarUrl(data.user.avatar_url || "")
      toast.success("Profil zapisany")
    } catch {
      toast.error("Błąd serwera")
    } finally {
      setSaving(false)
    }
  }

  const clearAvatar = () => {
    setAvatarUrl("")
  }

  if (loading) {
    return <PageLoader title="Profil" subtitle="Ładuję dane gracza" cards={2} />
  }

  return (
    <div className="min-h-screen px-4 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-7">
          <div className="text-sm font-bold uppercase tracking-[0.22em] text-green-300">Konto gracza</div>
          <h1 className="section-title mt-2 text-4xl font-black">Profil</h1>
          <p className="mt-3 max-w-xl text-sm font-medium text-gray-400 sm:text-base">
            Zmień nick widoczny w rankingu i dodaj avatar z linku do obrazka.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="stadium-panel rounded-3xl p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <UserAvatar username={username} avatarUrl={avatarUrl} className="h-16 w-16 text-2xl" />
            <div className="min-w-0">
              <div className="truncate text-xl font-black">{username || "Twój nick"}</div>
              <div className="truncate text-sm font-semibold text-gray-400">{email}</div>
            </div>
          </div>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-gray-400">Nick</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              maxLength={40}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 font-bold text-white outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-400/25"
            />
          </label>

          <label className="mt-5 block">
            <span className="text-xs font-bold uppercase tracking-wide text-gray-400">Email</span>
            <input
              type="email"
              value={email}
              disabled
              className="mt-2 w-full cursor-not-allowed rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 font-semibold text-gray-400 outline-none"
            />
          </label>

          <label className="mt-5 block">
            <span className="text-xs font-bold uppercase tracking-wide text-gray-400">Avatar URL</span>
            <input
              type="url"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 font-semibold text-white outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-400/25"
            />
            <span className="mt-2 block text-xs font-semibold text-gray-500">
              Wklej bezpośredni link do obrazka. Puste pole usuwa avatar.
            </span>
          </label>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-gradient-to-r from-green-600 to-emerald-500 px-6 py-3 font-black uppercase text-white shadow-lg shadow-green-500/15 transition hover:from-green-700 hover:to-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Zapisywanie..." : "Zapisz profil"}
            </button>

            <button
              type="button"
              onClick={clearAvatar}
              disabled={saving || !avatarUrl}
              className="rounded-full border border-white/10 bg-white/10 px-6 py-3 font-bold uppercase text-gray-200 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Usuń avatar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
