'use client'

import { useGame } from '@/context/GameContext'
import { getStageDescription } from '@/lib/mdx-utils'
import { GAME_CONSTANTS } from '@/lib/constants'

interface StageDescriptionProps {
  className?: string
}

export default function StageDescription({ className = '' }: StageDescriptionProps) {
  const { state } = useGame()
  
  if (!state.session) {
    return (
      <div className={`card ${className}`}>
        <div className="text-center text-gray-500">
          Loading stage information...
        </div>
      </div>
    )
  }

  const currentStage = state.session.current_stage
  const stageInfo = getStageDescription(currentStage)
  const isNegotiationStage = GAME_CONSTANTS.NEGOTIATION_STAGES.includes(currentStage as 4 | 7 | 10)
  const multiplier = state.session.current_multiplier || 1.0

  return (
    <div className={className}>
      {/* Stage Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-900">
            Stage {currentStage} of {GAME_CONSTANTS.TOTAL_STAGES}
          </h2>
          
          {/* Stage Progress Bar */}
          <div className="flex items-center space-x-2">
            <div className="w-24 bg-gray-200 rounded-full h-2">
              <div 
                className="stage-progress h-2 rounded-full transition-all duration-500"
                style={{ width: `${(currentStage / GAME_CONSTANTS.TOTAL_STAGES) * 100}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-500">
              {Math.round((currentStage / GAME_CONSTANTS.TOTAL_STAGES) * 100)}%
            </span>
          </div>
        </div>

        <h3 className="text-xl font-semibold text-rubicon-600 mb-2">
          {stageInfo.name}
        </h3>
      </div>

      {/* Negotiation Badge */}
      {isNegotiationStage && (
        <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <div className="flex items-center">
            <div className="text-yellow-600 text-xl mr-3">🗣️</div>
            <div>
              <div className="font-semibold text-yellow-800">Negotiation Stage</div>
              <div className="text-yellow-700 text-sm">
                Coordinate with your team for maximum multiplier bonus!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multiplier Display */}
      {multiplier > 1.0 && (
        <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
          <div className="flex items-center">
            <div className="text-green-600 text-xl mr-3">🚀</div>
            <div>
              <div className="font-semibold text-green-800">
                Active Multiplier: x{multiplier}
              </div>
              <div className="text-green-700 text-sm">
                All points this stage will be multiplied!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stage Description */}
      <div className="mb-6">
        <p className="text-gray-700 leading-relaxed">
          {stageInfo.description}
        </p>
      </div>

      {/* Stage Status */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${
              !state.session.stage_open ? 'text-red-600' : 'text-green-600'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                !state.session.stage_open ? 'bg-red-500' : 'bg-green-500'
              }`}></div>
              <span className="font-medium">
                {!state.session.stage_open ? 'Stage Closed' : 'Decisions Open'}
              </span>
            </div>
            
            {state.session.multiplier_active && (
              <div className="flex items-center space-x-2 text-purple-600">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span className="font-medium">Multiplier Active</span>
              </div>
            )}
          </div>

          <div className="text-gray-500">
            {isNegotiationStage ? 'Negotiation Round' : 'Regular Stage'}
          </div>
        </div>
      </div>

      {/* Game Mechanics Reminder */}
      <div className="mt-4 bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
        <div className="font-medium mb-2">🎯 Stage Objectives:</div>
        <div className="space-y-1">
          {isNegotiationStage ? (
            <>
              <div>• Coordinate with team for multiplier bonus</div>
              <div>• 3+ aligned decisions = x1.5 multiplier</div>
              <div>• 4 aligned decisions = x2.0 multiplier</div>
            </>
          ) : (
            <>
              <div>• Choose Sprint for high points (costs stamina)</div>
              <div>• Choose Cruise for synergy and stamina recovery</div>
              <div>• Consider what your teammates might choose</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}