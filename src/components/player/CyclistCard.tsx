'use client'

import { useState } from 'react'

import { Cyclist } from '@/types/game.types'
import { CYCLIST_NAMES } from '@/lib/constants'
import { getCyclistBackstory } from '@/lib/mdx-utils'
import { useTheme } from '@/lib/useTheme'

interface CyclistCardProps {
  cyclist: Cyclist
  className?: string
}

export default function CyclistCard({ cyclist, className = '' }: CyclistCardProps) {
  const [showBackstory, setShowBackstory] = useState(false)
  const theme = useTheme()
  
  const cyclistName = CYCLIST_NAMES[cyclist.character_role] || cyclist.name
  const backstory = getCyclistBackstory(cyclist.character_role)
  
  const getImagePath = (role: string) => {
    // Map character roles to image files
    const imageMap: Record<string, string> = {
      luca: '/cyclists/luca.png',
      jonas: '/cyclists/jonas.png', 
      mateo: '/cyclists/mateo.png',
      kenji: '/cyclists/kenji.png'
    }
    
    return imageMap[role] || '/cyclists/placeholder.png'
  }

  return (
    <div className={`cyclist-card relative ${className}`}>
      {/* Main Card */}
      <div 
        className="overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl rounded-lg border shadow-lg"
        style={{
          backgroundColor: theme.colors.background,
          borderRadius: theme.borders.radius,
          borderColor: theme.colors.accent + '20',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        }}
        onClick={() => setShowBackstory(true)}
      >
        {/* Cyclist Image */}
        <div className="relative min-h-[350px] bg-gradient-to-b from-rubicon-50 to-rubicon-100 overflow-hidden">
          <img
            src={getImagePath(cyclist.character_role)}
            alt={`${cyclistName} - ${cyclist.character_role}`}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4">
            <h3 className="text-white font-bold text-lg">{cyclistName}</h3>
            <p className="text-gray-200 text-sm capitalize">{cyclist.character_role}</p>
          </div>
        </div>

        {/* Cyclist Status */}
        <div className="p-4">
          {cyclist.fatigue_penalty && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2">
              <span className="text-red-600 text-xs font-medium">⚠️ Fatigued</span>
            </div>
          )}
        </div>

        {/* Click hint */}
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-400 text-center">Click to view backstory</p>
        </div>
      </div>

      {/* Backstory Modal */}
      {showBackstory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto transform transition-all duration-300 animate-in fade-in-0 scale-in-95">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{cyclistName}</h2>
                <p className="text-gray-600 capitalize">{cyclist.character_role}</p>
              </div>
              <button
                onClick={() => setShowBackstory(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Backstory Content */}
            <div className="p-6">
              <div className="prose prose-gray max-w-none">
                <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                  {backstory || `${cyclistName} is a skilled cyclist with a complex background and strong motivation to succeed in The Grand Tour Gamble. Their unique perspective and racing style will influence how they approach each stage of the competition.`}
                </div>
              </div>

              {/* Stats in Modal */}
              <div className="mt-6 grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-rubicon-600">{cyclist.current_points}</div>
                  <div className="text-sm text-gray-600">Current Points</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{cyclist.stamina}/5</div>
                  <div className="text-sm text-gray-600">Stamina</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4 flex justify-end">
              <button
                onClick={() => setShowBackstory(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}