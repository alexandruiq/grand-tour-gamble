'use client'

import { useGame } from '@/context/GameContext'
import { GAME_CONSTANTS } from '@/lib/constants'
import CompactAlert from './CompactAlert'

interface NegotiationBannerProps {
  className?: string
}

export default function NegotiationBanner({ className = '' }: NegotiationBannerProps) {
  const { state } = useGame()
  
  if (!state.session || !state.currentStage) {
    return null
  }

  // Check if current stage is a negotiation stage
  const isNegotiationStage = GAME_CONSTANTS.NEGOTIATION_STAGES.includes(state.session.current_stage as 4 | 7 | 10)
  
  if (!isNegotiationStage) {
    return null
  }

  // Get multiplier based on stage
  let multiplier = 1
  if (state.session.current_stage === 4) multiplier = 3
  else if (state.session.current_stage === 7) multiplier = 5
  else if (state.session.current_stage === 10) multiplier = 10

  return (
    <CompactAlert
      type="negotiation"
      icon="💰"
      title={`Negotiation Round • x${multiplier} Points`}
      className={className}
    />
  )
}