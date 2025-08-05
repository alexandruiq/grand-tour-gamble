'use client'

import React, { useState, useEffect } from 'react'
import { useGame } from '@/context/GameContext'
import { supabase } from '@/lib/supabase'

interface DecisionButtonsProps {
  disabled?: boolean
  onDecision?: (decision: 'sprint' | 'cruise') => void
  currentStamina: number
  className?: string
}

const DecisionButtons = React.memo(function DecisionButtons({ 
  disabled = false, 
  onDecision,
  currentStamina,
  className = '' 
}: DecisionButtonsProps) {
  const [selectedDecision, setSelectedDecision] = useState<'sprint' | 'cruise' | null>(null)
  const [confirmedDecision, setConfirmedDecision] = useState<'sprint' | 'cruise' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingExisting, setIsLoadingExisting] = useState(true)
  const { makeDecision, state } = useGame()

  // Select a decision (but don't save it yet)
  const handleSelectDecision = (decision: 'sprint' | 'cruise') => {
    if (disabled || isSubmitting || confirmedDecision) return
    setSelectedDecision(decision)
  }

  // Confirm and save the decision
  const handleConfirmDecision = async () => {
    if (!selectedDecision || disabled || isSubmitting || confirmedDecision) return
    
    setIsSubmitting(true)

    try {
      await makeDecision(selectedDecision)
      setConfirmedDecision(selectedDecision)
      onDecision?.(selectedDecision)
      console.log('✅ Decision confirmed successfully:', selectedDecision)
    } catch (error: unknown) {
      console.error('💥 Error confirming decision:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        selectedDecision,
        error
      })
      
      // Show user-friendly error message
      if (error?.message?.includes('already submitted')) {
        // Decision already exists - reload to get current state
        console.log('ℹ️ Decision already exists, reloading current state...')
        await loadExistingDecision() // Reload to show the existing decision
        setSelectedDecision(null)
        // Don't re-throw - this is handled gracefully
        return
      } else {
        // Other error - clear selection and re-throw
        setSelectedDecision(null)
        throw error
      }
    } finally {
      setIsSubmitting(false)
    }
  }



  // Clear previous stage decisions and load for current stage
  useEffect(() => {
    if (!state.currentCyclist?.id || !state.session?.id || !state.session?.current_stage) {
      setIsLoadingExisting(false)
      return
    }

    // Clear previous stage's decision state when stage changes
    setConfirmedDecision(null)
    setSelectedDecision(null)
    
    // Then load existing decision for current stage directly
    const loadExisting = async () => {
      try {
        console.log('🔍 Checking for existing decision for stage', state.session.current_stage)
        
        const { data: existingDecision, error } = await supabase
          .from('decisions_log')
          .select('decision')
          .eq('cyclist_id', state.currentCyclist!.id)
          .eq('session_id', state.session!.id)
          .eq('stage_number', state.session!.current_stage)
          .single()

        if (existingDecision && !error) {
          console.log('✅ Found existing decision:', existingDecision.decision)
          setConfirmedDecision(existingDecision.decision as 'sprint' | 'cruise')
          setSelectedDecision(null)
        } else {
          console.log('🆕 No existing decision found for stage', state.session.current_stage, '- buttons enabled')
          setConfirmedDecision(null)
          setSelectedDecision(null)
          
          if (error && error.code !== 'PGRST116') {
            console.error('Error checking existing decision:', error)
          }
        }
      } catch (error) {
        console.error('Error loading existing decision:', error)
      } finally {
        setIsLoadingExisting(false)
      }
    }
    
    loadExisting()
  }, [state.session?.current_stage, state.currentCyclist?.id, state.session?.id])

  // Clear selection (only if not confirmed)
  const handleClearSelection = () => {
    if (confirmedDecision) return
    setSelectedDecision(null)
  }

  const isLocked = disabled || !state.session?.stage_open || isSubmitting || isLoadingExisting
  const canSprint = currentStamina > 0
  const hasSelection = selectedDecision !== null
  const isConfirmed = confirmedDecision !== null

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Decision Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {/* Sprint Button - Hidden when no stamina */}
        {canSprint ? (
          <button
            onClick={() => handleSelectDecision('sprint')}
            disabled={isLocked || isConfirmed}
            title="Sprint: Push hard for maximum points. Cost: -1 Stamina."
            className={`p-3 rounded-lg border-2 font-semibold text-center transition-all duration-200 ${
              selectedDecision === 'sprint' || confirmedDecision === 'sprint'
                ? 'bg-red-500 text-white border-red-500 shadow-lg'
                : !isLocked && !isConfirmed
                ? 'bg-white text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 shadow-md'
                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            }`}
          >
            <div className="text-lg font-bold">
              🚀 Sprint {confirmedDecision === 'sprint' ? '✅' : ''}
            </div>
          </button>
        ) : (
          <div className="p-3 rounded-lg border-2 bg-red-50 border-red-200 text-center">
            <div className="text-sm font-medium text-red-600 mb-1">
              ⚠️ No stamina! Sprinting is unavailable.
            </div>
            <div className="text-xs text-red-500">
              You must choose Cruise.
            </div>
          </div>
        )}

        {/* Cruise Button */}
        <button
          onClick={() => handleSelectDecision('cruise')}
          disabled={isLocked || isConfirmed}
          title="Cruise: Conserve energy and build synergy. Benefit: +1 Stamina (if team synergy ≥ 50%)"
          className={`p-3 rounded-lg border-2 font-semibold text-center transition-all duration-200 ${
            selectedDecision === 'cruise' || confirmedDecision === 'cruise'
              ? 'bg-blue-500 text-white border-blue-500 shadow-lg'
              : !isLocked && !isConfirmed
              ? 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400 shadow-md'
              : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
          }`}
        >
          <div className="text-lg font-bold">
            🛡️ Cruise {confirmedDecision === 'cruise' ? '✅' : ''}
          </div>
        </button>
      </div>

      {/* Confirmation Buttons */}
      {hasSelection && !isConfirmed && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleClearSelection}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all"
          >
            Clear
          </button>
          <button
            onClick={handleConfirmDecision}
            disabled={isSubmitting}
            className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-all"
          >
            {isSubmitting ? '⏳ Confirming...' : `✅ Confirm ${selectedDecision === 'sprint' ? 'Sprint' : 'Cruise'}`}
          </button>
        </div>
      )}

      {/* Status Messages */}
      {isLoadingExisting && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <div className="text-blue-600 font-medium">Loading existing decision...</div>
        </div>
      )}

      {isSubmitting && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
          <div className="text-yellow-600 font-medium">Confirming decision...</div>
        </div>
      )}

      {isConfirmed && (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 text-center shadow-md">
          <div className="text-green-600 font-bold text-lg">
            ✅ Decision confirmed: {confirmedDecision === 'sprint' ? '🚀 Sprint' : '🛡️ Cruise'}
          </div>
          <div className="text-green-500 text-sm mt-2">
            Waiting for other cyclists and stage completion...
          </div>
        </div>
      )}

      {isLocked && !selectedDecision && !isConfirmed && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
          <div className="text-gray-600 font-medium">
            {!state.session?.stage_open 
              ? '🚫 Stage closed - waiting for trainer' 
              : '⏳ Decisions not available yet'
            }
          </div>
        </div>
      )}


    </div>
  )
})

export default DecisionButtons