'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/useTheme'

interface TrainerHeaderProps {
  sessionId: string
  sessionName?: string
  currentStage: number
  stageOpen: boolean
  stageLocked: boolean
  onStageAction: (action: 'start' | 'end') => void
  isLoading?: boolean
}

export default function TrainerHeader({
  sessionId,
  sessionName,
  currentStage,
  stageOpen,
  stageLocked,
  onStageAction,
  isLoading = false
}: TrainerHeaderProps) {
  const theme = useTheme()

  return (
    <div 
      className="border-b p-6"
      style={{
        backgroundColor: theme.colors.background,
        borderColor: theme.colors.accent + '20'
      }}
    >
      <div className="flex items-center justify-between">
        {/* Session Info */}
        <div>
          <h1 
            className="text-2xl font-bold"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.primary,
              fontWeight: theme.fonts.headingWeight
            }}
          >
            🚴‍♂️ The Grand Tour Gamble
          </h1>
          <p 
            className="text-sm mt-1"
            style={{
              color: theme.colors.text + '80',
              fontFamily: theme.fonts.primary
            }}
          >
            Session #{sessionId.slice(-8).toUpperCase()} • {sessionName || 'Trainer Dashboard'}
          </p>
        </div>

        {/* Current Stage & Controls */}
        <div className="flex items-center space-x-6">
          {/* Stage Info */}
          <div className="text-right">
            <div 
              className="text-lg font-bold"
              style={{
                color: theme.colors.primary,
                fontFamily: theme.fonts.primary
              }}
            >
              Stage {currentStage} of 10
            </div>
            <div 
              className="text-sm"
              style={{
                color: theme.colors.text + '70',
                fontFamily: theme.fonts.primary
              }}
            >
              {stageOpen ? '🟢 Open' : '🔒 Locked'}
            </div>
          </div>

          {/* Stage Controls */}
          <div className="flex items-center space-x-3">
            {!stageOpen ? (
              <button
                onClick={() => onStageAction('start')}
                disabled={isLoading}
                className="px-6 py-3 rounded-lg font-medium transition-all"
                style={{
                  backgroundColor: currentStage === 1 ? theme.colors.accent : theme.colors.primary,
                  color: theme.colors.background,
                  borderRadius: theme.borders.buttonRadius,
                  fontFamily: theme.fonts.primary
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    const color = currentStage === 1 ? theme.colors.accent : theme.colors.primary
                    e.currentTarget.style.backgroundColor = color + 'CC'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    const color = currentStage === 1 ? theme.colors.accent : theme.colors.primary
                    e.currentTarget.style.backgroundColor = color
                  }
                }}
              >
                {isLoading 
                  ? (currentStage === 1 ? '⏳ Starting Game...' : '⏳ Opening...') 
                  : (currentStage === 1 ? '🚀 Start Game!' : `▶️ Open Stage ${currentStage}`)
                }
              </button>
            ) : (
              <button
                onClick={() => onStageAction('end')}
                disabled={isLoading}
                className="px-6 py-3 rounded-lg font-medium transition-all"
                style={{
                  backgroundColor: theme.colors.alert,
                  color: theme.colors.background,
                  borderRadius: theme.borders.buttonRadius,
                  fontFamily: theme.fonts.primary
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = theme.colors.alert + 'CC'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = theme.colors.alert
                  }
                }}
              >
                {isLoading ? '⏳ Ending...' : `⏹️ End Stage ${currentStage}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}