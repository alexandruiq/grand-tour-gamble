'use client'

import { useState, useEffect } from 'react'
import { useGame } from '@/context/GameContext'
import { supabase } from '@/lib/supabase'

interface NegotiationModalProps {
  isVisible: boolean
  currentStage: number
  sessionId: string
  teamName: string
}

interface TeamStrategy {
  team_name: string
  intended_decision: 'sprint' | 'cruise' | null
  is_ready: boolean
}

export default function NegotiationModal({ 
  isVisible, 
  currentStage, 
  sessionId,
  teamName 
}: NegotiationModalProps) {
  const [selectedDecision, setSelectedDecision] = useState<'sprint' | 'cruise' | null>(null)
  const [confirmedDecision, setConfirmedDecision] = useState<'sprint' | 'cruise' | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [teamStrategies, setTeamStrategies] = useState<TeamStrategy[]>([])
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0)

  // Load negotiation data when modal opens
  useEffect(() => {
    if (isVisible && sessionId) {
      loadNegotiationData()
      setupRealtimeSubscription()
    }
  }, [isVisible, sessionId, currentStage])

  const loadNegotiationData = async () => {
    try {
      // Load current session multiplier info
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('current_multiplier')
        .eq('id', sessionId)
        .single()

      if (sessionData) {
        setCurrentMultiplier(sessionData.current_multiplier)
      }

      // Load all team strategies for this negotiation
      const { data: strategies } = await supabase
        .from('team_strategies')
        .select('*')
        .eq('session_id', sessionId)
        .eq('stage_number', currentStage)

      if (strategies) {
        setTeamStrategies(strategies)
        
        // Find our team's current strategy
        const ourStrategy = strategies.find(s => s.team_name === teamName)
        if (ourStrategy) {
          setConfirmedDecision(ourStrategy.intended_decision)
          setIsReady(ourStrategy.is_ready)
          setSelectedDecision(null) // Clear selection since it's already confirmed
        }
      }
    } catch (error) {
      console.error('Error loading negotiation data:', error)
    }
  }

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('negotiation-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'team_strategies' },
        () => {
          loadNegotiationData()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  // Select a decision (but don't save it yet)
  const handleSelectDecision = (decision: 'sprint' | 'cruise') => {
    if (confirmedDecision || isSubmitting) return
    setSelectedDecision(decision)
  }

  // Clear selection
  const handleClearSelection = () => {
    if (confirmedDecision) return
    setSelectedDecision(null)
  }

  // Confirm and save the negotiation strategy
  const handleConfirmStrategy = async () => {
    if (!selectedDecision || isSubmitting || confirmedDecision) return
    
    setIsSubmitting(true)
    console.log('🤝 Confirming negotiation strategy:', selectedDecision)

    try {
      const { error } = await supabase
        .from('team_strategies')
        .upsert({
          session_id: sessionId,
          stage_number: currentStage,
          team_name: teamName,
          intended_decision: selectedDecision,
          is_ready: false // Start as not ready, they need to separately confirm readiness
        }, {
          onConflict: 'session_id,stage_number,team_name'
        })

      if (error) throw error

      setConfirmedDecision(selectedDecision)
      setSelectedDecision(null)
      console.log('✅ Negotiation strategy confirmed:', selectedDecision)
    } catch (error) {
      console.error('❌ Error saving negotiation strategy:', error)
      setSelectedDecision(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReadyToggle = async () => {
    if (!confirmedDecision) return

    const newReadyState = !isReady
    setIsReady(newReadyState)
    setIsSubmitting(true)

    try {
      console.log('🎯 Setting team readiness:', newReadyState)
      const { error } = await supabase
        .from('team_strategies')
        .update({
          is_ready: newReadyState
        })
        .eq('session_id', sessionId)
        .eq('stage_number', currentStage)
        .eq('team_name', teamName)

      if (error) throw error
      console.log('✅ Team readiness updated:', newReadyState)
    } catch (error) {
      console.error('❌ Error updating ready status:', error)
      setIsReady(!newReadyState) // Revert on error
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isVisible) return null

  const negotiationStages = [4, 7, 9]
  const isNegotiationStage = negotiationStages.includes(currentStage)

  if (!isNegotiationStage) return null

  const allTeamsReady = teamStrategies.length === 4 && teamStrategies.every(t => t.is_ready)
  const alignedTeams = teamStrategies.filter(t => t.intended_decision === (confirmedDecision || selectedDecision)).length
  const hasSelection = selectedDecision !== null
  const isConfirmed = confirmedDecision !== null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold">🤝 Team Negotiation</h2>
            <p className="text-yellow-100">Stage {currentStage} Strategy Discussion</p>
            <div className="mt-2 text-sm">
              Current Multiplier: <span className="font-bold">x{currentMultiplier}</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Negotiation Rules */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">🎯 Coordination Bonus</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <div>• <strong>4 teams align</strong> → x2.0 multiplier</div>
              <div>• <strong>3 teams align</strong> → x1.5 multiplier</div>
              <div>• <strong>Less alignment</strong> → x1.0 multiplier</div>
            </div>
          </div>

          {/* Team Strategy Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Your Team's Strategy</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <button
                onClick={() => handleSelectDecision('cruise')}
                disabled={isConfirmed || isSubmitting}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedDecision === 'cruise' || confirmedDecision === 'cruise'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : !isConfirmed && !isSubmitting
                    ? 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                    : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <div className="text-xl font-bold">
                  🚴 Cruise {confirmedDecision === 'cruise' ? '✅' : ''}
                </div>
                <div className="text-sm">Conserve energy</div>
              </button>
              <button
                onClick={() => handleSelectDecision('sprint')}
                disabled={isConfirmed || isSubmitting}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedDecision === 'sprint' || confirmedDecision === 'sprint'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : !isConfirmed && !isSubmitting
                    ? 'border-gray-300 bg-white text-gray-700 hover:border-red-300'
                    : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <div className="text-xl font-bold">
                  🏃 Sprint {confirmedDecision === 'sprint' ? '✅' : ''}
                </div>
                <div className="text-sm">Push hard</div>
              </button>
            </div>

            {/* Confirmation Buttons */}
            {hasSelection && !isConfirmed && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={handleClearSelection}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all"
                >
                  Clear
                </button>
                <button
                  onClick={handleConfirmStrategy}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-all"
                >
                  {isSubmitting ? '⏳ Confirming...' : `✅ Confirm ${selectedDecision === 'sprint' ? 'Sprint' : 'Cruise'}`}
                </button>
              </div>
            )}

            {/* Ready Toggle - Only available after confirming strategy */}
            {isConfirmed && (
              <button
                onClick={handleReadyToggle}
                disabled={isSubmitting}
                className={`w-full p-3 rounded-lg font-semibold transition-all ${
                  isReady
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-yellow-500 text-white hover:bg-yellow-600'
                }`}
              >
                {isSubmitting 
                  ? '⏳ Updating...' 
                  : isReady 
                    ? '✅ Ready to Proceed' 
                    : '🔔 Mark Team as Ready'
                }
              </button>
            )}

            {/* Status Messages */}
            {isConfirmed && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <div className="text-green-600 font-medium">
                  ✅ Strategy confirmed: {confirmedDecision === 'sprint' ? '🏃 Sprint' : '🚴 Cruise'}
                </div>
                <div className="text-green-500 text-sm mt-1">
                  {isReady ? 'Ready for trainer to proceed' : 'Mark as ready when team agrees'}
                </div>
              </div>
            )}
          </div>

          {/* Team Status Overview */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">All Teams Status</h3>
            <div className="space-y-2">
              {['Team Alpha', 'Team Beta', 'Team Gamma', 'Team Delta'].map((team) => {
                const strategy = teamStrategies.find(s => s.team_name === team)
                const isOurTeam = team === teamName
                
                return (
                  <div
                    key={team}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isOurTeam ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className={`font-medium ${isOurTeam ? 'text-blue-900' : 'text-gray-900'}`}>
                        {team} {isOurTeam && '(You)'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-600">
                        {strategy?.intended_decision ? (
                          <span className={strategy.intended_decision === 'sprint' ? 'text-red-600' : 'text-blue-600'}>
                            {strategy.intended_decision === 'sprint' ? '🏃 Sprint' : '🚴 Cruise'}
                          </span>
                        ) : (
                          <span className="text-gray-400">Deciding...</span>
                        )}
                      </span>
                      <div className={`w-3 h-3 rounded-full ${
                        strategy?.is_ready ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Alignment Preview */}
          {(confirmedDecision || selectedDecision) && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold mb-2">Potential Alignment</h4>
              <div className="text-sm text-gray-600">
                {alignedTeams > 0 && (
                  <div>
                    <span className="font-medium">{alignedTeams} team(s)</span> considering{' '}
                    <span className={(confirmedDecision || selectedDecision) === 'sprint' ? 'text-red-600' : 'text-blue-600'}>
                      {confirmedDecision || selectedDecision}
                    </span>
                    {alignedTeams >= 3 && (
                      <span className="ml-2 text-green-600 font-medium">
                        → Potential {alignedTeams === 4 ? 'x2.0' : 'x1.5'} bonus!
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Messages */}
          {allTeamsReady && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-green-800 font-semibold">
                🎉 All teams are ready! Waiting for trainer to finalize...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}