import { useCallback, useEffect, useMemo, useState } from "react"
import { apiRequest } from "../api"
import { getUsername } from "../auth"

const getStorageKey = () => {
  const username = getUsername()

  return username ? `selectedCompetitionId:${username}` : "selectedCompetitionId"
}

const normalizeId = (value) => {
  if (value == null || value === "") return null

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : null
}

export function useMyLeagues(token) {
  const [participations, setParticipations] = useState([])
  const [selectedCompetitionId, setSelectedCompetitionIdState] = useState(() => normalizeId(localStorage.getItem(getStorageKey())))
  const [loading, setLoading] = useState(Boolean(token))
  const [loadedToken, setLoadedToken] = useState(null)

  const selectedParticipation = useMemo(
    () => participations.find(participation => participation.competition?.id === selectedCompetitionId) || null,
    [participations, selectedCompetitionId]
  )
  const selectedCompetition = selectedParticipation?.competition || null

  const setSelectedCompetitionId = useCallback((competitionId) => {
    const normalizedId = normalizeId(competitionId)
    const storageKey = getStorageKey()

    if (normalizedId == null) {
      localStorage.removeItem(storageKey)
    } else {
      localStorage.setItem(storageKey, String(normalizedId))
    }

    setSelectedCompetitionIdState(normalizedId)
  }, [])

  const refreshLeagues = useCallback(async () => {
    if (!token) {
      setParticipations([])
      setSelectedCompetitionIdState(null)
      setLoading(false)
      setLoadedToken(null)
      return []
    }

    setLoading(true)

    try {
      const data = await apiRequest("/my-competitions")
      const nextParticipations = Array.isArray(data) ? data : []
      const selectedId = normalizeId(localStorage.getItem(getStorageKey()))
      const hasSelectedLeague = nextParticipations.some(participation => participation.competition?.id === selectedId)
      const fallbackParticipation = nextParticipations.find(participation => participation.competition?.is_active)
        || nextParticipations[0]
        || null
      const nextSelectedId = hasSelectedLeague
        ? selectedId
        : fallbackParticipation?.competition?.id || null

      setParticipations(nextParticipations)
      setSelectedCompetitionId(nextSelectedId)

      return nextParticipations
    } catch {
      setParticipations([])
      return []
    } finally {
      setLoadedToken(token)
      setLoading(false)
    }
  }, [setSelectedCompetitionId, token])

  const joinLeague = useCallback(async (joinCode) => {
    const data = await apiRequest("/competitions/join", {
      method: "POST",
      body: JSON.stringify({ join_code: joinCode }),
    })

    await refreshLeagues()

    if (data?.competition?.id) {
      setSelectedCompetitionId(data.competition.id)
    }

    return data
  }, [refreshLeagues, setSelectedCompetitionId])

  const resetLeagues = useCallback(() => {
    localStorage.removeItem(getStorageKey())
    setParticipations([])
    setSelectedCompetitionIdState(null)
    setLoading(false)
    setLoadedToken(null)
  }, [])

  useEffect(() => {
    refreshLeagues()
  }, [refreshLeagues])

  return {
    participations,
    selectedParticipation,
    selectedCompetition,
    selectedCompetitionId,
    loading: Boolean(token && (loading || loadedToken !== token)),
    refreshLeagues,
    joinLeague,
    setSelectedCompetitionId,
    resetLeagues,
  }
}
