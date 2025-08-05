'use client'

import { useTheme } from '@/lib/useTheme'

interface StageTimelineProps {
  currentStage: number
  completedStages: number[]
  negotiationStages?: number[]
}

export default function StageTimeline({
  currentStage,
  completedStages,
  negotiationStages = [4, 7, 10]
}: StageTimelineProps) {
  const theme = useTheme()

  const stages = Array.from({ length: 10 }, (_, i) => i + 1)

  return (
    <div 
      className="p-4 border-b"
      style={{
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.accent + '20'
      }}
    >
      <h3 
        className="text-sm font-medium mb-3"
        style={{
          color: theme.colors.text + '80',
          fontFamily: theme.fonts.primary
        }}
      >
        📅 Stage Progress
      </h3>
      
      <div className="flex items-center space-x-2">
        {stages.map((stage) => {
          const isCompleted = completedStages.includes(stage)
          const isCurrent = stage === currentStage
          const isNegotiation = negotiationStages.includes(stage)
          
          return (
            <div key={stage} className="flex-1 relative">
              <div
                className={`h-3 rounded-full border-2 transition-all duration-300 ${
                  isCompleted 
                    ? 'border-green-500' 
                    : isCurrent 
                    ? 'border-blue-500' 
                    : 'border-gray-300'
                }`}
                style={{
                  backgroundColor: isCompleted 
                    ? theme.colors.primary 
                    : isCurrent 
                    ? theme.colors.primary + '50' 
                    : theme.colors.background
                }}
              >
                {/* Negotiation Indicator */}
                {isNegotiation && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <div className="text-xs">🤝</div>
                  </div>
                )}
              </div>
              
              {/* Stage Number */}
              <div 
                className="text-xs text-center mt-1 font-medium"
                style={{
                  color: isCurrent 
                    ? theme.colors.primary 
                    : isCompleted 
                    ? theme.colors.primary 
                    : theme.colors.text + '60',
                  fontFamily: theme.fonts.primary
                }}
              >
                {stage}
                {isCompleted && (
                  <div className="text-green-500">✅</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 mt-3 text-xs">
        <div className="flex items-center space-x-1">
          <div 
            className="w-3 h-3 rounded-full border-2"
            style={{
              backgroundColor: theme.colors.primary,
              borderColor: theme.colors.primary
            }}
          ></div>
          <span style={{ color: theme.colors.text + '70' }}>Completed</span>
        </div>
        <div className="flex items-center space-x-1">
          <div 
            className="w-3 h-3 rounded-full border-2"
            style={{
              backgroundColor: theme.colors.primary + '50',
              borderColor: theme.colors.primary
            }}
          ></div>
          <span style={{ color: theme.colors.text + '70' }}>Current</span>
        </div>
        <div className="flex items-center space-x-1">
          <span>🤝</span>
          <span style={{ color: theme.colors.text + '70' }}>Negotiation</span>
        </div>
      </div>
    </div>
  )
}