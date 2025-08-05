'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface ReflectionControlsProps {
  sessionId: string
  currentStage: number
  onUpdate: () => void
}

interface ReflectionData {
  cyclist_name: string
  team_name: string
  decision_reasoning: string
  emotional_response: string
  decision: string
}

export default function ReflectionControls({ 
  sessionId, 
  currentStage, 
  onUpdate 
}: ReflectionControlsProps) {
  const [reflectionActive, setReflectionActive] = useState(false)
  const [reflections, setReflections] = useState<ReflectionData[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadReflectionStatus()
    loadReflections()
  }, [sessionId, currentStage])

  const loadReflectionStatus = async () => {
    try {
      const { data } = await supabase
        .from('sessions')
        .select('reflection_active')
        .eq('id', sessionId)
        .single()

      if (data) {
        setReflectionActive(data.reflection_active)
      }
    } catch (error) {
      console.error('Error loading reflection status:', error)
    }
  }

  const loadReflections = async () => {
    try {
      const { data } = await supabase
        .from('reflections')
        .select(`
          decision_reasoning,
          emotional_response,
          cyclists!inner (
            name,
            teams!inner (name)
          )
        `)
        .eq('session_id', sessionId)
        .eq('stage_number', currentStage)

      if (data) {
        // Also get decisions for this stage
        const { data: decisions } = await supabase
          .from('decisions_log')
          .select(`
            decision,
            cyclists!inner (
              name,
              teams!inner (name)
            )
          `)
          .eq('session_id', sessionId)
          .eq('stage_number', currentStage)

        // Combine reflections with decisions
        const combined = data.map((reflection: any) => {
          const cyclistName = reflection.cyclists?.name
          const teamName = reflection.cyclists?.teams?.name
          const decision = decisions?.find((d: any) => d.cyclists?.name === cyclistName)
          return {
            cyclist_name: cyclistName || 'Unknown',
            team_name: teamName || 'Unknown',
            decision_reasoning: reflection.decision_reasoning || '',
            emotional_response: reflection.emotional_response || '',
            decision: decision?.decision || 'none'
          }
        })

        setReflections(combined)
      }
    } catch (error) {
      console.error('Error loading reflections:', error)
    }
  }

  const handleStartReflection = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ reflection_active: true })
        .eq('id', sessionId)

      if (error) throw error

      setReflectionActive(true)
      onUpdate()
      console.log('✅ Reflection period started')
    } catch (error) {
      console.error('Error starting reflection:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEndReflection = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ reflection_active: false })
        .eq('id', sessionId)

      if (error) throw error

      setReflectionActive(false)
      onUpdate()
      console.log('✅ Reflection period ended')
    } catch (error) {
      console.error('Error ending reflection:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            🧠 Reflection Controls
          </h3>
          <p className="text-gray-600 text-sm">
            Stage {currentStage} reflection period
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            reflectionActive 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {reflectionActive ? '🟡 Reflection Active' : '⚪ Reflection Closed'}
          </span>

          {!reflectionActive ? (
            <button
              onClick={handleStartReflection}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
            >
              {loading ? '⏳ Starting...' : '🧠 Start Reflection'}
            </button>
          ) : (
            <button
              onClick={handleEndReflection}
              disabled={loading}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? '⏳ Ending...' : '✅ End Reflection'}
            </button>
          )}
        </div>
      </div>

      {/* Reflection Submissions */}
      {reflections.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">
            📝 Player Reflections ({reflections.length} submitted)
          </h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {reflections.map((reflection, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      {reflection.cyclist_name}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({reflection.team_name})
                    </span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    reflection.decision === 'sprint' 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {reflection.decision === 'sprint' ? '🏃‍♂️ Sprint' : '🚴‍♂️ Cruise'}
                  </span>
                </div>
                
                {reflection.decision_reasoning && (
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-700">Reasoning: </span>
                    <span className="text-sm text-gray-600">{reflection.decision_reasoning}</span>
                  </div>
                )}
                
                {reflection.emotional_response && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Emotion: </span>
                    <span className="text-sm text-gray-600">{reflection.emotional_response}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {reflectionActive && reflections.length === 0 && (
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <span className="text-blue-700">
            ⏳ Waiting for players to submit their reflections...
          </span>
        </div>
      )}
    </div>
  )
}