import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest } from "../api"
import { getUsername } from "../auth"
import EmptyState from "../components/EmptyState"
import PageLoader from "../components/PageLoader"

const getVoteLabel = (count) => {
  const value = Number(count ?? 0)

  if (value === 1) return "1 głos"
  if (value >= 2 && value <= 4) return `${value} głosy`

  return `${value} głosów`
}

export default function Champion() {
  const [teams, setTeams] = useState([])
  const [pick, setPick] = useState(null)
  const [summary, setSummary] = useState([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [savingTeam, setSavingTeam] = useState(null)
  const currentUser = getUsername()

  const loadSummary = async () => {
    const data = await apiRequest("/champion-picks/summary")

    if (Array.isArray(data)) {
      setSummary(data)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [matchesData, pickData] = await Promise.all([
          apiRequest("/matches"),
          apiRequest("/champion-pick"),
        ])

        if (Array.isArray(matchesData)) {
          const teamNames = new Set()

          matchesData.forEach(match => {
            if (match.home_team) teamNames.add(match.home_team)
            if (match.away_team) teamNames.add(match.away_team)
          })

          setTeams([...teamNames].sort((teamA, teamB) => teamA.localeCompare(teamB, "pl")))
        }

        if (pickData?.team_name) {
          setPick(pickData)
          await loadSummary()
        }
      } catch {
        toast.error("Nie udało się załadować wyboru mistrza")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredTeams = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return teams

    return teams.filter(team => team.toLowerCase().includes(query))
  }, [search, teams])

  const topVotes = summary[0]?.votes ?? 0
  const totalVotes = summary.reduce((sum, item) => sum + Number(item.votes ?? 0), 0)

  const savePick = async (teamName) => {
    if (pick) return

    const confirmed = window.confirm(`Zapisać wybór mistrza: ${teamName}? Tego wyboru nie będzie można zmienić.`)

    if (!confirmed) return

    setSavingTeam(teamName)

    try {
      const data = await apiRequest("/champion-pick", {
        method: "POST",
        body: JSON.stringify({
          team_name: teamName,
        }),
      })

      if (data?.detail) {
        toast.error(data.detail)
        return
      }

      setPick(data)
      toast.success("Mistrz zapisany")
      await loadSummary()
    } catch {
      toast.error("Nie udało się zapisać wyboru")
    } finally {
      setSavingTeam(null)
    }
  }

  if (loading) {
    return <PageLoader title="Mistrz" subtitle="Ładuję drużyny" cards={4} />
  }

  return (
    <div className="min-h-screen overflow-x-hidden px-4 py-8 text-white sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="section-title text-4xl font-black">
            Mistrz
          </h1>
          <div className="mx-auto mt-3 h-1 w-32 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500" />
        </div>

        {pick ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <div className="stadium-panel rounded-2xl p-6">
              <div className="text-xs font-black uppercase tracking-wide text-green-300">
                Twój mistrz
              </div>
              <div className="mt-4 break-words text-4xl font-black text-white">
                {pick.team_name}
              </div>
              <div className="mt-4 rounded-full border border-green-400/25 bg-green-500/15 px-4 py-2 text-sm font-bold text-green-300">
                Wybór zapisany
              </div>
            </div>

            <div className="stadium-panel rounded-2xl p-6">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-wide text-gray-400">
                    Głosy
                  </div>
                  <div className="mt-1 text-2xl font-black">
                    {getVoteLabel(totalVotes)}
                  </div>
                </div>
                <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-gray-300">
                  Fan vote
                </div>
              </div>

              {summary.length === 0 ? (
                <EmptyState
                  compact
                  icon="ranking"
                  title="Brak głosów"
                  description="Podsumowanie pojawi się po pierwszych wyborach."
                />
              ) : (
                <div className="space-y-4">
                  {summary[0] && (
                    <div className="rounded-2xl border border-yellow-400/30 bg-yellow-500/10 p-4">
                      <div className="text-xs font-black uppercase tracking-wide text-yellow-300">
                        Najczęściej wybierany mistrz
                      </div>
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div className="break-words text-3xl font-black text-white">
                          {summary[0].team_name}
                        </div>
                        <div className="text-sm font-bold text-gray-300">
                          {getVoteLabel(summary[0].votes)}
                          <span className="mx-2 text-gray-600">·</span>
                          {totalVotes > 0 ? Math.round((summary[0].votes / totalVotes) * 100) : 0}%
                        </div>
                      </div>
                    </div>
                  )}

                  {summary.map((item, index) => {
                    const width = topVotes > 0 ? `${Math.max(10, Math.round((item.votes / topVotes) * 100))}%` : "10%"
                    const percentage = totalVotes > 0 ? Math.round((item.votes / totalVotes) * 100) : 0
                    const isOwnPick = item.team_name === pick.team_name
                    const isLeader = index === 0

                    return (
                      <div
                        key={item.team_name}
                        className={`rounded-2xl border p-4 ${
                          isOwnPick
                            ? "border-green-400/50 bg-green-500/10"
                            : isLeader
                              ? "border-yellow-400/30 bg-yellow-500/10"
                              : "border-white/10 bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-bold">{item.team_name}</div>
                            {isLeader && (
                              <div className="mt-1 text-xs font-bold uppercase tracking-wide text-yellow-300">
                                Lider głosowania
                              </div>
                            )}
                          </div>
                          <div className="flex-shrink-0 text-right text-sm font-black text-yellow-300">
                            <div>{getVoteLabel(item.votes)}</div>
                            <div className="text-xs text-gray-400">{percentage}%</div>
                          </div>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"
                            style={{ width }}
                          />
                        </div>
                        {Array.isArray(item.users) && item.users.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {item.users.map(username => {
                              const isCurrentUser = username === currentUser

                              return (
                                <span
                                  key={username}
                                  className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                                    isCurrentUser
                                      ? "border-green-400/40 bg-green-500/15 text-green-300"
                                      : "border-white/10 bg-white/10 text-gray-300"
                                  }`}
                                >
                                  {username}
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="stadium-panel mb-6 rounded-2xl p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-wide text-yellow-300">
                    Wybór jednorazowy
                  </div>
                  <div className="mt-2 text-2xl font-black">
                    Kto zostanie mistrzem świata?
                  </div>
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Szukaj drużyny"
                  className="w-full rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-gray-500 focus:border-green-400 focus:ring-2 focus:ring-green-500/25 md:max-w-xs"
                />
              </div>
            </div>

            {filteredTeams.length === 0 ? (
              <EmptyState
                icon="matches"
                title="Nie znaleziono drużyny"
                description="Zmień wyszukiwanie, żeby zobaczyć pozostałe reprezentacje."
                actionLabel="Wyczyść"
                onAction={() => setSearch("")}
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTeams.map(team => (
                  <button
                    key={team}
                    type="button"
                    onClick={() => savePick(team)}
                    disabled={savingTeam != null}
                    className="match-ticket rounded-2xl p-4 text-left transition duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <div className="relative z-10 flex items-center gap-3">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-lg font-black text-yellow-300">
                        {team.slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-lg font-black">{team}</div>
                        <div className="mt-1 text-xs font-bold uppercase tracking-wide text-gray-500">
                          {savingTeam === team ? "Zapisywanie..." : "Wybierz mistrza"}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
