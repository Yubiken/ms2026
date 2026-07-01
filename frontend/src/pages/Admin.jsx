import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest } from "../api"
import EmptyState from "../components/EmptyState"
import PageLoader from "../components/PageLoader"
import TeamName from "../components/TeamName"

const stageOptions = [
  { value: "group", label: "Faza grupowa" },
  { value: "round_of_32", label: "1/16 finału" },
  { value: "round_of_16", label: "1/8 finału" },
  { value: "quarter_final", label: "Ćwierćfinał" },
  { value: "semi_final", label: "Półfinał" },
  { value: "third_place", label: "Mecz o 3. miejsce" },
  { value: "final", label: "Finał" },
]

const groupOptions = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]

const initialMatchForm = {
  home_team: "",
  away_team: "",
  date: "",
  time: "",
  stage: "round_of_16",
  group_name: "",
}

export default function Admin() {

  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [scores, setScores] = useState({})
  const [filter, setFilter] = useState("unfinished")
  const [savingMatchId, setSavingMatchId] = useState(null)
  const [clearingMatchId, setClearingMatchId] = useState(null)
  const [matchForm, setMatchForm] = useState(initialMatchForm)
  const [creatingMatch, setCreatingMatch] = useState(false)

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    try {
      const data = await apiRequest("/matches")

      if (!data) return

      setMatches(Array.isArray(data) ? data : [])
    } catch {
      toast.error("Nie udało się pobrać meczów")
    }

    setLoading(false)
  }

  const updateScore = (matchId, side, value) => {
    setScores(current => ({
      ...current,
      [matchId]: {
        ...(current[matchId] || {}),
        [side]: value,
      },
    }))
  }

  const getScoreValue = (match, side) => {
    const score = scores[match.id] || {}

    if (score[side] != null) return score[side]
    return match[side] ?? ""
  }

  const updateMatchForm = (field, value) => {
    setMatchForm(current => ({
      ...current,
      [field]: value,
      ...(field === "stage" && value !== "group" ? { group_name: "" } : {}),
    }))
  }

  const hasCompleteScore = (match) => {
    const homeScore = getScoreValue(match, "home_score")
    const awayScore = getScoreValue(match, "away_score")

    return homeScore !== "" && awayScore !== "" && homeScore != null && awayScore != null
  }

  const saveResult = async (match) => {
    const homeScore = getScoreValue(match, "home_score")
    const awayScore = getScoreValue(match, "away_score")

    if (!hasCompleteScore(match)) {
      toast.error("Wpisz wynik meczu")
      return
    }

    if (match.is_finished) {
      const confirmed = window.confirm(
        `Poprawić wynik meczu ${match.home_team} vs ${match.away_team} na ${homeScore}:${awayScore}? Punkty zostaną przeliczone od nowa.`
      )

      if (!confirmed) return
    }

    setSavingMatchId(match.id)

    try {
      const data = await apiRequest(`/admin/matches/${match.id}/result`, {
        method: "PUT",
        body: JSON.stringify({
          home_score: Number(homeScore),
          away_score: Number(awayScore),
        }),
      })

      if (!data) return

      toast.success(match.is_finished ? "Wynik poprawiony" : "Wynik zapisany")
      setScores(current => {
        const next = { ...current }
        delete next[match.id]
        return next
      })
      fetchMatches()
    } catch {
      toast.error("Nie udało się zapisać wyniku")
    } finally {
      setSavingMatchId(null)
    }
  }

  const clearResult = async (match) => {
    const confirmed = window.confirm(`Cofnąć wynik meczu ${match.home_team} vs ${match.away_team}? Punkty za ten mecz zostaną wyzerowane.`)

    if (!confirmed) return

    setClearingMatchId(match.id)

    try {
      const data = await apiRequest(`/admin/matches/${match.id}/result`, {
        method: "DELETE",
      })

      if (!data) return

      toast.success("Wynik cofnięty")
      setScores(current => {
        const next = { ...current }
        delete next[match.id]
        return next
      })
      fetchMatches()
    } catch {
      toast.error("Nie udało się cofnąć wyniku")
    } finally {
      setClearingMatchId(null)
    }
  }

  const createMatch = async (event) => {
    event.preventDefault()

    const homeTeam = matchForm.home_team.trim()
    const awayTeam = matchForm.away_team.trim()

    if (!homeTeam || !awayTeam || !matchForm.date || !matchForm.time) {
      toast.error("Uzupełnij drużyny, datę i godzinę")
      return
    }

    setCreatingMatch(true)

    try {
      const data = await apiRequest("/matches", {
        method: "POST",
        body: JSON.stringify({
          home_team: homeTeam,
          away_team: awayTeam,
          start_time: `${matchForm.date}T${matchForm.time}:00`,
          stage: matchForm.stage,
          group_name: matchForm.stage === "group" && matchForm.group_name ? matchForm.group_name : null,
        }),
      })

      if (!data) return

      toast.success("Mecz dodany")
      setMatchForm(initialMatchForm)
      await fetchMatches()
    } catch {
      toast.error("Nie udało się dodać meczu")
    } finally {
      setCreatingMatch(false)
    }
  }

  const visibleMatches = matches
    .filter(match => {
      if (filter === "finished") return match.is_finished
      if (filter === "unfinished") return !match.is_finished
      return true
    })
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))

  const unfinishedCount = matches.filter(match => !match.is_finished).length
  const finishedCount = matches.filter(match => match.is_finished).length

  if (loading) {
    return <PageLoader title="Admin" subtitle="Ładuję mecze do rozliczenia" cards={5} />
  }

  return (
    <div className="min-h-screen overflow-x-hidden px-4 py-8 text-white sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-6xl">

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="section-title text-4xl font-black">
              Admin
            </h1>
            <div className="mt-3 h-1 w-28 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500" />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              ["unfinished", "Nierozliczone"],
              ["finished", "Zakończone"],
              ["all", "Wszystkie"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
                  filter === key
                    ? "bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-black"
                    : "bg-white/10 text-gray-300 hover:bg-white/15"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="stadium-panel rounded-2xl p-4">
            <div className="text-xs uppercase tracking-wide text-gray-400">Nierozliczone</div>
            <div className="mt-1 text-2xl font-black text-green-300">{unfinishedCount}</div>
          </div>

          <div className="stadium-panel rounded-2xl p-4">
            <div className="text-xs uppercase tracking-wide text-gray-400">Zakończone</div>
            <div className="mt-1 text-2xl font-black text-yellow-300">{finishedCount}</div>
          </div>
        </div>

        <details className="stadium-panel mb-6 rounded-2xl p-4 sm:p-5">
          <summary className="cursor-pointer list-none">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-black uppercase tracking-wide text-white">
                  Dodaj mecz
                </div>
                <div className="mt-1 text-xs font-semibold text-gray-400">
                  Data i godzina są traktowane jako czas polski.
                </div>
              </div>
              <div className="text-xs font-bold uppercase tracking-wide text-green-300">
                Formularz
              </div>
            </div>
          </summary>

          <form onSubmit={createMatch} className="mt-5 border-t border-white/10 pt-5">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold text-gray-300">
                Gospodarz
                <input
                  type="text"
                  value={matchForm.home_team}
                  onChange={(event) => updateMatchForm("home_team", event.target.value)}
                  placeholder="np. Kanada"
                  disabled={creatingMatch}
                  className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-green-400 focus:ring-2 focus:ring-green-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-gray-300">
                Gość
                <input
                  type="text"
                  value={matchForm.away_team}
                  onChange={(event) => updateMatchForm("away_team", event.target.value)}
                  placeholder="np. Maroko"
                  disabled={creatingMatch}
                  className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-green-400 focus:ring-2 focus:ring-green-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-gray-300">
                Data
                <input
                  type="date"
                  value={matchForm.date}
                  onChange={(event) => updateMatchForm("date", event.target.value)}
                  disabled={creatingMatch}
                  className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-gray-300">
                Godzina
                <input
                  type="time"
                  value={matchForm.time}
                  onChange={(event) => updateMatchForm("time", event.target.value)}
                  disabled={creatingMatch}
                  className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-gray-300">
                Faza
                <select
                  value={matchForm.stage}
                  onChange={(event) => updateMatchForm("stage", event.target.value)}
                  disabled={creatingMatch}
                  className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {stageOptions.map(option => (
                    <option key={option.value} value={option.value} className="bg-[#111827] text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-bold text-gray-300">
                Grupa
                <select
                  value={matchForm.group_name}
                  onChange={(event) => updateMatchForm("group_name", event.target.value)}
                  disabled={creatingMatch || matchForm.stage !== "group"}
                  className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <option value="" className="bg-[#111827] text-white">
                    Brak
                  </option>
                  {groupOptions.map(group => (
                    <option key={group} value={group} className="bg-[#111827] text-white">
                      Grupa {group}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setMatchForm(initialMatchForm)}
                disabled={creatingMatch}
                className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold uppercase text-gray-200 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Wyczyść
              </button>

              <button
                type="submit"
                disabled={creatingMatch}
                className="rounded-full bg-gradient-to-r from-green-600 to-emerald-500 px-5 py-2.5 text-sm font-bold uppercase text-white shadow-lg transition hover:from-green-700 hover:to-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creatingMatch ? "Dodawanie..." : "Dodaj mecz"}
              </button>
            </div>
          </form>
        </details>

        {visibleMatches.length === 0 ? (
          <EmptyState
            icon="admin"
            title="Brak meczów w tym widoku"
            description="Zmień filtr, żeby zobaczyć pozostałe mecze."
            actionLabel={filter === "all" ? null : "Pokaż wszystkie"}
            onAction={filter === "all" ? null : () => setFilter("all")}
          />
        ) : (
          <div className="grid gap-4">
            {visibleMatches.map(match => {
              const saving = savingMatchId === match.id
              const clearing = clearingMatchId === match.id
              const busy = saving || clearing

              return (
                <div
                  key={match.id}
                  className="match-ticket rounded-2xl p-4 sm:p-5"
                >
                  <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">
                        {match.group_name && (
                          <span className="rounded-full bg-white/10 px-2.5 py-1 text-gray-200">
                            Grupa {match.group_name}
                          </span>
                        )}
                        <span>
                          {new Date(match.start_time).toLocaleString("pl-PL", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {match.is_finished && (
                          <span className="rounded-full border border-gray-400/30 bg-gray-500/20 px-2.5 py-1 text-gray-200">
                            Zakończony
                          </span>
                        )}
                      </div>

                      <div className="text-lg font-black sm:text-xl">
                        <TeamName name={match.home_team} />
                        <span className="mx-2 text-gray-500">vs</span>
                        <TeamName name={match.away_team} />
                      </div>

                      {match.is_finished && (
                        <div className="mt-2 text-sm text-yellow-400">
                          Aktualny wynik: {match.home_score}:{match.away_score}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="flex items-center justify-center gap-3">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={getScoreValue(match, "home_score")}
                          onChange={(event) => updateScore(match.id, "home_score", event.target.value)}
                          disabled={busy}
                          className="w-20 rounded-xl border border-white/20 bg-white/10 p-3 text-center text-white outline-none transition focus:border-green-500 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <span className="text-2xl font-black">:</span>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={getScoreValue(match, "away_score")}
                          onChange={(event) => updateScore(match.id, "away_score", event.target.value)}
                          disabled={busy}
                          className="w-20 rounded-xl border border-white/20 bg-white/10 p-3 text-center text-white outline-none transition focus:border-green-500 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>

                      <button
                        onClick={() => saveResult(match)}
                        disabled={busy || !hasCompleteScore(match)}
                        className={`rounded-full px-5 py-2 text-sm font-bold uppercase text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          match.is_finished
                            ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                            : "bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600"
                        }`}
                      >
                        {saving ? "Zapisywanie..." : match.is_finished ? "Popraw wynik" : "Zapisz wynik"}
                      </button>

                      {match.is_finished && (
                        <button
                          onClick={() => clearResult(match)}
                          disabled={busy}
                          className="rounded-full bg-gray-700 px-5 py-2 text-sm font-bold uppercase text-white shadow-lg transition hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {clearing ? "Cofanie..." : "Cofnij wynik"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
