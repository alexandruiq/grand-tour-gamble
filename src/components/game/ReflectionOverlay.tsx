'use client'

import { useState, useEffect } from 'react'
import { useGame } from '@/context/GameContext'
import { supabase } from '@/lib/supabase'

interface ReflectionOverlayProps {
  isVisible: boolean
  currentStage: number
  sessionId: string
  cyclistId: string
}

export default function ReflectionOverlay({ 
  isVisible, 
  currentStage, 
  sessionId, 
  cyclistId 
}: ReflectionOverlayProps) {
  const [decisionReasoning, setDecisionReasoning] = useState('')
  const [emotionalResponse, setEmotionalResponse] = useState('')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [otherDecisions, setOtherDecisions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Load existing reflection if any
  useEffect(() => {
    if (isVisible && sessionId && cyclistId) {
      loadExistingReflection()
      loadOtherDecisions()
    }
  }, [isVisible, sessionId, cyclistId, currentStage])

  const loadExistingReflection = async () => {
    try {
      const { data } = await supabase
        .from('reflections')
        .select('*')
        .eq('session_id', sessionId)
        .eq('cyclist_id', cyclistId)
        .eq('stage_number', currentStage)
        .single()

      if (data) {
        setDecisionReasoning(data.decision_reasoning || '')
        setEmotionalResponse(data.emotional_response || '')
        setHasSubmitted(true)
      }
    } catch (error) {
      console.log('No existing reflection found')
    }
  }

  const loadOtherDecisions = async () => {
    try {
      const { data, error } = await supabase
        .from('decisions_log')
        .select(`
          decision,
          cyclists (
            name,
            character_role,
            teams (name)
          )
        `)
        .eq('session_id', sessionId)
        .eq('stage_number', currentStage)
        .neq('cyclist_id', cyclistId)

      if (data && !error) {
        setOtherDecisions(data)
      } else if (error) {
        console.log('ℹ️ Could not load other decisions:', error.message)
        setOtherDecisions([])
      }
    } catch (error) {
      console.log('ℹ️ Error loading other decisions, using empty state')
      setOtherDecisions([])
    }
  }

  const handleSubmitReflection = async () => {
    if (!decisionReasoning.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('reflections')
        .upsert({
          session_id: sessionId,
          cyclist_id: cyclistId,
          stage_number: currentStage,
          decision_reasoning: decisionReasoning,
          emotional_response: emotionalResponse
        })

      if (error) throw error

      setHasSubmitted(true)
      console.log('✅ Reflection submitted successfully')
    } catch (error) {
      console.error('Error submitting reflection:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-lg">
          <h2 className="text-2xl font-bold">🧠 Reflection Time</h2>
          <p className="text-blue-100 mt-2">
            Stage {currentStage} is complete. Discuss with your team and reflect on your decisions.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Other Team Decisions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              📊 Other Teams' Decisions
            </h3>
            <div className="space-y-2">
              {otherDecisions.map((decision, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-gray-900">
                      {decision.cyclists?.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({decision.cyclists?.teams?.name})
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    decision.decision === 'sprint' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {decision.decision === 'sprint' ? '🏃‍♂️ Sprint' : '🚴‍♂️ Cruise'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Reflection Form */}
          <div className="space-y-4">
            <div>
              <label htmlFor="reasoning" className="block text-sm font-medium text-gray-700 mb-2">
                💭 Why did you make your decision?
              </label>
              <textarea
                id="reasoning"
                value={decisionReasoning}
                onChange={(e) => setDecisionReasoning(e.target.value)}
                placeholder="Explain your reasoning for choosing Sprint or Cruise this stage..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                disabled={hasSubmitted}
              />
            </div>

            <div>
              <label htmlFor="emotion" className="block text-sm font-medium text-gray-700 mb-2">
                😊 How are you feeling about the game so far? (Optional)
              </label>
              <textarea
                id="emotion"
                value={emotionalResponse}
                onChange={(e) => setEmotionalResponse(e.target.value)}
                placeholder="Confident, worried, excited, frustrated, strategic..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                disabled={hasSubmitted}
              />
            </div>

            {!hasSubmitted && (
              <button
                onClick={handleSubmitReflection}
                disabled={!decisionReasoning.trim() || loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '💾 Saving...' : '💾 Save Reflection'}
              </button>
            )}

            {hasSubmitted && (
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <span className="text-green-800 font-medium">
                  ✅ Reflection saved! Waiting for trainer to continue...
                </span>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-600">💡</span>
              <span className="text-yellow-800 font-medium">Discussion Time</span>
            </div>
            <p className="text-yellow-700 text-sm mt-1">
              Use this time to discuss strategy with your team. The trainer will start the next stage when ready.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}