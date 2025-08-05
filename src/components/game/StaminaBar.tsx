'use client'

import Tooltip from '@/components/ui/Tooltip'

interface StaminaBarProps {
  currentStamina: number
  maxStamina?: number
  showFatigue?: boolean
  className?: string
}

export default function StaminaBar({ 
  currentStamina, 
  maxStamina = 5, 
  showFatigue = false,
  className = '' 
}: StaminaBarProps) {
  const staminaPercentage = (currentStamina / maxStamina) * 100
  
  const getStaminaColor = () => {
    if (currentStamina === 0) return 'bg-red-500'
    if (currentStamina <= 2) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStaminaTextColor = () => {
    if (currentStamina === 0) return 'text-red-600'
    if (currentStamina <= 2) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className={`${className}`}>
      {/* Header with Bubbles Between Label and Fraction */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <Tooltip 
            content="Energy level for sprinting - recovers when cruising with good team synergy (≥50%)"
            position="top"
          >
            <span className="text-sm font-medium text-gray-700">
              Stamina ⚡
            </span>
          </Tooltip>
          
          {/* Stamina Bubbles */}
          <div className="flex space-x-1">
            {[...Array(maxStamina)].map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full border transition-all duration-300 ${
                  i < currentStamina
                    ? `${getStaminaColor()} border-gray-300`
                    : 'bg-gray-200 border-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
        
        <span className={`text-sm font-bold ${getStaminaTextColor()}`}>
          {currentStamina}/{maxStamina}
        </span>
      </div>

      {/* Progress bar representation */}
      <div className="mb-2">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${getStaminaColor()}`}
            style={{ width: `${staminaPercentage}%` }}
          />
        </div>
      </div>

      {/* Status Messages */}
      <div className="mt-2 space-y-1">
        {currentStamina === 0 && (
          <div className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-lg border border-red-200">
            ⚠️ No stamina! Sprinting is unavailable - must cruise
          </div>
        )}
        
        {currentStamina <= 2 && currentStamina > 0 && (
          <div className="text-xs bg-yellow-50 text-yellow-600 px-2 py-1 rounded-lg border border-yellow-200">
            ⚡ Low stamina - consider cruising to recover
          </div>
        )}

        {showFatigue && (
          <div className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-lg border border-orange-200">
            💤 Fatigued - reduced performance
          </div>
        )}
      </div>


    </div>
  )
}