'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '@/lib/useTheme'
import { supabase } from '@/lib/supabase'

interface PlayerDecision {
  cyclist_id: string
  cyclist_name: string
  team_name: string
  decision: 'sprint' | 'cruise'
  points_earned: number
  stamina_change: number
}

interface PlayerDecisionsTabProps {
  sessionId: string
  currentStage: number
  stageOpen: boolean
}

export default function PlayerDecisionsTab({
  sessionId,
  currentStage,
  stageOpen
}: PlayerDecisionsTabProps) {
  const theme = useTheme()
  const [decisions, setDecisions] = useState<PlayerDecision[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadDecisions = useCallback(async () => {
    if (!sessionId || stageOpen) return // Only load after stage ends

    setIsLoading(true)
    try {
      console.log(`🔍 Loading decisions for ended stage ${currentStage}`)
      
      // Get decisions with cyclist info
      const { data: decisionsData, error: decisionsError } = await supabase
        .from('decisions_log')
        .select(`
          cyclist_id,
          decision,
          points_earned,
          cyclists!inner(name)
        `)
        .eq('session_id', sessionId)
        .eq('stage_number', currentStage)
        .order('points_earned', { ascending: false })

      if (decisionsError) throw decisionsError

      // Get cyclist codes for team names
      const { data: cyclistCodesData, error: codesError } = await supabase
        .from('cyclist_codes')
        .select('cyclist_id, cyclist_name, team_name')
        .eq('session_id', sessionId)

      if (codesError) throw codesError

      // Create a map of cyclist_id to team info
      const cyclistInfo = new Map(
        cyclistCodesData?.map(code => [
          code.cyclist_id, 
          { cyclist_name: code.cyclist_name, team_name: code.team_name }
        ]) || []
      )

      const formattedDecisions: PlayerDecision[] = decisionsData?.map((d: any) => {
        const info = cyclistInfo.get(d.cyclist_id)
        // Calculate stamina change based on decision type
        const staminaChange = d.decision === 'sprint' ? -1 : 1
        
        return {
          cyclist_id: d.cyclist_id,
          cyclist_name: info?.cyclist_name || d.cyclists?.name || 'Unknown',
          team_name: info?.team_name || 'Unknown',
          decision: d.decision,
          points_earned: d.points_earned || 0,
          stamina_change: staminaChange
        }
      }) || []

      setDecisions(formattedDecisions)
    } catch (error) {
      console.error('Error loading decisions:', error)
      setDecisions([])
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, currentStage, stageOpen])

  useEffect(() => {
    loadDecisions()
  }, [loadDecisions])

  const getDecisionIcon = (decision: string) => {
    return decision === 'sprint' ? '🚀' : '🛡️'
  }

  const getTeamEmoji = (teamName: string) => {
    switch (teamName.toLowerCase()) {
      case 'rubicon': return '🔴'
      case 'solaris': return '🟡'
      case 'corex': return '🔵'
      case 'vortex': return '🟣'
      default: return '⚪'
    }
  }

  if (stageOpen) {
    return (
      <div 
        className="p-6"
        style={{
          backgroundColor: theme.colors.background
        }}
      >
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔒</div>
          <h3 
            className="text-xl font-bold mb-2"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.primary
            }}
          >
            Decisions Hidden
          </h3>
          <p 
            className="text-sm"
            style={{
              color: theme.colors.text + '70',
              fontFamily: theme.fonts.primary
            }}
          >
            Player decisions will be revealed after Stage {currentStage} ends.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="p-6"
      style={{
        backgroundColor: theme.colors.background
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 
          className="text-xl font-bold"
          style={{
            color: theme.colors.text,
            fontFamily: theme.fonts.primary,
            fontWeight: theme.fonts.headingWeight
          }}
        >
          👁️ Stage {currentStage} Decisions
        </h3>
        
        <div 
          className="text-sm px-3 py-1 rounded-full"
          style={{
            backgroundColor: theme.colors.primary + '20',
            color: theme.colors.primary,
            fontFamily: theme.fonts.primary
          }}
        >
          Revealed • Stage Ended
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div 
            className="animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderColor: theme.colors.primary }}
          ></div>
        </div>
      ) : decisions.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🚴‍♂️</div>
          <p 
            style={{
              color: theme.colors.text + '70',
              fontFamily: theme.fonts.primary
            }}
          >
            No decisions found for this stage.
          </p>
        </div>
      ) : (
        <div 
          className="rounded-lg border overflow-hidden"
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.accent + '20'
          }}
        >
          {/* Table Header */}
          <div 
            className="grid grid-cols-6 gap-4 p-4 border-b text-sm font-medium"
            style={{
              backgroundColor: theme.colors.primary + '10',
              borderColor: theme.colors.accent + '20',
              color: theme.colors.text,
              fontFamily: theme.fonts.primary
            }}
          >
            <div>Team</div>
            <div>Cyclist</div>
            <div>Decision</div>
            <div>Points</div>
            <div>Stamina</div>
            <div>Result</div>
          </div>

          {/* Table Rows */}
          {decisions.map((decision, index) => (
            <div 
              key={decision.cyclist_id}
              className={`grid grid-cols-6 gap-4 p-4 text-sm ${
                index < decisions.length - 1 ? 'border-b' : ''
              }`}
              style={{
                borderColor: theme.colors.accent + '10',
                color: theme.colors.text,
                fontFamily: theme.fonts.primary
              }}
            >
              <div className="flex items-center space-x-2">
                <span>{getTeamEmoji(decision.team_name)}</span>
                <span className="font-medium">{decision.team_name}</span>
              </div>
              
              <div className="font-medium">{decision.cyclist_name}</div>
              
              <div className="flex items-center space-x-2">
                <span>{getDecisionIcon(decision.decision)}</span>
                <span className="capitalize font-medium">{decision.decision}</span>
              </div>
              
              <div 
                className="font-bold"
                style={{
                  color: decision.points_earned >= 0 
                    ? theme.colors.primary 
                    : theme.colors.alert
                }}
              >
                {decision.points_earned >= 0 ? '+' : ''}{decision.points_earned}
              </div>
              
              <div 
                className="font-medium"
                style={{
                  color: decision.stamina_change >= 0 
                    ? theme.colors.primary 
                    : theme.colors.alert
                }}
              >
                {decision.stamina_change >= 0 ? '+' : ''}{decision.stamina_change}
              </div>
              
              <div className="flex items-center space-x-1">
                {decision.points_earned > 0 && <span>🏆</span>}
                {decision.stamina_change > 0 && <span>⚡</span>}
                {decision.points_earned < 0 && <span>⚠️</span>}
                {decision.stamina_change < 0 && <span>🔋</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {decisions.length > 0 && (
        <div 
          className="mt-6 p-4 rounded-lg border"
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.accent + '20'
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div 
                className="text-lg font-bold"
                style={{
                  color: theme.colors.primary,
                  fontFamily: theme.fonts.primary
                }}
              >
                🚀 {decisions.filter(d => d.decision === 'sprint').length}
              </div>
              <div 
                style={{
                  color: theme.colors.text + '70',
                  fontFamily: theme.fonts.primary
                }}
              >
                Sprinted
              </div>
            </div>
            
            <div className="text-center">
              <div 
                className="text-lg font-bold"
                style={{
                  color: theme.colors.primary,
                  fontFamily: theme.fonts.primary
                }}
              >
                🛡️ {decisions.filter(d => d.decision === 'cruise').length}
              </div>
              <div 
                style={{
                  color: theme.colors.text + '70',
                  fontFamily: theme.fonts.primary
                }}
              >
                Cruised
              </div>
            </div>
            
            <div className="text-center">
              <div 
                className="text-lg font-bold"
                style={{
                  color: theme.colors.primary,
                  fontFamily: theme.fonts.primary
                }}
              >
                {Math.round(decisions.reduce((sum, d) => sum + d.points_earned, 0) / decisions.length)}
              </div>
              <div 
                style={{
                  color: theme.colors.text + '70',
                  fontFamily: theme.fonts.primary
                }}
              >
                Avg Points
              </div>
            </div>
            
            <div className="text-center">
              <div 
                className="text-lg font-bold"
                style={{
                  color: theme.colors.primary,
                  fontFamily: theme.fonts.primary
                }}
              >
                {Math.round(decisions.reduce((sum, d) => sum + d.stamina_change, 0) / decisions.length * 10) / 10}
              </div>
              <div 
                style={{
                  color: theme.colors.text + '70',
                  fontFamily: theme.fonts.primary
                }}
              >
                Avg Stamina
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}