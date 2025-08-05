'use client'

import { useTheme } from '@/lib/useTheme'
import { GAME_CONSTANTS } from '@/lib/constants'

interface Cyclist {
  id: string
  name: string
  character_role: string
  stamina: number
  current_points: number
  hasDecided: boolean
  decision?: 'sprint' | 'cruise'
}

interface Team {
  name: string
  type: 'rubicon' | 'solaris' | 'corex' | 'vortex'
  emoji: string
  cyclists: Cyclist[]
  total_points: number
  synergy_score: number
}

interface LiveTeamOverviewProps {
  teams: Team[]
  currentStage: number
  stageOpen: boolean
  showDecisions?: boolean
}

interface TeamCardProps {
  team: Team
  theme: ReturnType<typeof useTheme>
  stageOpen: boolean
  showDecisions: boolean
  isNegotiationStage: boolean
  currentStage: number
  getTeamEmoji: (teamType: string) => string
  getCyclistEmoji: (role: string) => string
  getDecisionIcon: (decision?: string) => string
  getNegotiationMultiplier: (stage: number) => number
}

function TeamCard({
  team,
  theme,
  stageOpen,
  showDecisions,
  isNegotiationStage,
  currentStage,
  getTeamEmoji,
  getCyclistEmoji,
  getDecisionIcon,
  getNegotiationMultiplier
}: TeamCardProps) {
  return (
    <div 
      className="rounded-lg border p-4"
      style={{
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.accent + '30',
        borderRadius: theme.borders.radius
      }}
    >
      {/* Team Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getTeamEmoji(team.type)}</span>
          <div>
            <h4 
              className="font-bold"
              style={{
                color: theme.colors.text,
                fontFamily: theme.fonts.primary
              }}
            >
              {team.name}
            </h4>
            <div 
              className="text-xs"
              style={{
                color: theme.colors.text + '70',
                fontFamily: theme.fonts.primary
              }}
            >
              {team.total_points} pts • {Math.round(team.synergy_score)}% synergy
              {isNegotiationStage && (
                <span 
                  className="ml-2 px-2 py-0.5 rounded text-xs font-medium"
                  style={{
                    backgroundColor: theme.colors.accent + '20',
                    color: theme.colors.accent
                  }}
                >
                  x{getNegotiationMultiplier(currentStage)}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Team Status */}
        <div className="text-right">
          <div 
            className="text-xs font-medium"
            style={{
              color: team.cyclists.every(c => c.hasDecided) 
                ? theme.colors.primary 
                : theme.colors.alert,
              fontFamily: theme.fonts.primary
            }}
          >
            {team.cyclists.filter(c => c.hasDecided).length}/{team.cyclists.length}
          </div>
          <div 
            className="text-xs"
            style={{
              color: theme.colors.text + '60',
              fontFamily: theme.fonts.primary
            }}
          >
            decided
          </div>
        </div>
      </div>

      {/* Cyclists */}
      <div className="space-y-3">
        {team.cyclists.map((cyclist) => (
          <div 
            key={cyclist.id}
            className="flex items-center justify-between p-3 rounded-lg border"
            style={{
              backgroundColor: cyclist.hasDecided 
                ? theme.colors.primary + '10' 
                : theme.colors.background,
              borderColor: cyclist.hasDecided 
                ? theme.colors.primary + '30' 
                : theme.colors.accent + '20'
            }}
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">{getCyclistEmoji(cyclist.character_role)}</span>
              <div>
                <div 
                  className="font-medium text-sm"
                  style={{
                    color: theme.colors.text,
                    fontFamily: theme.fonts.primary
                  }}
                >
                  {cyclist.name}
                </div>
                <div 
                  className="text-xs flex items-center space-x-2"
                  style={{
                    color: theme.colors.text + '70',
                    fontFamily: theme.fonts.primary
                  }}
                >
                  <span>⚡ {cyclist.stamina}/5</span>
                  <span>🏆 {cyclist.current_points}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Decision Status */}
              {cyclist.hasDecided ? (
                <div className="flex items-center space-x-1">
                  {showDecisions && cyclist.decision && (
                    <span 
                      className="text-sm"
                      title={cyclist.decision === 'sprint' ? 'Sprint' : 'Cruise'}
                    >
                      {getDecisionIcon(cyclist.decision)}
                    </span>
                  )}
                  <span 
                    className="text-xs font-medium px-2 py-1 rounded"
                    style={{
                      backgroundColor: theme.colors.primary,
                      color: theme.colors.background
                    }}
                  >
                    ✅
                  </span>
                </div>
              ) : (
                <span 
                  className="text-xs font-medium px-2 py-1 rounded"
                  style={{
                    backgroundColor: theme.colors.alert + '20',
                    color: theme.colors.alert
                  }}
                >
                  {stageOpen ? '⏳' : '🔒'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LiveTeamOverview({
  teams,
  currentStage,
  stageOpen,
  showDecisions = false
}: LiveTeamOverviewProps) {
  const theme = useTheme()

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

  const getDecisionIcon = (decision?: string) => {
    switch (decision) {
      case 'sprint': return '🚀'
      case 'cruise': return '🛡️'
      default: return '❓'
    }
  }

  const getNegotiationMultiplier = (stage: number) => {
    if (stage === 4) return 3
    if (stage === 7) return 5
    if (stage === 10) return 10
    return 1
  }

  const isNegotiationStage = GAME_CONSTANTS.NEGOTIATION_STAGES.includes(currentStage as 4 | 7 | 10)

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
          🏁 Live Game Overview
        </h3>
        
        <div className="flex items-center space-x-3">
          {isNegotiationStage && (
            <div 
              className="text-sm px-3 py-1 rounded-full"
              style={{
                backgroundColor: theme.colors.accent + '20',
                color: theme.colors.accent,
                fontFamily: theme.fonts.primary
              }}
            >
              💰 x{getNegotiationMultiplier(currentStage)} Points
            </div>
          )}
          <div 
            className="text-sm px-3 py-1 rounded-full"
            style={{
              backgroundColor: stageOpen ? theme.colors.primary + '20' : theme.colors.alert + '20',
              color: stageOpen ? theme.colors.primary : theme.colors.alert,
              fontFamily: theme.fonts.primary
            }}
          >
            Stage {currentStage} • {stageOpen ? 'Decisions Open' : 'Locked'}
          </div>
        </div>
      </div>

      {/* Custom Layout: Rubicon left, others stacked right */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Team Rubicon - Left Side */}
        {teams.filter(team => team.type === 'rubicon').map((team) => (
          <div 
            key={team.name}
            className="lg:w-1/2"
          >
            <TeamCard 
              team={team} 
              theme={theme} 
              stageOpen={stageOpen}
              showDecisions={showDecisions}
              isNegotiationStage={isNegotiationStage}
              currentStage={currentStage}
              getTeamEmoji={getTeamEmoji}
              getCyclistEmoji={getCyclistEmoji}
              getDecisionIcon={getDecisionIcon}
              getNegotiationMultiplier={getNegotiationMultiplier}
            />
          </div>
        ))}

        {/* Opposing Teams - Right Side Stacked */}
        <div className="lg:w-1/2 space-y-4">
          {teams.filter(team => team.type !== 'rubicon').map((team) => (
            <TeamCard 
              key={team.name}
              team={team} 
              theme={theme} 
              stageOpen={stageOpen}
              showDecisions={showDecisions}
              isNegotiationStage={isNegotiationStage}
              currentStage={currentStage}
              getTeamEmoji={getTeamEmoji}
              getCyclistEmoji={getCyclistEmoji}
              getDecisionIcon={getDecisionIcon}
              getNegotiationMultiplier={getNegotiationMultiplier}
            />
          ))}
        </div>
      </div>

      {/* Summary Bar */}
      <div 
        className="mt-6 p-4 rounded-lg border"
        style={{
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.accent + '20'
        }}
      >
        <div className="flex items-center justify-between">
          <div 
            className="text-sm font-medium"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.primary
            }}
          >
            📊 Stage {currentStage} Summary
          </div>
          
          <div className="flex items-center space-x-6">
            <div 
              className="text-sm"
              style={{
                color: theme.colors.text + '80',
                fontFamily: theme.fonts.primary
              }}
            >
              Total Players: {teams.reduce((sum, team) => sum + team.cyclists.length, 0)}
            </div>
            <div 
              className="text-sm"
              style={{
                color: theme.colors.text + '80',
                fontFamily: theme.fonts.primary
              }}
            >
              Decisions: {teams.reduce((sum, team) => sum + team.cyclists.filter(c => c.hasDecided).length, 0)}/{teams.reduce((sum, team) => sum + team.cyclists.length, 0)}
            </div>
            <div 
              className="text-sm font-medium"
              style={{
                color: teams.every(team => team.cyclists.every(c => c.hasDecided)) 
                  ? theme.colors.primary 
                  : theme.colors.alert,
                fontFamily: theme.fonts.primary
              }}
            >
              {teams.every(team => team.cyclists.every(c => c.hasDecided)) 
                ? '✅ All Ready' 
                : '⏳ Waiting'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}