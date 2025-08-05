// COMPLETELY NEW FILE TO FORCE BROWSER CACHE UPDATE
import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'gameSession'
const CACHE_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours

export interface GameSessionData {
  joinCode: string
  teamName: string
  cyclistId: string
  sessionId: string
  cyclistName: string
  sessionTitle: string
  timestamp: number
}

export function useGamePersistence() {
  const [cachedSession, setCachedSession] = useState<GameSessionData | null>(null)

  // Hook loaded successfully

  // Simple load on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY)
      if (cached) {
        const data = JSON.parse(cached)
        if (data.timestamp && Date.now() - data.timestamp < CACHE_EXPIRY) {
          setCachedSession(data)
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch (error) {
      console.error('Cache load error:', error)
    }
  }, [])

  // Simple save
  const saveToCache = useCallback((data: Omit<GameSessionData, 'timestamp'>) => {
    const sessionData = { ...data, timestamp: Date.now() }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData))
      setCachedSession(sessionData)
    } catch (error) {
      console.error('Cache save error:', error)
    }
  }, [])

  // Simple clear
  const clearCache = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(STORAGE_KEY)
    setCachedSession(null)
  }, [])

  // Simple validation
  const hasValidSession = useCallback(() => {
    return !!(cachedSession && 
              cachedSession.sessionId && 
              cachedSession.cyclistId && 
              cachedSession.teamName &&
              cachedSession.joinCode)
  }, [cachedSession])

  return {
    cachedSession,
    saveToCache,
    updateCache: saveToCache, // Alias for backward compatibility
    clearCache,
    hasValidSession,
    getCachedJoinCode: () => cachedSession?.joinCode || '',
    getCachedTeamName: () => cachedSession?.teamName || '',
    isCodeValidated: () => !!(cachedSession?.joinCode)
  }
}