import { SCORE_MATRIX, GAME_CONSTANTS, MULTIPLIERS } from './constants'
import type { Decision } from '@/types/game.types'

export interface StageResult {
  cyclistId: string
  decision: 'sprint' | 'cruise'
  pointsEarned: number
  staminaChange: number
  penalized: boolean
}

export interface TeamResult {
  teamPoints: number
  synergyChange: number
  stageResults: StageResult[]
  multiplierApplied: number
}

/**
 * Calculate results for a stage based on team decisions
 */
export function calculateStageResults(
  decisions: Decision[],
  currentStamina: Record<string, number>,
  currentSynergy: number,
  multiplier: number = 1.0
): TeamResult {
  const sprintCount = decisions.filter(d => d.decision === 'sprint').length
  
  // Determine matrix key
  let matrixKey: keyof typeof SCORE_MATRIX
  if (sprintCount === 4) matrixKey = 'fourSprint'
  else if (sprintCount === 3) matrixKey = 'threeSprint'
  else if (sprintCount === 2) matrixKey = 'twoSprint'
  else if (sprintCount === 1) matrixKey = 'oneSprint'
  else matrixKey = 'fourCruise'
  
  const baseScore = SCORE_MATRIX[matrixKey]
  const synergyChange = baseScore.synergy
  
  // Calculate individual results
  const stageResults: StageResult[] = decisions.map(decision => {
    const pointsEarned = baseScore.individual
    let staminaChange = 0
    
    // Calculate stamina changes
    if (decision.decision === 'sprint') {
      staminaChange = -1
    } else if (decision.decision === 'cruise' && currentSynergy >= 50) {
      staminaChange = 1
    }
    
    // Apply multiplier
    const finalPoints = Math.floor(pointsEarned * multiplier)
    
    return {
      cyclistId: decision.cyclist_id,
      decision: decision.decision,
      pointsEarned: finalPoints,
      staminaChange,
      penalized: false
    }
  })
  
  // Calculate team points
  const teamPoints = stageResults.reduce((sum, result) => sum + result.pointsEarned, 0)
  
  return {
    teamPoints,
    synergyChange,
    stageResults,
    multiplierApplied: multiplier
  }
}

/**
 * Determine if a negotiation multiplier should be applied
 */
export function calculateNegotiationMultiplier(
  decisions: Decision[]
): number {
  const sprintCount = decisions.filter(d => d.decision === 'sprint').length
  const cruiseCount = decisions.filter(d => d.decision === 'cruise').length
  
  // Check for alignment (3+ people choosing the same option)
  if (sprintCount >= 4 || cruiseCount >= 4) {
    return MULTIPLIERS.aligned_four
  } else if (sprintCount >= 3 || cruiseCount >= 3) {
    return MULTIPLIERS.aligned_three
  }
  
  return MULTIPLIERS.default
}

/**
 * Generate AI team decision based on profile
 */
export function generateAIDecision(
  teamType: 'solaris' | 'corex' | 'vortex',
  _stageNumber: number
): 'sprint' | 'cruise' {
  const profiles = {
    solaris: { cruiseRate: 0.7 },
    corex: { cruiseRate: 0.4 },
    vortex: { cruiseRate: 0.85 }
  }
  
  const profile = profiles[teamType]
  const random = Math.random()
  
  return random < profile.cruiseRate ? 'cruise' : 'sprint'
}

/**
 * Calculate final team rankings
 */
export function calculateTeamRankings(teams: Array<{id: string, name: string, total_points: number, synergy_score: number}>) {
  return teams
    .sort((a, b) => {
      // Primary sort by points, secondary by synergy
      if (b.total_points !== a.total_points) {
        return b.total_points - a.total_points
      }
      return b.synergy_score - a.synergy_score
    })
    .map((team, index) => ({
      ...team,
      rank: index + 1
    }))
}

/**
 * Validate if all cyclists have made decisions for a stage
 */
export function validateStageCompletion(
  decisions: Decision[],
  expectedCyclistCount: number = 4
): boolean {
  return decisions.length === expectedCyclistCount
}