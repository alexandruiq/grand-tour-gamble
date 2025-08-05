'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/useTheme'
import { supabase } from '@/lib/supabase'

interface ReflectionTriggerProps {
  sessionId: string
  currentStage: number
  sessionStatus: string
  onUpdate: () => void
}

export default function ReflectionTrigger({
  sessionId,
  currentStage,
  sessionStatus,
  onUpdate
}: ReflectionTriggerProps) {
  const theme = useTheme()
  const [isLoading, setIsLoading] = useState(false)

  const isGameComplete = currentStage >= 10 && sessionStatus !== 'reflection'
  const isReflectionActive = sessionStatus === 'reflection'

  const handleTriggerReflection = async () => {
    setIsLoading(true)
    try {
      console.log('🧠 Triggering reflection phase...')
      
      const { error } = await supabase
        .from('sessions')
        .update({ 
          status: 'reflection',
          reflection_active: true
        })
        .eq('id', sessionId)

      if (error) throw error

      console.log('✅ Reflection phase activated')
      onUpdate()
    } catch (error) {
      console.error('Error triggering reflection:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEndReflection = async () => {
    setIsLoading(true)
    try {
      console.log('🔚 Ending reflection phase...')
      
      const { error } = await supabase
        .from('sessions')
        .update({ 
          status: 'completed',
          reflection_active: false
        })
        .eq('id', sessionId)

      if (error) throw error

      console.log('✅ Reflection phase ended, game completed')
      onUpdate()
    } catch (error) {
      console.error('Error ending reflection:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isGameComplete && !isReflectionActive) {
    return (
      <div 
        className="p-6 rounded-lg border text-center"
        style={{
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.accent + '20'
        }}
      >
        <div className="text-4xl mb-4">🏁</div>
        <h3 
          className="text-lg font-bold mb-2"
          style={{
            color: theme.colors.text,
            fontFamily: theme.fonts.primary
          }}
        >
          Game In Progress
        </h3>
        <p 
          className="text-sm"
          style={{
            color: theme.colors.text + '70',
            fontFamily: theme.fonts.primary
          }}
        >
          Reflection phase will be available after Stage 10 is completed.
        </p>
        <div 
          className="mt-4 text-sm font-medium"
          style={{
            color: theme.colors.primary,
            fontFamily: theme.fonts.primary
          }}
        >
          Current: Stage {currentStage} of 10
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
      <div 
        className="rounded-lg border p-6"
        style={{
          backgroundColor: theme.colors.card,
          borderColor: isReflectionActive 
            ? theme.colors.primary + '50' 
            : theme.colors.accent + '20'
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 
              className="text-xl font-bold"
              style={{
                color: theme.colors.text,
                fontFamily: theme.fonts.primary,
                fontWeight: theme.fonts.headingWeight
              }}
            >
              🧠 Reflection Phase
            </h3>
            <p 
              className="text-sm mt-1"
              style={{
                color: theme.colors.text + '70',
                fontFamily: theme.fonts.primary
              }}
            >
              {isReflectionActive 
                ? 'Players are currently reflecting on their journey'
                : 'Activate the final reflection phase for all players'
              }
            </p>
          </div>
          
          <div 
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{
              backgroundColor: isReflectionActive 
                ? theme.colors.primary + '20' 
                : theme.colors.alert + '20',
              color: isReflectionActive 
                ? theme.colors.primary 
                : theme.colors.alert,
              fontFamily: theme.fonts.primary
            }}
          >
            {isReflectionActive ? '🟢 Active' : '⏸️ Ready'}
          </div>
        </div>

        {isReflectionActive ? (
          <div className="space-y-4">
            <div 
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: theme.colors.primary + '10',
                borderColor: theme.colors.primary + '30'
              }}
            >
              <div 
                className="font-medium mb-2"
                style={{
                  color: theme.colors.primary,
                  fontFamily: theme.fonts.primary
                }}
              >
                🎯 Reflection Phase Active
              </div>
              <p 
                className="text-sm"
                style={{
                  color: theme.colors.text + '80',
                  fontFamily: theme.fonts.primary
                }}
              >
                All players have been redirected to the reflection page where they can:
              </p>
              <ul 
                className="text-sm mt-2 space-y-1 ml-4"
                style={{
                  color: theme.colors.text + '80',
                  fontFamily: theme.fonts.primary
                }}
              >
                <li>• Review their decision history</li>
                <li>• See their final results and rankings</li>
                <li>• Reflect on their strategy and learnings</li>
                <li>• Prepare for debrief discussion</li>
              </ul>
            </div>

            <div className="flex items-center justify-center">
              <button
                onClick={handleEndReflection}
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
                {isLoading ? '⏳ Ending...' : '🔚 End Reflection & Complete Game'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div 
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.accent + '20'
              }}
            >
              <div 
                className="font-medium mb-2"
                style={{
                  color: theme.colors.text,
                  fontFamily: theme.fonts.primary
                }}
              >
                🎯 Ready to Begin Reflection
              </div>
              <p 
                className="text-sm"
                style={{
                  color: theme.colors.text + '80',
                  fontFamily: theme.fonts.primary
                }}
              >
                All 10 stages have been completed! When you activate reflection phase:
              </p>
              <ul 
                className="text-sm mt-2 space-y-1 ml-4"
                style={{
                  color: theme.colors.text + '80',
                  fontFamily: theme.fonts.primary
                }}
              >
                <li>• All players will be redirected to the reflection page</li>
                <li>• They can review their complete journey and results</li>
                <li>• Perfect time to begin group debrief discussion</li>
                <li>• Game session will be marked as completed afterward</li>
              </ul>
            </div>

            <div className="flex items-center justify-center">
              <button
                onClick={handleTriggerReflection}
                disabled={isLoading}
                className="px-8 py-4 rounded-lg font-medium text-lg transition-all"
                style={{
                  backgroundColor: theme.colors.primary,
                  color: theme.colors.background,
                  borderRadius: theme.borders.buttonRadius,
                  fontFamily: theme.fonts.primary
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = theme.colors.primary + 'CC'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = theme.colors.primary
                  }
                }}
              >
                {isLoading ? '⏳ Activating...' : '🧠 Begin Reflection Phase'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}