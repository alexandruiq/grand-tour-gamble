'use client'

import { useGame } from '@/context/GameContext'
import { GAME_CONSTANTS } from '@/lib/constants'
import CompactAlert from './CompactAlert'

interface StatusBannerProps {
  className?: string
}

export default function StatusBanner({ className = '' }: StatusBannerProps) {
  const { state } = useGame()

  if (!state.session) return null

  const session = state.session
  

  const isNegotiationStage = GAME_CONSTANTS.NEGOTIATION_STAGES.includes(session.current_stage as 4 | 7 | 10)
  
  // Determine banner type and message
  const getBannerContent = () => {
    if (session.status === 'ended') {
      return {
        type: 'completed',
        icon: '🏁',
        title: 'Game Complete',
        message: 'The Grand Tour Gamble has finished! Check your final results.',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-300'
      }
    }

    if (session.status === 'reflection') {
      return {
        type: 'reflection',
        icon: '💭',
        title: 'Reflection Time',
        message: 'Stage locked. Discuss with your team about the decisions made.',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-800',
        borderColor: 'border-purple-300'
      }
    }

    if (!session.stage_open) {
      return {
        type: 'closed',
        icon: '🚫',
        title: 'Stage Closed',
        message: 'Waiting for trainer to open stage for decisions.',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
        borderColor: 'border-orange-300'
      }
    }

    if (isNegotiationStage && session.multiplier_active) {
      return {
        type: 'negotiation',
        icon: '🗣️',
        title: 'Negotiation Round Active',
        message: 'Coordinate with your team for multiplier bonus! Aligned decisions = higher points.',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-300'
      }
    }

    if (session.current_multiplier > 1.0) {
      return {
        type: 'multiplier',
        icon: '🚀',
        title: `Multiplier Active: x${session.current_multiplier}`,
        message: 'All points this stage will be multiplied! Make your choice count.',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-300'
      }
    }

    if (session.status === 'active') {
      return {
        type: 'active',
        icon: '⚡',
        title: 'Stage Active',
        message: 'Make your decision: Sprint for points or Cruise for stamina and synergy.',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-300'
      }
    }

    return {
      type: 'waiting',
      icon: '⏳',
      title: 'Waiting to Start',
      message: 'Waiting for trainer to begin the stage.',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      borderColor: 'border-gray-300'
    }
  }

  const banner = getBannerContent()

  const getAlertType = (): 'info' | 'warning' | 'success' | 'error' => {
    if (banner.type === 'completed') return 'success'
    if (banner.type === 'closed' || banner.type === 'waiting') return 'warning'
    if (banner.type === 'reflection') return 'info'
    return 'info'
  }

  return (
    <CompactAlert
      type={getAlertType()}
      icon={banner.icon}
      title={banner.title}
      message={banner.message}
      className={className}
    />
  )
}