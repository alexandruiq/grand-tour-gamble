'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface PlayerDecisionStatusProps {
  sessionId: string
  currentStage: number
  stageOpen: boolean
}

interface PlayerDecision {
  cyclist_name: string
  team_name: string
  decision: 'sprint' | 'cruise' | null
  confirmed: boolean
}

export default function PlayerDecisionStatus({ 
  sessionId, 
  currentStage, 
  stageOpen 
}: PlayerDecisionStatusProps) {
  const [playerDecisions, setPlayerDecisions] = useState<PlayerDecision[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadPlayerDecisions = useCallback(async () => {
    if (!sessionId) return

    setIsLoading(true)
    try {
      console.log(`🔍 Loading decisions for session ${sessionId}, stage ${currentStage}`)
      
      // Get all cyclists in this session
      const { data: cyclists, error: cyclistsError } = await supabase
        .from('cyclist_codes')
        .select('cyclist_name, team_name')
        .eq('session_id', sessionId)
        .not('team_name', 'is', null)

      if (cyclistsError) throw cyclistsError

      // Get decisions for current stage
      const { data: decisions, error: decisionsError } = await supabase
        .from('decisions_log')
        .select('cyclist_id, decision, cyclists(name)')
        .eq('session_id', sessionId)
        .eq('stage_number', currentStage)

      if (decisionsError) throw decisionsError

      console.log(`📊 Found ${cyclists.length} cyclists, ${decisions?.length || 0} decisions`)

      // Combine cyclist info with their decisions
      const playerStatus: PlayerDecision[] = cyclists.map(cyclist => {
        const decision = decisions?.find(d => 
          (d.cyclists as any)?.name === cyclist.cyclist_name
        )
        
        return {
          cyclist_name: cyclist.cyclist_name,
          team_name: cyclist.team_name,
          decision: decision?.decision || null,
          confirmed: !!decision
        }
      })

      setPlayerDecisions(playerStatus)
    } catch (error) {
      console.error('Error loading player decisions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, currentStage])

  useEffect(() => {
    loadPlayerDecisions()

    // Set up real-time subscription for decision updates (always active)
    const subscription = supabase
      .channel(`decision-status-${sessionId}-${currentStage}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'decisions_log', filter: `session_id=eq.${sessionId}` },
        () => {
          console.log('🔄 Decision update detected, reloading...')
          loadPlayerDecisions()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [loadPlayerDecisions])

  if (!stageOpen) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          👥 Player Decision Status
        </h3>
        <div className="text-center text-gray-500">
          Stage is closed - no decisions being made
        </div>
      </div>
    )
  }

  const confirmedCount = playerDecisions.filter(p => p.confirmed).length
  const totalCount = playerDecisions.length
  const allConfirmed = confirmedCount === totalCount && totalCount > 0

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          👥 Player Decision Status
        </h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          allConfirmed 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {confirmedCount}/{totalCount} Confirmed
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-2">
          {playerDecisions.map((player, index) => (
            <div 
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                player.confirmed 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div>
                <div className="font-medium text-gray-900">
                  {player.cyclist_name}
                </div>
                <div className="text-sm text-gray-600">
                  {player.team_name}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {player.confirmed ? (
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      player.decision === 'sprint' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {player.decision === 'sprint' ? '🚀 Sprint' : '🛡️ Cruise'}
                    </span>
                    <span className="text-green-600 font-medium">✅</span>
                  </div>
                ) : (
                  <span className="text-gray-400 text-sm">
                    ⏳ Deciding...
                  </span>
                )}
              </div>
            </div>
          ))}
          
          {playerDecisions.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No players found for this session
            </div>
          )}
        </div>
      )}

      {allConfirmed && (
        <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg">
          <div className="text-green-800 font-medium text-center">
            🎉 All players have confirmed their decisions!
          </div>
          <div className="text-green-600 text-sm text-center mt-1">
            Ready to end the stage and process results
          </div>
        </div>
      )}
    </div>
  )
}