'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGame } from '@/context/GameContext'
import { useGamePersistence } from '@/hooks/useGamePersistence'

interface GameSessionLoaderProps {
  children: React.ReactNode
}

export default function GameSessionLoader({ children }: GameSessionLoaderProps) {
  const { state, joinGame } = useGame()
  const { hasValidSession, cachedSession, clearCache } = useGamePersistence()
  const router = useRouter()

  useEffect(() => {
    // Wait for initial load to complete
    if (cachedSession === null) return

    // Check if we have a valid cached session (call function directly, don't include in deps)
    const isValidSession = !!(cachedSession && 
                            cachedSession.sessionId && 
                            cachedSession.cyclistId && 
                            cachedSession.teamName &&
                            cachedSession.joinCode)

    if (!isValidSession) {
      console.log('🔄 GameSessionLoader: No valid session, redirecting to login')
      // Prevent immediate redirect loops
      setTimeout(() => router.push('/login'), 100)
      return
    }

    // If we have a valid session but no current cyclist, load from cache
    if (!state.currentCyclist && !state.isLoading && cachedSession.joinCode && cachedSession.teamName) {
      console.log('🔄 GameSessionLoader: Restoring session from cache')
      
      // Prevent multiple restoration attempts
      if (state.currentCyclist === null) {
        joinGame(cachedSession.joinCode, cachedSession.teamName).catch((error) => {
          console.error('❌ GameSessionLoader: Failed to restore session:', error)
          clearCache()
          router.push('/login')
        })
      }
    }
  }, [state.currentCyclist, state.isLoading, cachedSession, joinGame, clearCache, router])

  // Show loading while waiting for cache to load
  if (cachedSession === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="w-8 h-8 bg-rubicon-200 rounded-full mx-auto mb-2"></div>
          </div>
          <p className="text-slate-600">Checking session...</p>
        </div>
      </div>
    )
  }

  // Show loading while session is being restored
  const isValidSession = !!(cachedSession && 
                          cachedSession.sessionId && 
                          cachedSession.cyclistId && 
                          cachedSession.teamName &&
                          cachedSession.joinCode)
  
  if (isValidSession && !state.currentCyclist && state.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rubicon-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Restoring your game session...</p>
          <p className="text-sm text-slate-500 mt-2">
            {cachedSession?.teamName} • {cachedSession?.cyclistName}
          </p>
        </div>
      </div>
    )
  }

  // Show loading while no session data yet but should have one
  if (isValidSession && !state.currentCyclist && !state.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="w-12 h-12 bg-rubicon-200 rounded-full mx-auto mb-4"></div>
          </div>
          <p className="text-slate-600">Preparing game data...</p>
          <p className="text-sm text-slate-500 mt-2">
            This should only take a moment...
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}