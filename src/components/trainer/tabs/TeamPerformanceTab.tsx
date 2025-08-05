'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '@/lib/useTheme'
import { supabase } from '@/lib/supabase'

interface TeamStats {
  name: string
  type: string
  total_points: number
  synergy_score: number
  cyclists: {
    name: string
    current_points: number
    stamina: number
    character_role: string
  }[]
}

interface TeamPerformanceTabProps {
  sessionId: string
  currentStage: number
}

export default function TeamPerformanceTab({
  sessionId,
  currentStage
}: TeamPerformanceTabProps) {
  const theme = useTheme()
  const [teams, setTeams] = useState<TeamStats[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeView, setActiveView] = useState<'teams' | 'individuals' | 'summary'>('teams')

  const loadTeamStats = useCallback(async () => {
    if (!sessionId) return

    setIsLoading(true)
    try {
      console.log(`📊 Loading team performance for session ${sessionId}`)
      
      // Get teams with their cyclists
      const { data, error } = await supabase
        .from('teams')
        .select(`
          name,
          type,
          total_points,
          synergy_score,
          cyclists!team_id(
            name,
            current_points,
            stamina,
            character_role
          )
        `)
        .eq('session_id', sessionId)
        .order('total_points', { ascending: false })

      if (error) throw error

      setTeams(data || [])
    } catch (error) {
      console.error('Error loading team stats:', error)
      setTeams([])
    } finally {
      setIsLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    loadTeamStats()
  }, [loadTeamStats])

  const getTeamEmoji = (teamType: string) => {
    switch (teamType) {
      case 'rubicon': return '🔴'
      case 'solaris': return '🟡'
      case 'corex': return '🔵'
      case 'vortex': return '🟣'
      default: return '⚪'
    }
  }

  const getCyclistEmoji = (role: string) => {
    switch (role) {
      case 'luca': return '🏃‍♂️'
      case 'jonas': return '⛰️'
      case 'mateo': return '🎯'
      case 'kenji': return '🚴‍♂️'
      default: return '🚴‍♂️'
    }
  }

  const renderTeamsView = () => (
    <div className="space-y-4">
      {teams.map((team, index) => (
        <div 
          key={team.name}
          className="rounded-lg border p-6"
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.accent + '20'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getTeamEmoji(team.type)}</span>
              <div>
                <h4 
                  className="text-lg font-bold flex items-center space-x-2"
                  style={{
                    color: theme.colors.text,
                    fontFamily: theme.fonts.primary
                  }}
                >
                  <span>{team.name}</span>
                  {index === 0 && <span className="text-yellow-500">👑</span>}
                </h4>
                <p 
                  className="text-sm"
                  style={{
                    color: theme.colors.text + '70',
                    fontFamily: theme.fonts.primary
                  }}
                >
                  Rank #{index + 1}
                </p>
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
                {team.total_points}
              </div>
              <div 
                className="text-sm"
                style={{
                  color: theme.colors.text + '70',
                  fontFamily: theme.fonts.primary
                }}
              >
                points
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div 
                className="text-sm font-medium mb-2"
                style={{
                  color: theme.colors.text + '80',
                  fontFamily: theme.fonts.primary
                }}
              >
                Team Synergy
              </div>
              <div className="flex items-center space-x-2">
                <div 
                  className="flex-1 h-2 rounded-full"
                  style={{ backgroundColor: theme.colors.accent + '20' }}
                >
                  <div 
                    className="h-2 rounded-full"
                    style={{
                      width: `${Math.min(team.synergy_score, 100)}%`,
                      backgroundColor: team.synergy_score >= 70 
                        ? theme.colors.primary 
                        : team.synergy_score >= 40 
                        ? theme.colors.alert 
                        : theme.colors.alert
                    }}
                  ></div>
                </div>
                <span 
                  className="text-sm font-medium"
                  style={{
                    color: theme.colors.text,
                    fontFamily: theme.fonts.primary
                  }}
                >
                  {Math.round(team.synergy_score)}%
                </span>
              </div>
            </div>
            
            <div>
              <div 
                className="text-sm font-medium mb-2"
                style={{
                  color: theme.colors.text + '80',
                  fontFamily: theme.fonts.primary
                }}
              >
                Average Points
              </div>
              <div 
                className="text-lg font-bold"
                style={{
                  color: theme.colors.primary,
                  fontFamily: theme.fonts.primary
                }}
              >
                {team.cyclists.length > 0 
                  ? Math.round(team.cyclists.reduce((sum, c) => sum + c.current_points, 0) / team.cyclists.length)
                  : 0
                }
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderIndividualsView = () => {
    const allCyclists = teams.flatMap(team => 
      team.cyclists.map(cyclist => ({
        ...cyclist,
        teamName: team.name,
        teamType: team.type
      }))
    ).sort((a, b) => b.current_points - a.current_points)

    return (
      <div 
        className="rounded-lg border overflow-hidden"
        style={{
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.accent + '20'
        }}
      >
        {/* Header */}
        <div 
          className="grid grid-cols-5 gap-4 p-4 border-b text-sm font-medium"
          style={{
            backgroundColor: theme.colors.primary + '10',
            borderColor: theme.colors.accent + '20',
            color: theme.colors.text,
            fontFamily: theme.fonts.primary
          }}
        >
          <div>Rank</div>
          <div>Cyclist</div>
          <div>Team</div>
          <div>Points</div>
          <div>Stamina</div>
        </div>

        {/* Rows */}
        {allCyclists.map((cyclist, index) => (
          <div 
            key={`${cyclist.teamName}-${cyclist.name}`}
            className={`grid grid-cols-5 gap-4 p-4 text-sm ${
              index < allCyclists.length - 1 ? 'border-b' : ''
            }`}
            style={{
              borderColor: theme.colors.accent + '10',
              color: theme.colors.text,
              fontFamily: theme.fonts.primary
            }}
          >
            <div className="flex items-center space-x-2">
              <span className="font-bold">#{index + 1}</span>
              {index === 0 && <span className="text-yellow-500">👑</span>}
            </div>
            
            <div className="flex items-center space-x-2">
              <span>{getCyclistEmoji(cyclist.character_role)}</span>
              <span className="font-medium">{cyclist.name}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span>{getTeamEmoji(cyclist.teamType)}</span>
              <span>{cyclist.teamName}</span>
            </div>
            
            <div 
              className="font-bold"
              style={{ color: theme.colors.primary }}
            >
              {cyclist.current_points}
            </div>
            
            <div className="flex items-center space-x-1">
              <span>⚡</span>
              <span>{cyclist.stamina}/5</span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderSummaryView = () => {
    const totalPoints = teams.reduce((sum, team) => sum + team.total_points, 0)
    const avgSynergy = teams.length > 0 
      ? teams.reduce((sum, team) => sum + team.synergy_score, 0) / teams.length 
      : 0
    const topTeam = teams[0]
    const totalCyclists = teams.reduce((sum, team) => sum + team.cyclists.length, 0)

    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Points', value: totalPoints, icon: '🏆' },
            { label: 'Avg Synergy', value: Math.round(avgSynergy) + '%', icon: '🤝' },
            { label: 'Leading Team', value: topTeam?.name || 'None', icon: '👑' },
            { label: 'Active Cyclists', value: totalCyclists, icon: '🚴‍♂️' }
          ].map((metric) => (
            <div 
              key={metric.label}
              className="p-4 rounded-lg border text-center"
              style={{
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.accent + '20'
              }}
            >
              <div className="text-2xl mb-2">{metric.icon}</div>
              <div 
                className="text-lg font-bold"
                style={{
                  color: theme.colors.primary,
                  fontFamily: theme.fonts.primary
                }}
              >
                {metric.value}
              </div>
              <div 
                className="text-sm"
                style={{
                  color: theme.colors.text + '70',
                  fontFamily: theme.fonts.primary
                }}
              >
                {metric.label}
              </div>
            </div>
          ))}
        </div>

        {/* Team Comparison Chart */}
        <div 
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.accent + '20'
          }}
        >
          <h4 
            className="text-lg font-bold mb-4"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.primary
            }}
          >
            📊 Team Comparison
          </h4>
          
          <div className="space-y-3">
            {teams.map((team) => (
              <div key={team.name} className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 w-32">
                  <span>{getTeamEmoji(team.type)}</span>
                  <span 
                    className="font-medium text-sm"
                    style={{
                      color: theme.colors.text,
                      fontFamily: theme.fonts.primary
                    }}
                  >
                    {team.name}
                  </span>
                </div>
                
                <div className="flex-1 flex items-center space-x-4">
                  <div className="flex-1">
                    <div 
                      className="h-6 rounded-full flex items-center px-3"
                      style={{
                        backgroundColor: theme.colors.primary + '20',
                        width: `${Math.max((team.total_points / (topTeam?.total_points || 1)) * 100, 10)}%`
                      }}
                    >
                      <span 
                        className="text-xs font-bold"
                        style={{
                          color: theme.colors.primary,
                          fontFamily: theme.fonts.primary
                        }}
                      >
                        {team.total_points}
                      </span>
                    </div>
                  </div>
                  
                  <div 
                    className="text-sm w-12 text-right"
                    style={{
                      color: theme.colors.text + '70',
                      fontFamily: theme.fonts.primary
                    }}
                  >
                    {Math.round(team.synergy_score)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
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
          📊 Team Performance
        </h3>
        
        <div 
          className="text-sm px-3 py-1 rounded-full"
          style={{
            backgroundColor: theme.colors.card,
            color: theme.colors.text + '80',
            fontFamily: theme.fonts.primary,
            border: `1px solid ${theme.colors.accent}20`
          }}
        >
          Through Stage {currentStage}
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex space-x-4 mb-6">
        {[
          { key: 'teams', label: '🏆 Team Stats', icon: '🏆' },
          { key: 'individuals', label: '🚴‍♂️ Individual Rankings', icon: '🚴‍♂️' },
          { key: 'summary', label: '📈 Summary', icon: '📈' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveView(tab.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeView === tab.key ? '' : 'hover:opacity-75'
            }`}
            style={{
              backgroundColor: activeView === tab.key 
                ? theme.colors.primary 
                : theme.colors.card,
              color: activeView === tab.key 
                ? theme.colors.background 
                : theme.colors.text,
              border: `1px solid ${theme.colors.accent}30`,
              fontFamily: theme.fonts.primary
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div 
            className="animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderColor: theme.colors.primary }}
          ></div>
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🏁</div>
          <p 
            style={{
              color: theme.colors.text + '70',
              fontFamily: theme.fonts.primary
            }}
          >
            No team data available yet.
          </p>
        </div>
      ) : (
        <>
          {activeView === 'teams' && renderTeamsView()}
          {activeView === 'individuals' && renderIndividualsView()}
          {activeView === 'summary' && renderSummaryView()}
        </>
      )}
    </div>
  )
}