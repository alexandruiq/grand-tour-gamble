export interface Cyclist {
  id: string
  name: string
  character_role: 'luca' | 'jonas' | 'mateo' | 'kenji'
  stamina: number
  current_points: number
  fatigue_penalty: boolean
  team_id: string
}

export interface Team {
  id: string
  name: string
  type: 'rubicon' | 'solaris' | 'corex' | 'vortex'
  synergy_score: number
  total_points: number
  cyclists?: Cyclist[]
}

export interface GameSession {
  id: string
  title: string
  current_stage: number
  status: 'not_started' | 'active' | 'reflection' | 'ended'
  trainer_id: string
  stage_locked: boolean
  stage_open: boolean
  multiplier_active: boolean
  current_multiplier: number
  reflection_active: boolean
  created_at: string
  updated_at: string
}

export interface Decision {
  id: string
  cyclist_id: string
  session_id: string
  stage_number: number
  decision: 'sprint' | 'cruise'
  points_earned: number
  timestamp: string
}

export interface CyclistBackstory {
  name: string
  title: string
  backstory: string
  motivation: string
  imageUrl: string
}

export interface Stage {
  number: number
  name: string
  description: string
  terrain: string
  isNegotiationStage: boolean
}

export interface GameState {
  session: GameSession | null
  currentCyclist: Cyclist | null
  team: Team | null
  allTeams: Team[]
  currentStage: Stage | null
  userDecisions: Decision[]
  isLoading: boolean
}

export interface ScoreMatrix {
  fourSprint: { individual: number; synergy: number }
  threeSprint: { individual: number; synergy: number }
  twoSprint: { individual: number; synergy: number }
  oneSprint: { individual: number; synergy: number }
  fourCruise: { individual: number; synergy: number }
}