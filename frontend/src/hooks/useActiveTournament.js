import { useCallback, useEffect, useState } from "react"
import { apiRequest } from "../api"

export function useActiveTournament(token) {
  const [activeParticipation, setActiveParticipation] = useState(null)
  const [loading, setLoading] = useState(false)

  const resetActiveTournament = useCallback(() => {
    setActiveParticipation(null)
    setLoading(false)
  }, [])

  const refreshActiveTournament = useCallback(async () => {
    if (!token) {
      resetActiveTournament()
      return
    }

    setLoading(true)

    try {
      const data = await apiRequest("/competition-participation/active")
      setActiveParticipation(data)
    } catch {
      setActiveParticipation(null)
    } finally {
      setLoading(false)
    }
  }, [resetActiveTournament, token])

  useEffect(() => {
    refreshActiveTournament()
  }, [refreshActiveTournament])

  return {
    activeParticipation,
    currentTournament: activeParticipation?.competition || null,
    loading,
    refreshActiveTournament,
    resetActiveTournament,
    setActiveParticipation,
  }
}
