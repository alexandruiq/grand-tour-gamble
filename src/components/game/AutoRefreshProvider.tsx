'use client'

import React, { useEffect } from 'react'
import { useGame } from '@/context/GameContext'
import { supabase } from '@/lib/supabase'

/**
 * Auto-refresh provider that forces game state updates when scoring data changes
 * This ensures the UI shows updated points, stamina, and team scores immediately
 */
export function AutoRefreshProvider({ children }: { children: React.ReactNode }) {
  const { state, refreshGameState } = useGame()

  useEffect(() => {
    if (!state.session?.id || !state.currentCyclist?.id) return

    console.log('🔄 Setting up auto-refresh subscriptions...')
    
    // Capture refreshGameState in closure to avoid dependency issues
    const handleRefresh = () => {
      console.log('🚀 Data updated, refreshing game state...')
      refreshGameState()
    }

    // Subscribe to cyclist changes (points, stamina, fatigue)
    const cyclistSubscription = supabase
      .channel(`cyclist-updates-${state.currentCyclist.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cyclists',
          filter: `id=eq.${state.currentCyclist.id}`,
        },
        (payload) => {
          console.log('🚀 Cyclist data updated:', payload.new)
          handleRefresh()
        }
      )
      .subscribe()

    // Subscribe to team changes (synergy, total points)
    const teamSubscription = supabase
      .channel(`team-updates-${state.team?.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', 
          schema: 'public',
          table: 'teams',
          filter: `id=eq.${state.team?.id}`,
        },
        (payload) => {
          console.log('🚀 Team data updated:', payload.new)
          handleRefresh()
        }
      )
      .subscribe()

    // Subscribe to session changes (stage, status, multipliers)
    const sessionSubscription = supabase
      .channel(`session-updates-${state.session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public', 
          table: 'sessions',
          filter: `id=eq.${state.session.id}`,
        },
        (payload) => {
          console.log('🚀 Session data updated:', payload.new)
          handleRefresh()
        }
      )
      .subscribe()

    // Cleanup subscriptions
    return () => {
      console.log('🔄 Cleaning up auto-refresh subscriptions')
      cyclistSubscription.unsubscribe()
      teamSubscription.unsubscribe()
      sessionSubscription.unsubscribe()
    }
  }, [state.session?.id, state.currentCyclist?.id, state.team?.id, refreshGameState])

  return <>{children}</>
}

export default AutoRefreshProvider