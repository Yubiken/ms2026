import { useState } from "react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import EmptyState from "../components/EmptyState"
import PageLoader from "../components/PageLoader"

const formatDate = (date) => {
  if (!date) return "Brak daty"

  return new Date(date).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

export default function MyLeagues({
  participations = [],
  selectedCompetitionId = null,
  loading = false,
  onSelectCompetition,
  onJoinLeague,
}) {
  const [joinCode, setJoinCode] = useState("")
  const [joining, setJoining] = useState(false)
  const navigate = useNavigate()

  const handleSelect = (competitionId) => {
    onSelectCompetition?.(competitionId)
    toast.success("Liga wybrana")
    navigate("/dashboard")
  }

  const handleJoin = async (event) => {
    event.preventDefault()

    const normalizedCode = joinCode.trim().toUpperCase()

    if (!normalizedCode) {
      toast.error("Wpisz kod ligi")
      return
    }

    setJoining(true)

    try {
      const data = await onJoinLeague?.(normalizedCode)

      if (!data?.competition) return

      setJoinCode("")
      toast.success(`Dołączono do ligi: ${data.competition.name}`)
      navigate("/dashboard")
    } catch (error) {
      toast.error(error.message || "Nie udało się dołączyć do ligi")
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return <PageLoader title="Moje ligi" subtitle="Sprawdzam Twoje ligi" cards={3} />
  }

  return (
    <div className="min-h-screen px-4 py-8 text-white sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm font-bold uppercase tracking-[0.22em] text-green-300">Centrum dostępu</div>
            <h1 className="section-title mt-2 text-4xl font-black">Moje ligi</h1>
            <p className="mt-2 max-w-xl text-sm font-medium text-gray-400 sm:text-base">
              Dołącz kodem do ligi i wybierz, w której chcesz teraz typować mecze.
            </p>
          </div>
        </header>

        <section className="stadium-panel mb-6 rounded-3xl p-5 sm:p-6">
          <form onSubmit={handleJoin} className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <label className="grid gap-2 text-sm font-bold text-gray-300">
              Kod ligi
              <input
                type="text"
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase().replace(/[^A-Z0-9-_]/g, "").slice(0, 32))}
                placeholder="np. MS2026"
                disabled={joining}
                className="field-input text-lg font-black uppercase tracking-[0.12em]"
              />
            </label>

            <button type="submit" disabled={joining} className="btn-primary px-7 py-3.5">
              {joining ? "Dołączanie..." : "Dołącz do ligi"}
            </button>
          </form>
        </section>

        {participations.length === 0 ? (
          <EmptyState
            icon="ranking"
            title="Nie masz jeszcze żadnej ligi"
            description="Wpisz kod ligi, żeby zacząć typować i pojawić się w rankingu."
          />
        ) : (
          <section className="grid gap-3">
            {participations.map(participation => {
              const competition = participation.competition
              const isSelected = competition?.id === selectedCompetitionId

              return (
                <article
                  key={competition.id}
                  className={`match-ticket rounded-3xl p-5 transition sm:p-6 ${
                    isSelected ? "border-green-400/60 bg-green-500/10" : "border-white/10 bg-white/[0.04]"
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-2xl font-black">{competition.name}</h2>
                        {isSelected && (
                          <span className="rounded-full bg-green-400 px-3 py-1 text-xs font-black uppercase tracking-wide text-black">
                            Wybrana
                          </span>
                        )}
                        {competition.is_active && (
                          <span className="rounded-full border border-yellow-400/25 bg-yellow-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-300">
                            Aktywna
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-gray-400">
                        Dołączono: {formatDate(participation.joined_at)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelect(competition.id)}
                      disabled={isSelected}
                      className={isSelected ? "btn-ghost px-5 py-3 opacity-70" : "btn-primary px-5 py-3"}
                    >
                      {isSelected ? "Aktualnie wybrana" : "Przejdź"}
                    </button>
                  </div>
                </article>
              )
            })}
          </section>
        )}
      </div>
    </div>
  )
}
