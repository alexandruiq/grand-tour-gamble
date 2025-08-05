'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '@/lib/useTheme'
import { supabase } from '@/lib/supabase'

interface CyclistCode {
  id: string
  cyclist_name: string
  code: string
  team_name: string | null
  assigned_to: string | null
  created_at: string
  cyclists?: {
    name: string
    character_role: string
  }
}

interface AccessCodesTabProps {
  sessionId: string
}

export default function AccessCodesTab({
  sessionId
}: AccessCodesTabProps) {
  const theme = useTheme()
  const [codes, setCodes] = useState<CyclistCode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadAccessCodes = useCallback(async () => {
    setIsLoading(true)
    try {
      console.log(`🔍 Loading access codes for session ${sessionId}`)
      
      const { data: codesData, error: codesError } = await supabase
        .from('cyclist_codes')
        .select(`
          id,
          cyclist_name,
          code,
          team_name,
          assigned_to,
          created_at,
          cyclists!cyclist_id (
            name,
            character_role
          )
        `)
        .eq('session_id', sessionId)
        .order('cyclist_name')

      if (codesError) throw codesError

      setCodes(codesData || [])
      console.log(`✅ Loaded ${codesData?.length || 0} access codes`)
    } catch (error) {
      console.error('Error loading access codes:', error)
      setError(error instanceof Error ? error.message : 'Failed to load access codes')
      setCodes([])
    } finally {
      setIsLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    loadAccessCodes()
  }, [loadAccessCodes])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      console.log('📋 Copied to clipboard:', text)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getStatusColor = (code: CyclistCode) => {
    if (code.team_name && code.team_name.trim() !== '') {
      return theme.colors.primary // Joined
    }
    return theme.colors.text + '60' // Not joined yet
  }

  const getStatusText = (code: CyclistCode) => {
    if (code.team_name && code.team_name.trim() !== '') {
      return `✅ Joined as "${code.team_name}"`
    }
    return '⏳ Waiting for player'
  }

  if (isLoading) {
    return (
      <div 
        className="p-6 text-center"
        style={{
          backgroundColor: theme.colors.background,
          color: theme.colors.text,
          fontFamily: theme.fonts.primary
        }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" 
             style={{ borderColor: theme.colors.primary }}></div>
        <p>Loading access codes...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div 
        className="p-6 text-center"
        style={{
          backgroundColor: theme.colors.background,
          color: theme.colors.alert,
          fontFamily: theme.fonts.primary
        }}
      >
        <div className="text-4xl mb-4">❌</div>
        <h3 className="text-lg font-bold mb-2">Error Loading Access Codes</h3>
        <p className="mb-4">{error}</p>
        <button
          onClick={loadAccessCodes}
          className="px-4 py-2 rounded-lg transition-all"
          style={{
            backgroundColor: theme.colors.primary,
            color: theme.colors.background
          }}
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div 
      className="p-6"
      style={{
        backgroundColor: theme.colors.background
      }}
    >
      <div className="mb-6">
        <h3 
          className="text-xl font-bold mb-2"
          style={{
            color: theme.colors.text,
            fontFamily: theme.fonts.primary,
            fontWeight: theme.fonts.headingWeight
          }}
        >
          🔐 Player Access Codes
        </h3>
        <p 
          className="text-sm"
          style={{
            color: theme.colors.text + '70',
            fontFamily: theme.fonts.primary
          }}
        >
          Share these codes with players to join the game. Click any code to copy it.
        </p>
      </div>

      {codes.length === 0 ? (
        <div 
          className="text-center py-12"
          style={{
            color: theme.colors.text + '60',
            fontFamily: theme.fonts.primary
          }}
        >
          <div className="text-4xl mb-4">📝</div>
          <p>No access codes found for this session</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {codes.map((code) => (
            <div 
              key={code.id}
              className="rounded-lg border p-4 transition-all hover:shadow-md"
              style={{
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.accent + '30',
                borderRadius: theme.borders.radius
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-lg">🚴‍♂️</span>
                    <div>
                      <h4 
                        className="font-bold"
                        style={{
                          color: theme.colors.text,
                          fontFamily: theme.fonts.primary
                        }}
                      >
                        {code.cyclist_name}
                      </h4>
                      <div 
                        className="text-xs"
                        style={{
                          color: theme.colors.text + '70',
                          fontFamily: theme.fonts.primary
                        }}
                      >
                        {code.cyclists?.character_role || 'Unknown Role'}
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className="text-sm"
                    style={{
                      color: getStatusColor(code),
                      fontFamily: theme.fonts.primary
                    }}
                  >
                    {getStatusText(code)}
                  </div>
                </div>

                <div className="text-right">
                  <button
                    onClick={() => copyToClipboard(code.code)}
                    className="px-4 py-2 rounded-lg transition-all hover:scale-105 mb-2"
                    style={{
                      backgroundColor: theme.colors.primary,
                      color: theme.colors.background,
                      fontFamily: theme.fonts.primary,
                      borderRadius: theme.borders.buttonRadius
                    }}
                    title="Click to copy code"
                  >
                    <div className="font-mono text-lg font-bold">{code.code}</div>
                  </button>
                  
                  <div 
                    className="text-xs"
                    style={{
                      color: theme.colors.text + '50',
                      fontFamily: theme.fonts.primary
                    }}
                  >
                    Click to copy
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div 
        className="mt-6 p-4 rounded-lg border"
        style={{
          backgroundColor: theme.colors.card + '80',
          borderColor: theme.colors.accent + '20'
        }}
      >
        <div className="flex items-center justify-between text-sm">
          <div 
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.primary
            }}
          >
            📊 Summary
          </div>
          
          <div className="flex space-x-6">
            <div 
              style={{
                color: theme.colors.text + '80',
                fontFamily: theme.fonts.primary
              }}
            >
              Total Codes: {codes.length}
            </div>
            <div 
              style={{
                color: theme.colors.primary,
                fontFamily: theme.fonts.primary
              }}
            >
              Joined: {codes.filter(c => c.team_name && c.team_name.trim() !== '').length}
            </div>
            <div 
              style={{
                color: theme.colors.alert,
                fontFamily: theme.fonts.primary
              }}
            >
              Waiting: {codes.filter(c => !c.team_name || c.team_name.trim() === '').length}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}