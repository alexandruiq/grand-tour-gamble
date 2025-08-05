'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GameProvider, useGame } from '@/context/GameContext'

import { useTheme } from '@/lib/useTheme'
import InfoIcon from '@/components/ui/InfoIcon'
import GameSessionLoader from '@/components/game/GameSessionLoader'
import CacheConflictDetector from '@/components/game/CacheConflictDetector'
import AutoRefreshProvider from '@/components/game/AutoRefreshProvider'
import CyclistCard from '@/components/player/CyclistCard'
import DecisionButtons from '@/components/player/DecisionButtons'
import StageDescription from '@/components/game/StageDescription'
import TeamScoreboard from '@/components/game/TeamScoreboard'
import GameStatsPanel from '@/components/game/GameStatsPanel'
import StatusBanner from '@/components/game/StatusBanner'
import RulesModal from '@/components/modals/RulesModal'
import RaceInfoModal from '@/components/modals/RaceInfoModal'
import MultiplierBanner from '@/components/game/MultiplierBanner'
import ReflectionOverlay from '@/components/game/ReflectionOverlay'
import DebriefModal from '@/components/game/DebriefModal'
import NegotiationBanner from '@/components/game/NegotiationBanner'

function GameContent() {
  const [showRules, setShowRules] = useState(false)
  const [showScoreboard, setShowScoreboard] = useState(false)
  const [showRaceInfo, setShowRaceInfo] = useState(false)
  const [showDebrief, setShowDebrief] = useState(false)
  const [hasShownModal, setHasShownModal] = useState(false)
  // Removed negotiation modal state - using banner instead
  const { state, joinGame, refreshGameState } = useGame()
  const router = useRouter()
  const theme = useTheme()

  // Session loading is now handled by GameSessionLoader wrapper

  // Manual modal trigger function
  const handleViewFinalResults = () => {
    setShowDebrief(true)
  }

  // Exit game function - clear cache and allow new join code
  const handleExitGame = () => {
    // Clear cached session data (same as "Play Again" in DebriefModal)
    localStorage.removeItem('gameSession')
    sessionStorage.removeItem('gameSession')
    // Go to login page to enter a new join code
    router.push('/login')
  }

  useEffect(() => {
    // Set up periodic refresh for game state (reduced frequency to prevent modal refresh issues)
    const interval = setInterval(() => {
      if (state.session && state.session.status !== 'ended') {
        refreshGameState()
      }
    }, 15000) // Refresh every 15 seconds, and stop when game ends

    return () => clearInterval(interval)
  }, [state.session, refreshGameState])

  // Show debrief modal when game ends (controlled - only once per session)
  useEffect(() => {
    if (state.session?.status === 'ended' && !hasShownModal) {
      setShowDebrief(true)
      setHasShownModal(true)
    }
  }, [state.session?.status, hasShownModal])

  // Removed negotiation status checking - using simple banner instead that detects stages automatically

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rubicon-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your cyclist dashboard...</p>
        </div>
      </div>
    )
  }

  if (!state.currentCyclist || !state.session || !state.team) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Session Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            Unable to load your cyclist data. Please join the game again.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="btn-primary"
          >
            Join Game
          </button>
        </div>
      </div>
    )
  }

  const handleDecision = (decision: 'sprint' | 'cruise') => {
    // Optional callback for decision handling
    console.log(`Decision made: ${decision}`)
  }

  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: theme.colors.background,
        fontFamily: theme.fonts.primary 
      }}
    >
      {/* Header */}
      <div 
        className="shadow-sm border-b"
        style={{ 
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.accent + '20'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src="/logos/qualians-logo.png"
                alt="Client Logo"
                className="object-contain h-8 w-auto"
              />
              <div>
                <h1 
                  className="text-2xl font-bold"
                  style={{ 
                    color: theme.colors.text,
                    fontWeight: theme.fonts.headingWeight,
                    fontFamily: theme.fonts.primary
                  }}
                >
                  The Grand Tour Gamble
                </h1>
                <p 
                  className="text-sm"
                  style={{ 
                    color: theme.colors.text + '80',
                    fontWeight: theme.fonts.bodyWeight
                  }}
                >
                  {state.currentCyclist.name} • {state.team.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowRules(true)}
                className="px-4 py-2 text-sm transition-all border hover:shadow-sm"
                style={{
                  backgroundColor: theme.colors.card,
                  color: theme.colors.primary,
                  borderColor: theme.colors.primary + '30',
                  borderRadius: theme.borders.buttonRadius,
                  fontWeight: theme.fonts.bodyWeight,
                  fontFamily: theme.fonts.primary
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.primary + '10'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.card
                }}
              >
                📖 Rules
              </button>
              <button
                onClick={() => setShowRaceInfo(true)}
                className="px-4 py-2 text-sm transition-all border hover:shadow-sm"
                style={{
                  backgroundColor: theme.colors.card,
                  color: theme.colors.primary,
                  borderColor: theme.colors.primary + '30',
                  borderRadius: theme.borders.buttonRadius,
                  fontWeight: theme.fonts.bodyWeight,
                  fontFamily: theme.fonts.primary
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.primary + '10'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.card
                }}
              >
                🗺️ Race Info
              </button>
              
              {/* View Final Results button - only show when game is ended */}
              {state.session?.status === 'ended' && (
                <button
                  onClick={handleViewFinalResults}
                  className="px-4 py-2 text-sm transition-all border hover:shadow-sm"
                  style={{
                    backgroundColor: theme.colors.primary,
                    color: theme.colors.background,
                    borderColor: theme.colors.primary,
                    borderRadius: theme.borders.buttonRadius,
                    fontWeight: theme.fonts.bodyWeight,
                    fontFamily: theme.fonts.primary
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.primary + 'CC'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.primary
                  }}
                >
                  🏆 View Final Results
                </button>
              )}
              
              <button
                onClick={handleExitGame}
                className="text-sm transition-all px-3 py-2"
                style={{
                  color: theme.colors.text + '70',
                  fontWeight: theme.fonts.bodyWeight,
                  fontFamily: theme.fonts.primary
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = theme.colors.text
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = theme.colors.text + '70'
                }}
              >
                Exit Game
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        <StatusBanner />
        <NegotiationBanner />
        <MultiplierBanner 
          sessionId={state.session.id} 
          currentStage={state.session.current_stage || 1} 
        />
      </div>

      {/* Main Game Layout */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div 
          className="grid gap-8"
          style={{
            gridTemplateColumns: '1fr minmax(350px, 2fr) 1fr'
          }}
        >
          {/* Col 1 (1fr): Cyclist Portrait */}
          <div className="mt-6">
            <CyclistCard cyclist={state.currentCyclist} />
          </div>

          {/* Col 2 (minmax(350px, 2fr)): Stage Info + Actions Block */}
          <div className="mt-6 space-y-4">
            {/* Unified Stage & Actions Card */}
            <div 
              className="rounded-lg border shadow-lg"
              style={{
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.accent + '20',
                borderRadius: theme.borders.radius,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
              }}
            >
              {/* Stage Info Section */}
              <div className="p-6 border-b border-gray-200">
                <StageDescription />
              </div>
              
              {/* Stage Actions Section */}
              <div className="p-6 space-y-4">
                <div className="flex items-center space-x-2">
                  <h3 
                    className="text-lg font-semibold"
                    style={{
                      color: theme.colors.text,
                      fontFamily: theme.fonts.primary,
                      fontWeight: theme.fonts.headingWeight
                    }}
                  >
                    Stage Actions
                  </h3>
                  <InfoIcon
                    content={[
                      "Decision Impact:",
                      "• Sprint: High individual points, costs -1 stamina",
                      "• Cruise: Team synergy boost, +1 stamina (if team synergy ≥50%)", 
                      "• Points depend on what other team members choose"
                    ]}
                    position="bottom"
                  />
                </div>
                <DecisionButtons
                  currentStamina={state.currentCyclist.stamina}
                  onDecision={handleDecision}
                  disabled={!state.session.stage_open || state.session.status !== 'active' || state.session.reflection_active}
                />
              </div>
            </div>
            
            {/* Mobile Scoreboard Toggle */}
            <div className="lg:hidden">
              {showScoreboard && <TeamScoreboard />}
            </div>
          </div>

          {/* Col 3 (1fr): Performance Metrics */}
          <div className="mt-6">
            <GameStatsPanel />
          </div>
        </div>
      </div>

            {/* Modals */}
      <RulesModal 
        isOpen={showRules}
        onClose={() => setShowRules(false)} 
      />
      
      <RaceInfoModal 
        isOpen={showRaceInfo}
        onClose={() => setShowRaceInfo(false)} 
      />

      {/* Reflection Overlay */}
      <ReflectionOverlay
        isVisible={state.session?.reflection_active || false}
        currentStage={state.session?.current_stage || 1}
        sessionId={state.session?.id || ''}
        cyclistId={state.currentCyclist?.id || ''}
      />

      {/* Negotiation Banner moved to top status area */}

      {/* Debrief Modal - End of Game */}
      <DebriefModal
        isVisible={showDebrief}
        onClose={() => setShowDebrief(false)}
      />
    </div>
  )
}

export default function GamePage() {
  return (
    <GameProvider>
      <AutoRefreshProvider>
        <CacheConflictDetector />
        <GameSessionLoader>
          <GameContent />
        </GameSessionLoader>
      </AutoRefreshProvider>
    </GameProvider>
  )
}