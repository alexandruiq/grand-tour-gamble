'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '@/lib/useTheme'
import { supabase } from '@/lib/supabase'

interface CyclistResult {
  id: string
  name: string
  character_role: string
  final_points: number
  final_stamina: number
  team_name: string
  decisions_made: number
  sprint_count: number
  cruise_count: number
}

interface TeamResult {
  team_name: string
  total_points: number
  final_synergy: number
  cyclists: CyclistResult[]
  avg_points_per_cyclist: number
}

interface GameSummary {
  total_stages: number
  total_players: number
  total_teams: number
  game_duration: string
  session_title: string
  session_status: string
}

interface DebriefTabProps {
  sessionId: string
  currentStage: number
  sessionStatus: string
}

export default function DebriefTab({
  sessionId,
  currentStage,
  sessionStatus
}: DebriefTabProps) {
  const theme = useTheme()
  const [teamResults, setTeamResults] = useState<TeamResult[]>([])
  const [gameSummary, setGameSummary] = useState<GameSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const isGameEnded = sessionStatus === 'ended'

  const loadDebriefData = useCallback(async () => {
    if (!isGameEnded) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      console.log(`🔍 Loading debrief data for session ${sessionId}`)
      
      // Get session info
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('title, status, created_at, current_stage')
        .eq('id', sessionId)
        .single()

      if (sessionError) throw sessionError

      // Get teams with cyclists
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          total_points,
          synergy_score,
          cyclists!team_id (
            id,
            name,
            character_role,
            current_points,
            stamina
          )
        `)
        .eq('session_id', sessionId)

      if (teamsError) throw teamsError

      // Get cyclist codes for team names
      const { data: cyclistCodes, error: codesError } = await supabase
        .from('cyclist_codes')
        .select('cyclist_id, cyclist_name, team_name')
        .eq('session_id', sessionId)

      if (codesError) throw codesError

      // Get decision counts
      const { data: decisionsData, error: decisionsError } = await supabase
        .from('decisions_log')
        .select('cyclist_id, decision')
        .eq('session_id', sessionId)

      if (decisionsError) throw decisionsError

      // Process the data
      const decisionCounts = decisionsData?.reduce((acc, decision) => {
        if (!acc[decision.cyclist_id]) {
          acc[decision.cyclist_id] = { total: 0, sprint: 0, cruise: 0 }
        }
        acc[decision.cyclist_id].total++
        if (decision.decision === 'sprint') {
          acc[decision.cyclist_id].sprint++
        } else {
          acc[decision.cyclist_id].cruise++
        }
        return acc
      }, {} as Record<string, { total: number, sprint: number, cruise: number }>) || {}

      // Create team results
      const processedTeams: TeamResult[] = []
      
      // Group cyclists by team using cyclist_codes
      const teamGroups = new Map<string, CyclistResult[]>()
      
      cyclistCodes?.forEach(code => {
        if (code.team_name && code.team_name.trim() !== '') {
          if (!teamGroups.has(code.team_name)) {
            teamGroups.set(code.team_name, [])
          }
          
          // Find corresponding cyclist data
          const cyclist = teamsData?.flatMap(team => team.cyclists).find(c => c.id === code.cyclist_id)
          if (cyclist) {
            const decisions = decisionCounts[cyclist.id] || { total: 0, sprint: 0, cruise: 0 }
            teamGroups.get(code.team_name)!.push({
              id: cyclist.id,
              name: code.cyclist_name,
              character_role: cyclist.character_role,
              final_points: cyclist.current_points,
              final_stamina: cyclist.stamina,
              team_name: code.team_name,
              decisions_made: decisions.total,
              sprint_count: decisions.sprint,
              cruise_count: decisions.cruise
            })
          }
        }
      })

      // Convert to team results
      teamGroups.forEach((cyclists, teamName) => {
        const totalPoints = cyclists.reduce((sum, c) => sum + c.final_points, 0)
        const avgPoints = cyclists.length > 0 ? totalPoints / cyclists.length : 0
        
        // Try to find synergy from teams table
        const teamData = teamsData?.find(t => 
          t.cyclists.some(c => cyclists.some(cyclist => cyclist.id === c.id))
        )
        
        processedTeams.push({
          team_name: teamName,
          total_points: totalPoints,
          final_synergy: teamData?.synergy_score || 100,
          cyclists: cyclists.sort((a, b) => b.final_points - a.final_points),
          avg_points_per_cyclist: Math.round(avgPoints * 10) / 10
        })
      })

      // Sort teams by total points
      processedTeams.sort((a, b) => b.total_points - a.total_points)

      setTeamResults(processedTeams)

      // Set game summary
      const gameStart = new Date(sessionData.created_at)
      const gameEnd = new Date()
      const duration = Math.round((gameEnd.getTime() - gameStart.getTime()) / (1000 * 60))
      
      setGameSummary({
        total_stages: currentStage,
        total_players: cyclistCodes?.length || 0,
        total_teams: processedTeams.length,
        game_duration: `${duration} minutes`,
        session_title: sessionData.title,
        session_status: sessionData.status
      })

      console.log(`✅ Loaded debrief data for ${processedTeams.length} teams`)
    } catch (error) {
      console.error('Error loading debrief data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load debrief data')
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, isGameEnded, currentStage])

  useEffect(() => {
    loadDebriefData()
  }, [loadDebriefData])

  if (!isGameEnded) {
    return (
      <div 
        className="p-6 text-center"
        style={{
          backgroundColor: theme.colors.background,
          color: theme.colors.text,
          fontFamily: theme.fonts.primary
        }}
      >
        <div className="text-4xl mb-4">🏁</div>
        <h3 className="text-xl font-bold mb-2">Game In Progress</h3>
        <p className="text-sm" style={{ color: theme.colors.text + '70' }}>
          The debrief will be available when the game ends (after stage 10)
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div 
        className="p-6 text-center"
        style={{
          backgroundColor: theme.colors.background,
          color: theme.colors.text,
          fontFamily: theme.fonts.primary
        }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" 
             style={{ borderColor: theme.colors.primary }}></div>
        <p>Loading debrief data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div 
        className="p-6 text-center"
        style={{
          backgroundColor: theme.colors.background,
          color: theme.colors.alert,
          fontFamily: theme.fonts.primary
        }}
      >
        <div className="text-4xl mb-4">❌</div>
        <h3 className="text-lg font-bold mb-2">Error Loading Debrief</h3>
        <p className="mb-4">{error}</p>
        <button
          onClick={loadDebriefData}
          className="px-4 py-2 rounded-lg transition-all"
          style={{
            backgroundColor: theme.colors.primary,
            color: theme.colors.background
          }}
        >
          Try Again
        </button>
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
      {/* Header */}
      <div className="mb-6">
        <h3 
          className="text-xl font-bold mb-2"
          style={{
            color: theme.colors.text,
            fontFamily: theme.fonts.primary,
            fontWeight: theme.fonts.headingWeight
          }}
        >
          🏆 Game Debrief & Results
        </h3>
        <p 
          className="text-sm"
          style={{
            color: theme.colors.text + '70',
            fontFamily: theme.fonts.primary
          }}
        >
          Final results and comprehensive analysis for all players and teams
        </p>
      </div>

      {/* Game Summary */}
      {gameSummary && (
        <div 
          className="mb-6 p-4 rounded-lg border"
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.accent + '30'
          }}
        >
          <h4 
            className="font-bold mb-3"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.primary
            }}
          >
            📊 Game Summary
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div style={{ color: theme.colors.text + '60', fontFamily: theme.fonts.primary }}>
                Total Stages
              </div>
              <div style={{ color: theme.colors.text, fontFamily: theme.fonts.primary }} className="font-bold">
                {gameSummary.total_stages}
              </div>
            </div>
            <div>
              <div style={{ color: theme.colors.text + '60', fontFamily: theme.fonts.primary }}>
                Total Players
              </div>
              <div style={{ color: theme.colors.text, fontFamily: theme.fonts.primary }} className="font-bold">
                {gameSummary.total_players}
              </div>
            </div>
            <div>
              <div style={{ color: theme.colors.text + '60', fontFamily: theme.fonts.primary }}>
                Teams
              </div>
              <div style={{ color: theme.colors.text, fontFamily: theme.fonts.primary }} className="font-bold">
                {gameSummary.total_teams}
              </div>
            </div>
            <div>
              <div style={{ color: theme.colors.text + '60', fontFamily: theme.fonts.primary }}>
                Duration
              </div>
              <div style={{ color: theme.colors.text, fontFamily: theme.fonts.primary }} className="font-bold">
                {gameSummary.game_duration}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Results */}
      <div className="space-y-6">
        {teamResults.map((team, index) => (
          <div 
            key={team.team_name}
            className="rounded-lg border p-4"
            style={{
              backgroundColor: theme.colors.card,
              borderColor: index === 0 ? theme.colors.primary + '50' : theme.colors.accent + '30',
              borderWidth: index === 0 ? '2px' : '1px'
            }}
          >
            {/* Team Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏁'}
                </span>
                <div>
                  <h4 
                    className="font-bold text-lg"
                    style={{
                      color: theme.colors.text,
                      fontFamily: theme.fonts.primary
                    }}
                  >
                    {team.team_name}
                  </h4>
                  <div 
                    className="text-sm"
                    style={{
                      color: theme.colors.text + '70',
                      fontFamily: theme.fonts.primary
                    }}
                  >
                    Rank #{index + 1} • {team.cyclists.length} cyclists
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div 
                  className="text-2xl font-bold"
                  style={{
                    color: theme.colors.primary,
                    fontFamily: theme.fonts.primary
                  }}
                >
                  {team.total_points} pts
                </div>
                <div 
                  className="text-sm"
                  style={{
                    color: theme.colors.text + '60',
                    fontFamily: theme.fonts.primary
                  }}
                >
                  Avg: {team.avg_points_per_cyclist} • Synergy: {Math.round(team.final_synergy)}%
                </div>
              </div>
            </div>

            {/* Cyclists */}
            <div className="grid gap-3">
              {team.cyclists.map((cyclist) => (
                <div 
                  key={cyclist.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.accent + '20'
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">🚴‍♂️</span>
                    <div>
                      <div 
                        className="font-medium"
                        style={{
                          color: theme.colors.text,
                          fontFamily: theme.fonts.primary
                        }}
                      >
                        {cyclist.name}
                      </div>
                      <div 
                        className="text-xs"
                        style={{
                          color: theme.colors.text + '70',
                          fontFamily: theme.fonts.primary
                        }}
                      >
                        {cyclist.character_role}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div 
                      className="font-bold"
                      style={{
                        color: theme.colors.primary,
                        fontFamily: theme.fonts.primary
                      }}
                    >
                      {cyclist.final_points} pts
                    </div>
                    <div 
                      className="text-xs flex items-center space-x-2"
                      style={{
                        color: theme.colors.text + '60',
                        fontFamily: theme.fonts.primary
                      }}
                    >
                      <span>⚡ {cyclist.final_stamina}/5</span>
                      <span>🚀 {cyclist.sprint_count}</span>
                      <span>🛡️ {cyclist.cruise_count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {teamResults.length === 0 && (
        <div 
          className="text-center py-12"
          style={{
            color: theme.colors.text + '60',
            fontFamily: theme.fonts.primary
          }}
        >
          <div className="text-4xl mb-4">📊</div>
          <p>No team results available</p>
        </div>
      )}
    </div>
  )
}