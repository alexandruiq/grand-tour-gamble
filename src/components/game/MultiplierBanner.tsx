'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface MultiplierBannerProps {
  sessionId: string
  currentStage: number
}

interface NegotiationData {
  multiplier: number
  is_open: boolean
  stage_number: number
}

export default function MultiplierBanner({ sessionId, currentStage }: MultiplierBannerProps) {
  const [negotiationData, setNegotiationData] = useState<NegotiationData | null>(null)
  const [sessionMultiplier, setSessionMultiplier] = useState<number>(1.0)
  const [isNegotiationStage, setIsNegotiationStage] = useState(false)

  // Load negotiation data
  const loadNegotiationData = async () => {
    try {
      // Check if current stage has active negotiation
      const { data: negotiation, error: negError } = await supabase
        .from('negotiations')
        .select('*')
        .eq('session_id', sessionId)
        .eq('stage_number', currentStage)
        .single()

      if (negotiation && !negError) {
        setNegotiationData(negotiation)
        setIsNegotiationStage(negotiation.is_open)
      } else {
        setNegotiationData(null)
        setIsNegotiationStage(false)
      }

      // Get session multiplier
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('current_multiplier, multiplier_active')
        .eq('id', sessionId)
        .single()

      if (session && !sessionError) {
        setSessionMultiplier(session.current_multiplier || 1.0)
      }
    } catch (err) {
      console.error('Error loading negotiation data:', err)
    }
  }

  useEffect(() => {
    loadNegotiationData()

    // Subscribe to negotiation changes
    const negotiationSubscription = supabase
      .channel('negotiation-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'negotiations', filter: `session_id=eq.${sessionId}` },
        () => loadNegotiationData()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` },
        () => loadNegotiationData()
      )
      .subscribe()

    return () => {
      negotiationSubscription.unsubscribe()
    }
  }, [sessionId, currentStage])

  // Check if this is a negotiation stage (4, 7, 9)
  const isNegotiationStageNumber = [4, 7, 9].includes(currentStage)

  if (!isNegotiationStageNumber && sessionMultiplier <= 1.0) {
    return null // No banner needed for non-negotiation stages with no multiplier
  }

  return (
    <div className={`w-full border rounded-lg p-4 mb-4 ${
      isNegotiationStage 
        ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300' 
        : sessionMultiplier > 1.0 
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
          : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Multiplier Display */}
          <div className="flex items-center space-x-2">
            <span className="text-lg">⚡</span>
            <div>
              <div className="text-sm font-medium text-slate-700">Current Multiplier</div>
              <div className={`text-2xl font-bold ${
                sessionMultiplier >= 2.0 ? 'text-green-600' :
                sessionMultiplier >= 1.5 ? 'text-yellow-600' : 
                'text-slate-600'
              }`}>
                x{sessionMultiplier.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Stage Info */}
          <div className="border-l border-slate-300 pl-4">
            <div className="text-sm font-medium text-slate-700">Stage {currentStage}</div>
            <div className="text-sm text-slate-600">
              {isNegotiationStageNumber ? 'Negotiation Stage' : 'Regular Stage'}
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center space-x-3">
          {isNegotiationStage && (
            <div className="flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
              <span className="animate-pulse">🤝</span>
              <span>Negotiation Active</span>
            </div>
          )}
          
          {sessionMultiplier > 1.0 && !isNegotiationStage && (
            <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              <span>🎯</span>
              <span>Bonus Active</span>
            </div>
          )}

          {isNegotiationStageNumber && !isNegotiationStage && (
            <div className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              <span>💭</span>
              <span>Ready for Negotiation</span>
            </div>
          )}
        </div>
      </div>

      {/* Negotiation Details */}
      {isNegotiationStage && negotiationData && (
        <div className="mt-3 pt-3 border-t border-yellow-200">
          <div className="text-sm text-slate-600">
            <span className="font-medium">Potential Multipliers:</span>
            <span className="ml-2">3/4 teams aligned = x1.5 • 4/4 teams aligned = x2.0</span>
          </div>
        </div>
      )}

      {/* Multiplier Explanation */}
      {sessionMultiplier > 1.0 && !isNegotiationStage && (
        <div className="mt-3 pt-3 border-t border-green-200">
          <div className="text-sm text-green-700">
            <span className="font-medium">🎉 Team Alignment Bonus:</span>
            <span className="ml-2">
              {sessionMultiplier >= 2.0 ? 'Perfect alignment achieved!' : 'Strong team coordination!'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}