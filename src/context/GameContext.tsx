'use client'

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { GameState, GameSession, Cyclist, Team, Stage } from '@/types/game.types'
import { STAGE_NAMES, GAME_CONSTANTS } from '@/lib/constants'
import { useGamePersistence } from '@/hooks/useGamePersistence'

interface GameContextType {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  joinGame: (joinCode: string, teamName: string) => Promise<void>
  makeDecision: (decision: 'sprint' | 'cruise') => Promise<void>
  refreshGameState: () => Promise<void>
}

type GameAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SESSION'; payload: GameSession | null }
  | { type: 'SET_CYCLIST'; payload: Cyclist | null }
  | { type: 'SET_TEAM'; payload: Team | null }
  | { type: 'SET_ALL_TEAMS'; payload: Team[] }
  | { type: 'SET_CURRENT_STAGE'; payload: Stage | null }
  | { type: 'UPDATE_CYCLIST_STATS'; payload: { stamina: number; points: number } }
  | { type: 'UPDATE_TEAM_STATS'; payload: { synergy: number; points: number } }

const initialState: GameState = {
  session: null,
  currentCyclist: null,
  team: null,
  allTeams: [],
  currentStage: null,
  userDecisions: [],
  isLoading: false,
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_SESSION':
      return { ...state, session: action.payload }
    case 'SET_CYCLIST':
      return { ...state, currentCyclist: action.payload }
    case 'SET_TEAM':
      return { ...state, team: action.payload }
    case 'SET_ALL_TEAMS':
      return { ...state, allTeams: action.payload }
    case 'SET_CURRENT_STAGE':
      return { ...state, currentStage: action.payload }
    case 'UPDATE_CYCLIST_STATS':
      return {
        ...state,
        currentCyclist: state.currentCyclist
          ? {
              ...state.currentCyclist,
              stamina: action.payload.stamina,
              current_points: action.payload.points,
            }
          : null,
      }
    case 'UPDATE_TEAM_STATS':
      return {
        ...state,
        team: state.team
          ? {
              ...state.team,
              synergy_score: action.payload.synergy,
              total_points: action.payload.points,
            }
          : null,
      }
    default:
      return state
  }
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)
  const { saveToCache } = useGamePersistence()

  const joinGame = async (joinCode: string, teamName: string) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      // Validate join code and get cyclist info
      const { data: codeData, error: codeError } = await supabase
        .from('cyclist_codes')
        .select(`
          cyclist_name,
          cyclist_id,
          session_id,
          sessions (
            id,
            title,
            current_stage,
            status,
            stage_locked,
            multiplier_active,
            current_multiplier,
            reflection_active,
            trainer_id,
            created_at,
            updated_at
          )
        `)
        .eq('code', joinCode)
        .single()

      if (codeError || !codeData) {
        throw new Error('Invalid join code')
      }

      const sessionData = Array.isArray(codeData.sessions) 
        ? codeData.sessions[0] 
        : codeData.sessions
      
      const session: GameSession = {
        id: sessionData.id,
        title: sessionData.title,
        current_stage: sessionData.current_stage,
        status: sessionData.status,
        stage_locked: sessionData.stage_locked,
        stage_open: !sessionData.stage_locked, // Computed from stage_locked
        multiplier_active: sessionData.multiplier_active,
        current_multiplier: sessionData.current_multiplier,
        reflection_active: sessionData.reflection_active,
        trainer_id: sessionData.trainer_id || '',
        created_at: sessionData.created_at || new Date().toISOString(),
        updated_at: sessionData.updated_at || new Date().toISOString()
      }
      dispatch({ type: 'SET_SESSION', payload: session })

      // Get cyclist and team data using cyclist_id from the code data
      const { data: cyclistData, error: cyclistError } = await supabase
        .from('cyclists')
        .select(`
          *,
          teams (
            id,
            name,
            type,
            synergy_score,
            total_points
          )
        `)
        .eq('id', codeData.cyclist_id)
        .single()

      if (cyclistError || !cyclistData) {
        console.error('Error fetching cyclist:', cyclistError)
        throw new Error('Cyclist not found')
      }

      dispatch({ type: 'SET_CYCLIST', payload: cyclistData as Cyclist })
      dispatch({ type: 'SET_TEAM', payload: cyclistData.teams as Team })

      // Get all teams for leaderboard
      const { data: allTeams } = await supabase
        .from('teams')
        .select('*')
        .eq('session_id', session.id)

      if (allTeams) {
        dispatch({ type: 'SET_ALL_TEAMS', payload: allTeams })
      }

      // Set current stage
      const currentStage: Stage = {
        number: session.current_stage,
        name: STAGE_NAMES[session.current_stage - 1] || 'Unknown Stage',
        description: `Stage ${session.current_stage} of ${GAME_CONSTANTS.TOTAL_STAGES}`,
        terrain: 'varied',
        isNegotiationStage: GAME_CONSTANTS.NEGOTIATION_STAGES.includes(session.current_stage as 4 | 7 | 10),
      }
      dispatch({ type: 'SET_CURRENT_STAGE', payload: currentStage })

      // Update cyclist code with team name and join timestamp
      const { error: updateError } = await supabase
        .from('cyclist_codes')
        .update({
          team_name: teamName,
          player_joined_at: new Date().toISOString()
        })
        .eq('code', joinCode)

      if (updateError) {
        console.error('Error updating cyclist code:', updateError)
        // Don't throw here as the main join was successful
      }

      // Store session info using the persistence hook (with timestamp)
      saveToCache({
        joinCode,
        teamName,
        cyclistId: cyclistData.id,
        sessionId: session.id,
        cyclistName: cyclistData.name,
        sessionTitle: session.title
      })

    } catch (error) {
      console.error('Error joining game:', error)
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const makeDecision = async (decision: 'sprint' | 'cruise') => {
    if (!state.currentCyclist || !state.session) {
      throw new Error('No active game session')
    }

    dispatch({ type: 'SET_LOADING', payload: true })

    try {
      console.log('🎯 Making decision:', {
        cyclist_id: state.currentCyclist.id,
        session_id: state.session.id,
        stage_number: state.session.current_stage,
        decision
      })

      // First check if decision already exists
      const { data: existingDecision } = await supabase
        .from('decisions_log')
        .select('id, decision')
        .eq('cyclist_id', state.currentCyclist.id)
        .eq('session_id', state.session.id)
        .eq('stage_number', state.session.current_stage)
        .single()

      if (existingDecision) {
        console.log('⚠️ Decision already exists:', existingDecision)
        throw new Error(`Decision already submitted for this stage: ${existingDecision.decision}`)
      }

      const { error } = await supabase
        .from('decisions_log')
        .insert({
          cyclist_id: state.currentCyclist.id,
          session_id: state.session.id,
          stage_number: state.session.current_stage,
          decision,
        })

      if (error) {
        console.error('❌ Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        
        // Handle unique constraint violation specifically
        if (error.code === '23505') {
          throw new Error('Decision already submitted for this stage. Please refresh the page.')
        }
        
        throw error
      }

      console.log('✅ Decision submitted successfully')

    } catch (error: any) {
      console.error('💥 Error making decision:', {
        message: error?.message || 'Unknown error',
        code: error?.code,
        details: error?.details,
        stack: error?.stack
      })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const refreshGameState = useCallback(async () => {
    if (!state.session) return

    try {
      // Refresh session data
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', state.session.id)
        .single()

      if (sessionData) {
        // Compute stage_open from stage_locked
        const updatedSession = {
          ...sessionData,
          stage_open: !sessionData.stage_locked
        }
        dispatch({ type: 'SET_SESSION', payload: updatedSession })
      }

      // Refresh cyclist data
      if (state.currentCyclist) {
        const { data: cyclistData } = await supabase
          .from('cyclists')
          .select('*')
          .eq('id', state.currentCyclist.id)
          .single()

        if (cyclistData) {
          dispatch({ type: 'SET_CYCLIST', payload: cyclistData })
        }
      }

      // Refresh team data
      if (state.team) {
        const { data: teamData } = await supabase
          .from('teams')
          .select('*')
          .eq('id', state.team.id)
          .single()

        if (teamData) {
          dispatch({ type: 'SET_TEAM', payload: teamData })
        }
      }

    } catch (error) {
      console.error('Error refreshing game state:', error)
    }
  }, [state.session?.id, state.currentCyclist?.id, state.team?.id])

  // Set up realtime subscriptions
  useEffect(() => {
    if (!state.session?.id) return

    console.log(`🔄 Setting up real-time subscriptions for session: ${state.session.id}`)

    const channel = supabase
      .channel(`game-updates-${Date.now()}`)  // Unique channel name to avoid conflicts
      .on(
        'postgres_changes',
        {
          event: '*',  // Listen to all events
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${state.session.id}`,
        },
        (payload) => {
          console.log('🔄 Session update received:', payload)
          if (payload.new) {
            // Compute stage_open from stage_locked for real-time updates
            const updatedSession = {
              ...payload.new,
              stage_open: !(payload.new as any).stage_locked
            }
            dispatch({ type: 'SET_SESSION', payload: updatedSession as GameSession })
          }
        }
      )
      .subscribe((status) => {
        console.log('🔄 GameContext subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to session updates')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Failed to subscribe to session updates')
        }
      })

    return () => {
      console.log('🔄 Unsubscribing GameContext real-time')
      channel.unsubscribe()
    }
  }, [state.session?.id])  // Only depend on session ID

  return (
    <GameContext.Provider value={{ state, dispatch, joinGame, makeDecision, refreshGameState }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}