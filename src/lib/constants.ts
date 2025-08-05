// Game configuration constants for The Grand Tour Gamble

export const GAME_CONSTANTS = {
  TOTAL_STAGES: 10,
  NEGOTIATION_STAGES: [4, 7, 10] as const,
  MAX_STAMINA: 5,
  MIN_STAMINA: 0,
  INITIAL_STAMINA: 5,
  INITIAL_SYNERGY: 100,
}

export const CYCLIST_NAMES = {
  luca: 'Luca Moretti',
  jonas: 'Jonas Dahl', 
  mateo: 'Mateo Silva',
  kenji: 'Kenji Nakamura',
} as const

export const TEAM_TYPES = {
  rubicon: 'Team Rubicon',
  solaris: 'Team Solaris', 
  corex: 'Team Corex',
  vortex: 'Team Vortex',
} as const

export const AI_TEAM_PROFILES = {
  solaris: { cruiseRate: 0.7, sprintRate: 0.3 },
  corex: { cruiseRate: 0.4, sprintRate: 0.6 },
  vortex: { cruiseRate: 0.85, sprintRate: 0.15 },
} as const

// Scoring matrix for Sprint/Cruise decisions
export const SCORE_MATRIX = {
  fourSprint: { individual: 8, synergy: -20 },
  threeSprint: { individual: 6, synergy: -10 },
  twoSprint: { individual: 4, synergy: 0 },
  oneSprint: { individual: 2, synergy: 10 },
  fourCruise: { individual: 6, synergy: 20 },
} as const

// Stage-specific multipliers for negotiation stages
export const STAGE_MULTIPLIERS = {
  4: 3.0,   // Stage 4 (Mountain Pass)
  7: 5.0,   // Stage 7 (Forest Trail)
  10: 10.0, // Stage 10 (Grand Finale)
  default: 1.0
} as const

// Alignment bonus multipliers for negotiation stages
export const ALIGNMENT_MULTIPLIERS = {
  perfect: 2.0,  // All 4 cyclists choose same option
  good: 1.5,     // 3 of 4 cyclists choose same option
  poor: 1.0,     // 2/2 split or worse alignment
} as const

// Synergy changes based on team decisions
export const SYNERGY_CHANGES = {
  fourCruise: 20,    // All 4 cruise: +20 synergy
  threeCruise: 10,   // 3 cruise, 1 sprint: +10 synergy  
  balanced: 0,       // 2 cruise, 2 sprint: no change
  threeSprint: -10,  // 1 cruise, 3 sprint: -10 synergy
  fourSprint: -20,   // All 4 sprint: -20 synergy
} as const

// Legacy multipliers (keeping for compatibility)
export const MULTIPLIERS = {
  aligned_three: 1.5,
  aligned_four: 2.0,
  default: 1.0,
} as const

export const STAGE_NAMES = [
  'The Dawn Sprint',
  'Valley Crossroads', 
  'Cobblestone Challenge',
  'Mountain Pass', // Negotiation
  'Desert Winds',
  'River Crossing',
  'Forest Trail', // Negotiation  
  'Hill Climb',
  'Final Valley', // Negotiation
  'Grand Finale'
] as const