'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useGame } from '@/context/GameContext'
import { supabase } from '@/lib/supabase'

interface DecisionHistory {
  stage_number: number
  decision: string
  points_earned: number
  timestamp: string
}

interface ReflectionData {
  stage_number: number
  decision_reasoning: string
  emotional_response: string
}

interface DebriefModalProps {
  isVisible: boolean
  onClose: () => void
}

export default function DebriefModal({ isVisible, onClose }: DebriefModalProps) {
  const router = useRouter()
  const { state } = useGame()
  const [decisionHistory, setDecisionHistory] = useState<DecisionHistory[]>([])
  const [reflections, setReflections] = useState<ReflectionData[]>([])
  const [loading, setLoading] = useState(true)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [finalStats, setFinalStats] = useState({
    totalPoints: 0,
    finalStamina: 0,
    sprintCount: 0,
    cruiseCount: 0,
    teamRank: 0,
    individualRank: 0
  })

  // Define loadDebriefData first before using it in useEffect
  const loadDebriefData = useCallback(async () => {
    if (!state.currentCyclist || !state.session) return

    try {
      setLoading(true)
      console.log('🏆 Loading debrief data for session:', state.session.id)

      // Load decision history
      const { data: decisions } = await supabase
        .from('decisions_log')
        .select('stage_number, decision, points_earned, timestamp')
        .eq('session_id', state.session.id)
        .eq('cyclist_id', state.currentCyclist.id)
        .order('stage_number')

      if (decisions) {
        setDecisionHistory(decisions)
        
        // Calculate stats
        const totalPoints = decisions.reduce((sum, d) => sum + (d.points_earned || 0), 0)
        const sprintCount = decisions.filter(d => d.decision === 'sprint').length
        const cruiseCount = decisions.filter(d => d.decision === 'cruise').length

        setFinalStats(prev => ({
          ...prev,
          totalPoints,
          sprintCount,
          cruiseCount,
          finalStamina: state.currentCyclist?.stamina || 0
        }))
      }

      // Load reflections
      const { data: reflectionData } = await supabase
        .from('reflections')
        .select('stage_number, decision_reasoning, emotional_response')
        .eq('session_id', state.session.id)
        .eq('cyclist_id', state.currentCyclist.id)
        .order('stage_number')

      if (reflectionData) {
        setReflections(reflectionData)
      }

    } catch (error) {
      console.error('Error loading debrief data:', error)
    } finally {
      setLoading(false)
      setDataLoaded(true) // Mark data as loaded to prevent re-loading
    }
  }, [state.currentCyclist, state.session])

  // Now we can use loadDebriefData in useEffects since it's defined above
  useEffect(() => {
    if (isVisible && state.currentCyclist?.id && state.session?.id && !dataLoaded) {
      loadDebriefData()
    }
  }, [isVisible, state.currentCyclist?.id, state.session?.id, dataLoaded, loadDebriefData])

  // Reset data flag when modal closes so it can be reloaded if opened again
  useEffect(() => {
    if (!isVisible && dataLoaded) {
      setDataLoaded(false)
      setLoading(true)
    }
  }, [isVisible, dataLoaded])

  const handlePlayAgain = () => {
    // Clear cache and go to login to join a new game
    localStorage.removeItem('gameSession')
    sessionStorage.removeItem('gameSession')
    router.push('/login')
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-rubicon-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">🏁 Game Complete!</h2>
              <p className="text-blue-100">Your cycling journey results</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rubicon-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your results...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Final Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{finalStats.totalPoints}</div>
                  <div className="text-sm text-green-700">Total Points</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{finalStats.finalStamina}</div>
                  <div className="text-sm text-blue-700">Final Stamina</div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{finalStats.sprintCount}</div>
                  <div className="text-sm text-orange-700">Sprint Decisions</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{finalStats.cruiseCount}</div>
                  <div className="text-sm text-purple-700">Cruise Decisions</div>
                </div>
              </div>

              {/* Decision History */}
              <div>
                <h3 className="text-xl font-semibold mb-4">📊 Your Decision History</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                    {decisionHistory.map((decision, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded text-center text-sm font-medium ${
                          decision.decision === 'sprint'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        <div className="font-bold">Stage {decision.stage_number}</div>
                        <div className="capitalize">{decision.decision}</div>
                        <div className="text-xs">+{decision.points_earned || 0} pts</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reflections */}
              {reflections.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">🧠 Your Reflections</h3>
                  <div className="space-y-4">
                    {reflections.map((reflection, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Stage {reflection.stage_number} Reflection
                        </h4>
                        <div className="space-y-2">
                          <div>
                            <span className="font-medium text-gray-700">Decision Reasoning:</span>
                            <p className="text-gray-600 text-sm">{reflection.decision_reasoning}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Emotional Response:</span>
                            <p className="text-gray-600 text-sm">{reflection.emotional_response}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                <button
                  onClick={handlePlayAgain}
                  className="flex-1 bg-gradient-to-r from-rubicon-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-rubicon-700 hover:to-blue-700 transition-all"
                >
                  🎮 Play Again
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                >
                  Close Results
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}