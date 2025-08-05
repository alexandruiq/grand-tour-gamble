'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface NegotiationControlsProps {
  sessionId: string
  currentStage: number
  onUpdate?: () => void
}

interface NegotiationStatus {
  id?: string
  is_open: boolean
  multiplier: number
  stage_number: number
}

interface TeamReadiness {
  cyclist_name: string
  team_name: string | null
  is_ready: boolean
}

export default function NegotiationControls({ sessionId, currentStage, onUpdate }: NegotiationControlsProps) {
  const [negotiationStatus, setNegotiationStatus] = useState<NegotiationStatus | null>(null)
  const [teamReadiness, setTeamReadiness] = useState<TeamReadiness[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Check if current stage is a negotiation stage
  const isNegotiationStage = [4, 7, 9].includes(currentStage)

  // Load negotiation data
  const loadNegotiationData = useCallback(async () => {
    if (!isNegotiationStage) return

    try {
      console.log(`🤝 Loading negotiation data for session ${sessionId}, stage ${currentStage}`)
      
      // Get negotiation status (handle missing table gracefully)
      try {
        const { data: negotiation, error: negError } = await supabase
          .from('negotiations')
          .select('*')
          .eq('session_id', sessionId)
          .eq('stage_number', currentStage)
          .single()

        if (negotiation && !negError) {
          setNegotiationStatus(negotiation)
        } else {
          setNegotiationStatus(null)
        }
      } catch (error) {
        console.log('ℹ️ Negotiations table not available, using default state')
        setNegotiationStatus(null)
      }

      // Get team strategies and readiness from team_strategies table
      const { data: strategies, error: strategiesError } = await supabase
        .from('team_strategies')
        .select('team_name, intended_decision, is_ready')
        .eq('session_id', sessionId)
        .eq('stage_number', currentStage)

      if (strategies && !strategiesError) {
        console.log(`📊 Found ${strategies.length} team strategies`)
        const readiness: TeamReadiness[] = strategies.map(strategy => ({
          cyclist_name: strategy.team_name, // Using team_name as cyclist_name for display
          team_name: strategy.team_name,
          is_ready: strategy.is_ready
        }))
        setTeamReadiness(readiness)
      } else {
        // Fallback to cyclist codes if no strategies yet
        const { data: codes, error: codesError } = await supabase
          .from('cyclist_codes')
          .select('cyclist_name, team_name')
          .eq('session_id', sessionId)
          .not('team_name', 'is', null)

        if (codes && !codesError) {
          const readiness: TeamReadiness[] = codes.map(code => ({
            cyclist_name: code.cyclist_name,
            team_name: code.team_name,
            is_ready: false
          }))
          setTeamReadiness(readiness)
        }
      }
    } catch (err) {
      console.error('Error loading negotiation data:', err)
    }
  }, [sessionId, currentStage, isNegotiationStage])

  useEffect(() => {
    loadNegotiationData()

    // Set up real-time subscription for negotiation updates
    const subscription = supabase
      .channel(`negotiation-trainer-${sessionId}-${currentStage}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'negotiations', filter: `session_id=eq.${sessionId}` },
        () => {
          console.log('🔄 Negotiation update detected, reloading...')
          loadNegotiationData()
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'team_strategies', filter: `session_id=eq.${sessionId}` },
        () => {
          console.log('🔄 Team strategy update detected, reloading...')
          loadNegotiationData()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [loadNegotiationData])

  // Start negotiation
  const startNegotiation = async () => {
    setIsLoading(true)
    try {
      // Insert or update negotiation record
      const { error } = await supabase
        .from('negotiations')
        .upsert({
          session_id: sessionId,
          stage_number: currentStage,
          is_open: true,
          multiplier: 1.0
        }, {
          onConflict: 'session_id,stage_number'
        })

      if (error) throw error

      // Update session multiplier status
      await supabase
        .from('sessions')
        .update({ 
          multiplier_active: true,
          current_multiplier: 1.0 
        })
        .eq('id', sessionId)

      loadNegotiationData()
      onUpdate?.()
    } catch (err) {
      console.error('Error starting negotiation:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // End negotiation and calculate multiplier
  const endNegotiation = async () => {
    setIsLoading(true)
    try {
      // TODO: Implement actual alignment calculation based on decisions
      // For now, simulate alignment calculation
      const alignedTeams = Math.floor(Math.random() * 4) + 1 // Temporary simulation
      
      let multiplier = 1.0
      if (alignedTeams === 4) {
        multiplier = 2.0
      } else if (alignedTeams === 3) {
        multiplier = 1.5
      }

      // Update negotiation status
      const { error: negError } = await supabase
        .from('negotiations')
        .update({
          is_open: false,
          multiplier: multiplier
        })
        .eq('session_id', sessionId)
        .eq('stage_number', currentStage)

      if (negError) throw negError

      // Update session multiplier
      const { error: sessionError } = await supabase
        .from('sessions')
        .update({ 
          current_multiplier: multiplier,
          multiplier_active: multiplier > 1.0
        })
        .eq('id', sessionId)

      if (sessionError) throw sessionError

      loadNegotiationData()
      onUpdate?.()
    } catch (err) {
      console.error('Error ending negotiation:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Set specific multiplier manually
  const setMultiplier = async (multiplier: number) => {
    setIsLoading(true)
    try {
      // Update session multiplier
      const { error } = await supabase
        .from('sessions')
        .update({ 
          current_multiplier: multiplier,
          multiplier_active: multiplier > 1.0
        })
        .eq('id', sessionId)

      if (error) throw error

      // Update negotiation if exists
      if (negotiationStatus) {
        await supabase
          .from('negotiations')
          .update({ multiplier })
          .eq('session_id', sessionId)
          .eq('stage_number', currentStage)
      }

      loadNegotiationData()
      onUpdate?.()
    } catch (err) {
      console.error('Error setting multiplier:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isNegotiationStage) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <div className="text-center text-slate-500">
          <div className="text-2xl mb-2">🚴‍♂️</div>
          <div className="text-sm">
            Stage {currentStage} is not a negotiation stage
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Negotiation stages: 4, 7, 9
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-bold text-slate-900">🤝 Negotiation Controls</h4>
        <div className="text-sm text-slate-600">Stage {currentStage}</div>
      </div>

      {/* Current Status */}
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            negotiationStatus?.is_open 
              ? 'bg-yellow-100 text-yellow-800' 
              : 'bg-slate-100 text-slate-600'
          }`}>
            {negotiationStatus?.is_open ? '🟡 Negotiation Active' : '⚪ Negotiation Closed'}
          </div>
          <div className="text-lg font-bold text-slate-900">
            Multiplier: x{negotiationStatus?.multiplier?.toFixed(1) || '1.0'}
          </div>
        </div>
      </div>

      {/* Team Readiness Status */}
      {teamReadiness.length > 0 && (
        <div className="mb-6">
          <h5 className="font-medium text-slate-900 mb-3">Team Status ({teamReadiness.length} teams)</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {teamReadiness.map((team, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-2 bg-slate-50 rounded border"
              >
                <div className="text-sm">
                  <span className="font-medium">{team.team_name}</span>
                  <span className="text-slate-500 ml-1">({team.cyclist_name})</span>
                </div>
                <div className={`text-xs px-2 py-1 rounded ${
                  team.is_ready 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {team.is_ready ? '✅ Ready' : '⏳ Deciding'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="space-y-4">
        {!negotiationStatus?.is_open ? (
          <button
            onClick={startNegotiation}
            disabled={isLoading}
            className="w-full bg-yellow-600 text-white py-3 px-4 rounded-lg hover:bg-yellow-700 disabled:opacity-50 font-medium"
          >
            {isLoading ? 'Starting...' : '🚀 Start Negotiation Round'}
          </button>
        ) : (
          <button
            onClick={endNegotiation}
            disabled={isLoading}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
          >
            {isLoading ? 'Finalizing...' : '🏁 End Negotiation & Calculate Multiplier'}
          </button>
        )}

        {/* Manual Multiplier Controls */}
        <div className="border-t pt-4">
          <h5 className="font-medium text-slate-900 mb-3">Manual Multiplier Override</h5>
          <div className="flex space-x-2">
            <button
              onClick={() => setMultiplier(1.0)}
              disabled={isLoading}
              className="flex-1 bg-slate-200 text-slate-700 py-2 px-3 rounded hover:bg-slate-300 disabled:opacity-50 text-sm"
            >
              x1.0
            </button>
            <button
              onClick={() => setMultiplier(1.5)}
              disabled={isLoading}
              className="flex-1 bg-yellow-200 text-yellow-800 py-2 px-3 rounded hover:bg-yellow-300 disabled:opacity-50 text-sm"
            >
              x1.5
            </button>
            <button
              onClick={() => setMultiplier(2.0)}
              disabled={isLoading}
              className="flex-1 bg-green-200 text-green-800 py-2 px-3 rounded hover:bg-green-300 disabled:opacity-50 text-sm"
            >
              x2.0
            </button>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Use manual override to set multipliers directly
          </div>
        </div>
      </div>
    </div>
  )
}