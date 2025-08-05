'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useGamePersistence } from '@/hooks/useGamePersistence'
import { useTheme } from '@/lib/useTheme'

interface CyclistData {
  id: string
  session_id: string
  cyclist_name: string
  cyclist_id: string
  code: string
  team_name: string | null
  sessions: {
    id: string
    title: string
    status: string
    current_stage: number
  }
  cyclists?: {
    id: string
    name: string
    character_role: string
    stamina: number
    current_points: number
  }
}

export default function LoginPage() {
  const [joinCode, setJoinCode] = useState('')
  const [teamName, setTeamName] = useState('')
  const [isValidatingCode, setIsValidatingCode] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState('')
  const [cyclistData, setCyclistData] = useState<CyclistData | null>(null)
  const [isCodeValidated, setIsCodeValidated] = useState(false)
  const [teamNameReadOnly, setTeamNameReadOnly] = useState(false)
  
  const router = useRouter()
  const theme = useTheme()
  const { 
    cachedSession, 
    saveToCache, 
    clearCache, 
    updateCache,
    hasValidSession,
    getCachedJoinCode,
    getCachedTeamName,
    isCodeValidated: wasPreviouslyValidated
  } = useGamePersistence()

  // Check for existing session on mount
  useEffect(() => {
    // Wait for cache to load
    if (cachedSession === null) return

    // If we have a complete valid session, redirect to game (with delay to prevent loops)
    if (hasValidSession()) {
      console.log('🔄 Login: Valid session found, redirecting to game')
      setTimeout(() => router.push('/game'), 100)
      return
    }

    // If we have a cached join code, pre-fill it
    const cachedCode = getCachedJoinCode()
    if (cachedCode && !isCodeValidated && joinCode !== cachedCode) {
      setJoinCode(cachedCode)
      
      // If the code was previously validated, auto-validate it
      if (wasPreviouslyValidated()) {
        handleValidateCode(cachedCode, true)
      }
    }
  }, [cachedSession, router]) // Removed problematic dependencies

  // Validate cyclist code first
  const handleValidateCode = async (codeToValidate?: string, silent = false) => {
    const code = codeToValidate || joinCode
    
    if (!silent) setIsValidatingCode(true)
    setError('')

    try {
      if (code.length !== 6) {
        throw new Error('Join code must be 6 characters')
      }

      // Validate cyclist code exists in Supabase
      const { data: cyclistCode, error: codeError } = await supabase
        .from('cyclist_codes')
        .select(`
          *,
          sessions (
            id,
            title,
            status,
            current_stage
          ),
          cyclists (
            id,
            name,
            character_role,
            stamina,
            current_points,
            fatigue_penalty
          )
        `)
        .eq('code', code.toUpperCase())
        .single()

      if (codeError || !cyclistCode) {
        throw new Error('Invalid join code. Please check your code and try again.')
      }

      setCyclistData(cyclistCode)
      setIsCodeValidated(true)
      console.log('✅ Code validation successful - isCodeValidated set to true')

      // Save validated code to cache
      updateCache({
        joinCode: code.toUpperCase(),
        cyclistId: cyclistCode.cyclist_id,
        cyclistName: cyclistCode.cyclist_name,
        sessionId: cyclistCode.sessions.id,
        sessionTitle: cyclistCode.sessions.title,
        teamName: '' // Will be filled when team name is entered
      })

      // Check if this code already has a team name
      
      if (cyclistCode.team_name && cyclistCode.team_name.trim() !== '') {
        console.log('🔒 Setting read-only mode - team name exists:', cyclistCode.team_name)
        setTeamName(cyclistCode.team_name)
        setTeamNameReadOnly(true)
        
        // Update cache with existing team name
        updateCache({
          joinCode: code.toUpperCase(),
          cyclistId: cyclistCode.cyclist_id,
          cyclistName: cyclistCode.cyclist_name,
          sessionId: cyclistCode.sessions.id,
          sessionTitle: cyclistCode.sessions.title,
          teamName: cyclistCode.team_name
        })
      } else {
        console.log('✏️ Setting editable mode - no team name found')
        setTeamName('')
        setTeamNameReadOnly(false)
        
        // Check if we have a cached team name for this code
        const cachedTeamName = getCachedTeamName()
        if (cachedTeamName) {
          setTeamName(cachedTeamName)
        }
      }
      
      // State should now allow input: isCodeValidated=true, teamNameReadOnly=false

    } catch (err) {
      console.error('Error validating code:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsCodeValidated(false)
      setCyclistData(null)
    } finally {
      if (!silent) setIsValidatingCode(false)
    }
  }

  // Reset to start fresh
  const handleStartFresh = () => {
    setJoinCode('')
    setTeamName('')
    setIsCodeValidated(false)
    setCyclistData(null)
    setTeamNameReadOnly(false)
    setError('')
    clearCache()
  }

  // Join the game (second step)
  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsJoining(true)
    setError('')

    try {
      if (!cyclistData) {
        throw new Error('Please validate your join code first')
      }

      if (!teamName.trim()) {
        throw new Error('Team name is required')
      }

      // If team name is read-only, it means player is rejoining
      if (teamNameReadOnly) {
        // Just proceed to game - team already exists
        const gameSession = {
          sessionId: cyclistData.sessions.id,
          sessionTitle: cyclistData.sessions.title,
          cyclistId: cyclistData.cyclist_id,
          cyclistName: cyclistData.cyclist_name,
          cyclistRole: cyclistData.cyclists?.character_role,
          teamName: teamName.trim(),
          joinCode: joinCode.toUpperCase(),
          currentStage: cyclistData.sessions.current_stage,
          sessionStatus: cyclistData.sessions.status,
          stamina: cyclistData.cyclists?.stamina || 5,
          currentPoints: cyclistData.cyclists?.current_points || 0,
          timestamp: Date.now()
        }

        saveToCache(gameSession)
        router.push('/game')
        return
      }

      // New team name - update in database
      const { error: updateError } = await supabase
        .from('cyclist_codes')
        .update({
          team_name: teamName.trim(),
          player_joined_at: new Date().toISOString()
        })
        .eq('code', joinCode.toUpperCase())

      if (updateError) {
        throw updateError
      }

      // Store comprehensive session data
      const gameSession = {
        sessionId: cyclistData.sessions.id,
        sessionTitle: cyclistData.sessions.title,
        cyclistId: cyclistData.cyclist_id,
        cyclistName: cyclistData.cyclist_name,
        cyclistRole: cyclistData.cyclists?.character_role,
        teamName: teamName.trim(),
        joinCode: joinCode.toUpperCase(),
        currentStage: cyclistData.sessions.current_stage,
        sessionStatus: cyclistData.sessions.status,
        stamina: cyclistData.cyclists?.stamina || 5,
        currentPoints: cyclistData.cyclists?.current_points || 0,
        timestamp: Date.now()
      }

      saveToCache(gameSession)

      console.log('Player joined successfully:', gameSession)

      // Redirect to game page
      router.push('/game')
    } catch (err) {
      console.error('Error joining game:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsJoining(false)
    }
  }

  

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Fullscreen Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-no-repeat bg-right-center"
        style={{
          backgroundImage: "url('/images/team-rubicon.jpg')"
        }}
      />
      
      {/* Dark Overlay for Better Contrast */}
      <div className="absolute inset-0 bg-black/60" />
      
      {/* Back to Home Link - Top Left */}
      <div className="absolute top-6 left-6 z-20">
        <Link 
          href="/"
          className="flex items-center space-x-2 px-4 py-2 rounded-lg backdrop-blur-sm transition-all hover:scale-105"
          style={{
            backgroundColor: theme.colors.background + '90',
            color: theme.colors.text,
            fontFamily: theme.fonts.primary
          }}
        >
          <span>←</span>
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        {/* Desktop: Left side card, Mobile: Centered card */}
        <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl lg:absolute lg:left-12 xl:left-16">
          <div 
            className="rounded-2xl p-6 md:p-8 lg:p-10 shadow-2xl backdrop-blur-md border"
            style={{
              backgroundColor: theme.colors.background + 'F5',
              borderColor: theme.colors.accent + '40',
              borderRadius: theme.borders.radius
            }}
          >
            {/* Qualians Logo */}
            <div className="mb-6 flex justify-center">
              <img
                src="/logos/qualians-logo.png"
                alt="Qualians"
                className="object-contain h-8 md:h-10 opacity-80"
              />
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 
                className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3"
                style={{
                  color: theme.colors.text,
                  fontFamily: theme.fonts.primary,
                  fontWeight: theme.fonts.headingWeight
                }}
              >
                Join the Race
              </h1>
              <p 
                className="text-base md:text-lg leading-relaxed"
                style={{
                  color: theme.colors.text + '90',
                  fontFamily: theme.fonts.primary
                }}
              >
                Step into the game and ride with your team through the ultimate cycling challenge
              </p>
            </div>

            <form onSubmit={handleJoinGame} className="space-y-6">
              {/* Step 1: Validate Join Code */}
              <div>
                <label 
                  htmlFor="joinCode" 
                  className="block text-sm font-medium mb-2"
                  style={{
                    color: theme.colors.text,
                    fontFamily: theme.fonts.primary
                  }}
                >
                  Your Join Code
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    id="joinCode"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    disabled={isCodeValidated}
                    className={`flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:outline-none transition-all ${
                      isCodeValidated 
                        ? 'bg-green-50 border-green-300 text-green-800' 
                        : 'border-gray-300 focus:ring-2'
                    }`}
                    style={{
                      borderRadius: theme.borders.buttonRadius,
                      fontFamily: theme.fonts.primary,
                      borderColor: !isCodeValidated ? theme.colors.accent + '40' : undefined
                    }}
                    placeholder="e.g. ABC123"
                    maxLength={6}
                    required
                  />
                  {!isCodeValidated ? (
                    <button
                      type="button"
                      onClick={() => handleValidateCode()}
                      disabled={isValidatingCode || joinCode.length !== 6}
                      className="px-6 py-3 font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: theme.colors.primary,
                        color: theme.colors.background,
                        borderRadius: theme.borders.buttonRadius,
                        fontFamily: theme.fonts.primary
                      }}
                    >
                      {isValidatingCode ? 'Validating...' : 'Validate'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartFresh}
                      className="px-6 py-3 font-medium rounded-xl transition-all duration-300 bg-gray-500 text-white hover:bg-gray-600"
                      style={{
                        borderRadius: theme.borders.buttonRadius,
                        fontFamily: theme.fonts.primary
                      }}
                    >
                      Reset
                    </button>
                  )}
                </div>
                
                {/* Code Validation Success */}
                {isCodeValidated && cyclistData && (
                  <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <span className="text-green-600 text-lg">✅</span>
                      <div>
                        <div 
                          className="text-sm font-medium text-green-900"
                          style={{ fontFamily: theme.fonts.primary }}
                        >
                          {cyclistData.cyclist_name} - {cyclistData.sessions.title}
                        </div>
                        <div 
                          className="text-xs text-green-700"
                          style={{ fontFamily: theme.fonts.primary }}
                        >
                          Stage {cyclistData.sessions.current_stage || 1} • Status: {cyclistData.sessions.status}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Team Name */}
              <div>
                <label 
                  htmlFor="teamName" 
                  className="block text-sm font-medium mb-2"
                  style={{
                    color: theme.colors.text,
                    fontFamily: theme.fonts.primary
                  }}
                >
                  Your Team Name
                </label>
                <input
                  type="text"
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  disabled={!isCodeValidated}
                  readOnly={teamNameReadOnly}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:outline-none transition-all ${
                    !isCodeValidated 
                      ? 'bg-gray-50 border-gray-200 text-gray-400' 
                      : teamNameReadOnly
                        ? 'bg-blue-50 border-blue-300 text-blue-800'
                        : 'border-gray-300'
                  }`}
                  style={{
                    borderRadius: theme.borders.buttonRadius,
                    fontFamily: theme.fonts.primary,
                    borderColor: isCodeValidated && !teamNameReadOnly ? theme.colors.accent + '40' : undefined
                  }}
                  placeholder={isCodeValidated ? "e.g. Team Alpha, The Sprinters, etc." : "Validate code first"}
                  maxLength={50}
                  required
                />
                <p 
                  className="text-sm mt-2"
                  style={{
                    color: theme.colors.text + '70',
                    fontFamily: theme.fonts.primary
                  }}
                >
                  {teamNameReadOnly 
                    ? "🔄 You're rejoining with your existing team name" 
                    : isCodeValidated
                      ? "This name will represent your team during the race"
                      : "Validate your join code to enter team name"
                  }
                </p>
              </div>

              {/* Connection Status */}
              {cachedSession && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <span className="text-blue-600 text-lg">💾</span>
                    <div className="text-sm">
                      <div 
                        className="font-medium text-blue-900"
                        style={{ fontFamily: theme.fonts.primary }}
                      >
                        Session Saved
                      </div>
                      <div 
                        className="text-blue-700"
                        style={{ fontFamily: theme.fonts.primary }}
                      >
                        Your progress is automatically saved and will persist through connection issues
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-4 rounded-xl border border-red-200">
                  <div style={{ fontFamily: theme.fonts.primary }}>
                    {error}
                  </div>
                  <div className="mt-3 space-x-2">
                    <button
                      type="button"
                      onClick={handleStartFresh}
                      className="text-sm bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg transition-all"
                      style={{ fontFamily: theme.fonts.primary }}
                    >
                      Start Fresh
                    </button>
                  </div>
                </div>
              )}

              {/* Join Game Button */}
              <button
                type="submit"
                disabled={!isCodeValidated || !teamName.trim() || isJoining}
                className="w-full px-6 py-4 text-lg font-bold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                style={{
                  backgroundColor: theme.colors.primary,
                  color: theme.colors.background,
                  borderRadius: theme.borders.buttonRadius,
                  fontFamily: theme.fonts.primary
                }}
              >
                {isJoining ? 'Joining...' : teamNameReadOnly ? 'Rejoin Game →' : 'Join Now →'}
              </button>

              {/* Start Fresh Option */}
              {(isCodeValidated || cachedSession) && (
                <button
                  type="button"
                  onClick={handleStartFresh}
                  className="w-full text-sm py-3 transition-all hover:opacity-70"
                  style={{
                    color: theme.colors.text + '60',
                    fontFamily: theme.fonts.primary
                  }}
                >
                  🔄 Start fresh with new code
                </button>
              )}


            </form>


          </div>
        </div>
      </div>
    </main>
  )
}