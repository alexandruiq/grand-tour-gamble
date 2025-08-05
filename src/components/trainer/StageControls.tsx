'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { calculateAndAwardStageResults } from '@/lib/stage-calculator'

interface StageControlsProps {
  sessionId: string
  currentStage: number
  stageOpen: boolean
  stageLocked: boolean
  onUpdate: () => void
}

export default function StageControls({ 
  sessionId, 
  currentStage, 
  stageOpen, 
  stageLocked,
  onUpdate 
}: StageControlsProps) {
  const [loading, setLoading] = useState(false)



  const handleOpenStage = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ 
          stage_locked: false,
          status: 'active'
        })
        .eq('id', sessionId)

      if (error) throw error
      
      onUpdate()
      console.log(`✅ Stage ${currentStage} opened for decisions`)
    } catch (error) {
      console.error('Error opening stage:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEndStage = async () => {
    setLoading(true)
    try {
      console.log(`🎯 Ending stage ${currentStage} and calculating results...`)
      
      // First, lock the stage
      const { error: updateError } = await supabase
        .from('sessions')
        .update({ 
          stage_locked: true 
        })
        .eq('id', sessionId)

      if (updateError) throw updateError

      // Call the calculate results function
      await calculateAndAwardStageResults(sessionId, currentStage)
      
      // Force refresh all game state data after calculation
      console.log('🔄 Forcing game state refresh after stage calculation...')
      
      onUpdate()
      console.log(`✅ Stage ${currentStage} ended and results calculated`)
    } catch (error) {
      console.error('Error ending stage:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartStageOne = async () => {
    setLoading(true)
    try {
      console.log('🎮 Starting Stage 1 - Game Begin!')
      
      const { error } = await supabase
        .from('sessions')
        .update({ 
          current_stage: 1,
          stage_locked: false,
          status: 'active'
        })
        .eq('id', sessionId)

      if (error) throw error
      
      onUpdate()
      console.log('✅ Stage 1 started! Players can now make decisions.')
    } catch (error) {
      console.error('Error starting Stage 1:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartNextStage = async () => {
    setLoading(true)
    try {
      const nextStage = Math.min(10, currentStage + 1)
      
      const { error } = await supabase
        .from('sessions')
        .update({ 
          current_stage: nextStage,
          stage_locked: false 
        })
        .eq('id', sessionId)

      if (error) throw error
      
      onUpdate()
      console.log(`✅ Advanced to stage ${nextStage} and opened for decisions`)
    } catch (error) {
      console.error('Error starting next stage:', error)
    } finally {
      setLoading(false)
    }
  }

  const canAdvance = currentStage < 10

  console.log('🎮 StageControls Debug:', { 
    currentStage, 
    stageOpen, 
    stageLocked,
    showStartButton: currentStage === 1 && !stageOpen,
    showEndButton: stageOpen 
  })

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            🎮 Stage Controls
          </h3>
          <p className="text-gray-600 text-sm">
            Stage {currentStage} of 10 • Status: {stageOpen ? 'Open' : 'Locked'}
          </p>
        </div>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${
            stageOpen ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-sm text-gray-600">
            {stageOpen ? 'Players can make decisions' : 'Stage locked'}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {/* Simplified Stage Controls */}
        <div className="grid grid-cols-2 gap-3">

          {/* Start Stage 1 - Special button for initial game start */}
          {currentStage === 1 && !stageOpen && (
            <button
              onClick={handleStartStageOne}
              disabled={loading}
              className="col-span-2 bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-lg font-bold hover:from-green-600 hover:to-blue-600 disabled:opacity-50 transition-all shadow-lg"
            >
              {loading ? '⏳ Starting Game...' : '🚀 Start Stage 1 - Begin Game!'}
            </button>
          )}
          
          {/* End Current Stage - Available when stage is open */}
          {stageOpen && (
            <button
              onClick={handleEndStage}
              disabled={loading}
              className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50 transition-all"
            >
              {loading ? '⏳' : '🔴'} End Stage {currentStage}
            </button>
          )}

          {/* When a stage is closed, show either Reopen OR Advance options */}
          {!stageOpen && currentStage > 1 && (
            <>
              <button
                onClick={handleOpenStage}
                disabled={loading}
                className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 transition-all"
              >
                {loading ? '⏳' : '▶️'} Reopen Stage {currentStage}
              </button>
              {canAdvance && (
                <button
                  onClick={handleStartNextStage}
                  disabled={loading}
                  className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50 transition-all"
                >
                  {loading ? '⏳' : '⏭️'} Advance to Stage {currentStage + 1}
                </button>
              )}
            </>
          )}

          {/* For Stage 1, only show Advance after it's ended */}
          {!stageOpen && currentStage === 1 && canAdvance && (
            <button
              onClick={handleStartNextStage}
              disabled={loading}
              className="col-span-2 bg-blue-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-600 disabled:opacity-50 transition-all shadow-lg"
            >
              {loading ? '⏳ Advancing...' : '⏭️ Advance to Stage 2'}
            </button>
          )}
        </div>

        {/* Stage Status Information */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Current Stage:</span>
              <span className="font-medium">{currentStage} / 10</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium ${
                stageOpen ? 'text-green-600' : 'text-red-600'
              }`}>
                {stageOpen ? 'Players can make decisions' : 'Stage locked'}
              </span>
            </div>
            {currentStage === 10 && stageLocked && (
              <div className="flex justify-between">
                <span className="text-gray-600">Game Status:</span>
                <span className="font-medium text-blue-600">
                  Ready for debrief
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="font-semibold text-blue-900 text-sm mb-1">Game Flow:</h4>
          <div className="text-xs text-blue-800 space-y-1">
            {stageOpen ? (
              <>
                <div><strong>✅ Stage {currentStage} is active</strong> → Players can now make decisions</div>
                <div className="mt-2 text-green-600">💡 Players should be able to choose Sprint or Cruise</div>
                <div className="mt-1 text-blue-600">🔄 If players can't make decisions, check the game page</div>
              </>
            ) : currentStage === 1 ? (
              <>
                <div><strong>🏁 Stage 1 Complete</strong> → Ready to advance to Stage 2</div>
                <div className="mt-2 text-blue-600">💡 Click "Advance to Stage 2" to continue the game!</div>
              </>
            ) : (
              <>
                <div><strong>🏁 Stage {currentStage} Complete</strong> → Choose next action:</div>
                <div className="mt-1">• <strong>Reopen Stage</strong> → Let players make more decisions</div>
                <div>• <strong>Advance Stage</strong> → Move to Stage {currentStage + 1}</div>
                <div className="mt-2 text-blue-600">💡 Advancing automatically opens the next stage</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}