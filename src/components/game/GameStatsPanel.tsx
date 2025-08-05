'use client'

import { useState, useEffect } from 'react'
import { useGame } from '@/context/GameContext'
import { supabase } from '@/lib/supabase'
import { Team, Cyclist } from '@/types/game.types'
import { GAME_CONSTANTS, TEAM_TYPES, STAGE_MULTIPLIERS } from '@/lib/constants'
import { useTheme } from '@/lib/useTheme'
import Tooltip from '@/components/ui/Tooltip'
import StaminaBar from './StaminaBar'

interface GameStatsPanelProps {
  className?: string
}

interface TeamWithCyclists extends Team {
  cyclists: Cyclist[]
}

export default function GameStatsPanel({ className = '' }: GameStatsPanelProps) {
  const [activeTab, setActiveTab] = useState<'performance' | 'teams' | 'individuals'>('performance')
  const [allTeams, setAllTeams] = useState<TeamWithCyclists[]>([])
  const [allCyclists, setAllCyclists] = useState<Cyclist[]>([])
  const [loading, setLoading] = useState(true)
  const { state } = useGame()
  const theme = useTheme()

  useEffect(() => {
    if (!state.session || activeTab === 'performance') return

    const fetchScoreboardData = async () => {
      try {
        // Fetch teams with cyclists
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select(`
            *,
            cyclists (*)
          `)
          .eq('session_id', state.session!.id)
          .order('total_points', { ascending: false })

        if (teamsError) throw teamsError

        // Get team IDs for this session first
        const teamIds = teamsData?.map(team => team.id) || []
        
        // Fetch all cyclists for individual leaderboard (filter by team_id)
        const { data: cyclistsData, error: cyclistsError } = await supabase
          .from('cyclists')
          .select(`
            *,
            teams (name, type, session_id)
          `)
          .in('team_id', teamIds)
          .order('current_points', { ascending: false })

        if (cyclistsError) throw cyclistsError

        setAllTeams(teamsData || [])
        setAllCyclists(cyclistsData || [])
      } catch (error) {
        console.error('Error fetching scoreboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchScoreboardData()
  }, [state.session, activeTab])

  if (!state.currentCyclist || !state.session || !state.team) {
    return (
      <div className={`card ${className}`}>
        <div className="text-center text-gray-500">
          Loading stats...
        </div>
      </div>
    )
  }

  const cyclist = state.currentCyclist
  const session = state.session
  const team = state.team
  
  // Calculate current stage multiplier for display
  const currentStage = session?.current_stage || 1
  const isNegotiationStage = [4, 7, 10].includes(currentStage)
  const multiplier = isNegotiationStage 
    ? STAGE_MULTIPLIERS[currentStage as keyof typeof STAGE_MULTIPLIERS] || STAGE_MULTIPLIERS.default
    : 1.0

  const renderPerformanceTab = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 items-stretch">
        {/* Current Points */}
        <Tooltip content="Total points earned across all stages - includes base points plus any multiplier bonuses">
          <div 
            className="p-4 text-center transition-all duration-200 hover:shadow-md h-full"
            style={{
              backgroundColor: theme.colors.primary + '10',
              borderRadius: theme.borders.radius,
              border: `1px solid ${theme.colors.primary}20`
            }}
          >
            <div 
              className="text-2xl font-bold mb-1"
              style={{ 
                color: theme.colors.primary,
                fontWeight: theme.fonts.headingWeight 
              }}
            >
              {cyclist.current_points}
            </div>
            <div 
              className="text-sm flex items-center justify-center gap-1"
              style={{ 
                color: theme.colors.text + '80',
                fontFamily: theme.fonts.primary 
              }}
            >
              Total Points 🏆
            </div>
          </div>
        </Tooltip>

        {/* Team Points */}
        <Tooltip content="Total points earned by your team across all stages">
          <div 
            className="p-4 text-center transition-all duration-200 hover:shadow-md h-full"
            style={{
              backgroundColor: theme.colors.accent + '10',
              borderRadius: theme.borders.radius,
              border: `1px solid ${theme.colors.accent}20`
            }}
          >
            <div 
              className="text-2xl font-bold mb-1"
              style={{ 
                color: theme.colors.accent,
                fontWeight: theme.fonts.headingWeight 
              }}
            >
              {team.total_points}
            </div>
            <div 
              className="text-sm flex items-center justify-center gap-1"
              style={{ 
                color: theme.colors.text + '80',
                fontFamily: theme.fonts.primary 
              }}
            >
              Team Points 🏆
            </div>
          </div>
        </Tooltip>

        {/* Team Synergy */}
        <Tooltip content="Team coordination level - when ≥50%, cruising recovers stamina">
          <div 
            className="p-4 text-center transition-all duration-200 hover:shadow-md h-full"
            style={{
              backgroundColor: '#22c55e10',
              borderRadius: theme.borders.radius,
              border: '1px solid #22c55e20'
            }}
          >
            <div 
              className="text-2xl font-bold mb-1"
              style={{ 
                color: '#16a34a',
                fontWeight: theme.fonts.headingWeight 
              }}
            >
              {Math.round(team.synergy_score)}%
            </div>
            <div 
              className="text-sm flex items-center justify-center gap-1"
              style={{ 
                color: theme.colors.text + '80',
                fontFamily: theme.fonts.primary 
              }}
            >
              Team Synergy 🤝
            </div>
          </div>
        </Tooltip>

        {/* Multiplier */}
        <Tooltip content={`Point multiplier for Stage ${currentStage}${isNegotiationStage ? ` - Negotiation Stage (${multiplier}x base multiplier)` : ' - Regular Stage (no multiplier)'}`}>
          <div 
            className="p-4 text-center transition-all duration-200 hover:shadow-md h-full"
            style={{
              backgroundColor: isNegotiationStage ? '#f59e0b10' : '#64748b10',
              borderRadius: theme.borders.radius,
              border: `1px solid ${isNegotiationStage ? '#f59e0b30' : '#64748b20'}`
            }}
          >
            <div 
              className="text-2xl font-bold mb-1"
              style={{ 
                color: isNegotiationStage ? '#f59e0b' : '#64748b',
                fontWeight: theme.fonts.headingWeight 
              }}
            >
              x{multiplier.toFixed(1)}
            </div>
            <div 
              className="text-sm flex items-center justify-center gap-1"
              style={{ 
                color: theme.colors.text + '80',
                fontFamily: theme.fonts.primary 
              }}
            >
              {isNegotiationStage ? 'Multiplier 🔥' : 'Multiplier 💰'}
            </div>
          </div>
        </Tooltip>
      </div>

      {/* Stamina */}
      <div className="space-y-3">
        <StaminaBar 
          currentStamina={cyclist.stamina} 
          maxStamina={5}
          className="stamina-with-tooltip"
        />

      </div>



      {/* Next Negotiation */}
      {GAME_CONSTANTS.NEGOTIATION_STAGES.find(stage => stage > session.current_stage) && (
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-sm font-medium text-blue-900">Next Negotiation</div>
          <div className="text-lg font-bold text-blue-600">
            Stage {GAME_CONSTANTS.NEGOTIATION_STAGES.find(stage => stage > session.current_stage)}
          </div>
        </div>
      )}


    </div>
  )

  const renderTeamsTab = () => (
    <div className="space-y-3">
      {loading ? (
        <div className="text-center text-gray-500 py-4">Loading teams...</div>
      ) : (
        allTeams.map((team, index) => {
          const isPlayerTeam = team.type === 'rubicon'
          const teamInfo = TEAM_TYPES[team.type] || team.name
          const teamEmoji = team.type === 'rubicon' ? '🚴‍♂️' : team.type === 'solaris' ? '☀️' : team.type === 'corex' ? '⚡' : team.type === 'vortex' ? '🌪️' : '🚴'
          
          return (
            <div 
              key={team.id}
              className={`p-3 rounded-lg border-2 transition-all ${
                isPlayerTeam 
                  ? 'bg-rubicon-50 border-rubicon-200' 
                  : 'bg-white border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="text-lg font-bold text-gray-500">#{index + 1}</div>
                  <div className="text-2xl">{teamEmoji}</div>
                  <div>
                    <div className={`font-semibold ${isPlayerTeam ? 'text-rubicon-900' : 'text-gray-900'}`}>
                      {teamInfo}
                      {isPlayerTeam && <span className="text-sm text-rubicon-600 ml-2">YOUR TEAM</span>}
                    </div>
                    <div className="text-sm text-gray-600">
                      {team.cyclists?.length || 0} cyclists • Synergy: {Math.round(team.synergy_score)}%
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${isPlayerTeam ? 'text-rubicon-600' : 'text-gray-900'}`}>
                    {team.total_points} pts
                  </div>
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )

  const renderIndividualsTab = () => (
    <div className="space-y-3">
      {loading ? (
        <div className="text-center text-gray-500 py-4">Loading cyclists...</div>
      ) : (
        allCyclists.map((cyclist, index) => {
          const isPlayer = cyclist.id === state.currentCyclist?.id
          const team = (cyclist as any).teams
          
          return (
            <div 
              key={cyclist.id}
              className={`p-3 rounded-lg border-2 transition-all ${
                isPlayer 
                  ? 'bg-rubicon-50 border-rubicon-200' 
                  : 'bg-white border-gray-100'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="text-lg font-bold text-gray-500">#{index + 1}</div>
                  <div className="text-2xl">
                    {cyclist.character_role === 'luca' && '🚴‍♂️'}
                    {cyclist.character_role === 'jonas' && '🚴'}
                    {cyclist.character_role === 'mateo' && '🚴‍♂️'}
                    {cyclist.character_role === 'kenji' && '🚴'}
                    {!['luca', 'jonas', 'mateo', 'kenji'].includes(cyclist.character_role) && '🚴‍♂️'}
                  </div>
                  <div>
                    <div className={`font-semibold ${isPlayer ? 'text-rubicon-900' : 'text-gray-900'}`}>
                      {cyclist.name}
                      {isPlayer && <span className="text-sm text-rubicon-600 ml-2">YOU</span>}
                    </div>
                    <div className="text-sm text-gray-600">
                      Team {team?.name} • {cyclist.stamina}/5 stamina
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${isPlayer ? 'text-rubicon-600' : 'text-gray-900'}`}>
                    {cyclist.current_points} pts
                  </div>
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )

  return (
    <div 
      className={`rounded-lg border shadow-lg overflow-hidden ${className}`}
      style={{
        backgroundColor: theme.colors.background,
        borderRadius: theme.borders.radius,
        borderColor: theme.colors.accent + '20',
        fontFamily: theme.fonts.primary,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      }}
    >
      <div className="p-6">
        {/* Tab Headers */}
        <div 
          className="flex space-x-1 p-1 rounded-lg mb-4"
          style={{
            backgroundColor: theme.colors.background,
            borderRadius: theme.borders.buttonRadius
          }}
        >
          <button
            onClick={() => setActiveTab('performance')}
            className="flex-1 px-3 py-2 text-sm font-medium transition-all"
            style={{
              backgroundColor: activeTab === 'performance' ? theme.colors.card : 'transparent',
              color: activeTab === 'performance' ? theme.colors.primary : theme.colors.text + '80',
              borderRadius: theme.borders.buttonRadius,
              fontWeight: theme.fonts.bodyWeight,
              fontFamily: theme.fonts.primary,
              ...(activeTab === 'performance' && { boxShadow: '0 1px 3px rgba(0,0,0,0.1)' })
            }}
          >
            📊 Your Performance
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className="flex-1 px-3 py-2 text-sm font-medium transition-all"
            style={{
              backgroundColor: activeTab === 'teams' ? theme.colors.card : 'transparent',
              color: activeTab === 'teams' ? theme.colors.primary : theme.colors.text + '80',
              borderRadius: theme.borders.buttonRadius,
              fontWeight: theme.fonts.bodyWeight,
              fontFamily: theme.fonts.primary,
              ...(activeTab === 'teams' && { boxShadow: '0 1px 3px rgba(0,0,0,0.1)' })
            }}
          >
            🏆 Team Standings
          </button>
          <button
            onClick={() => setActiveTab('individuals')}
            className="flex-1 px-3 py-2 text-sm font-medium transition-all"
            style={{
              backgroundColor: activeTab === 'individuals' ? theme.colors.card : 'transparent',
              color: activeTab === 'individuals' ? theme.colors.primary : theme.colors.text + '80',
              borderRadius: theme.borders.buttonRadius,
              fontWeight: theme.fonts.bodyWeight,
              fontFamily: theme.fonts.primary,
              ...(activeTab === 'individuals' && { boxShadow: '0 1px 3px rgba(0,0,0,0.1)' })
            }}
          >
            🚴‍♂️ Individual Standings
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {activeTab === 'performance' && renderPerformanceTab()}
          {activeTab === 'teams' && renderTeamsTab()}
          {activeTab === 'individuals' && renderIndividualsTab()}
        </div>
      </div>
    </div>
  )
}