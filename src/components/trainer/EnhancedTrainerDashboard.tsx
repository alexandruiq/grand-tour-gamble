'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '@/lib/useTheme'
import { supabase } from '@/lib/supabase'
import TrainerHeader from './TrainerHeader'
import StageTimeline from './StageTimeline'
import StageControls from './StageControls'
import LiveTeamOverview from './LiveTeamOverview'
import RulesTab from './tabs/RulesTab'
import PlayerDecisionsTab from './tabs/PlayerDecisionsTab'
import TeamPerformanceTab from './tabs/TeamPerformanceTab'
import AccessCodesTab from './tabs/AccessCodesTab'
import DebriefTab from './tabs/DebriefTab'
import ReflectionTrigger from './ReflectionTrigger'
import { calculateAndAwardStageResults } from '@/lib/stage-calculator'

interface SessionData {
  id: string
  name?: string
  current_stage: number
  stage_locked: boolean
  status: string
  reflection_active: boolean
}

interface TeamData {
  name: string
  type: 'rubicon' | 'solaris' | 'corex' | 'vortex'
  emoji: string
  cyclists: {
    id: string
    name: string
    character_role: string
    stamina: number
    current_points: number
    hasDecided: boolean
    decision?: 'sprint' | 'cruise'
  }[]
  total_points: number
  synergy_score: number
}

interface EnhancedTrainerDashboardProps {
  sessionId: string
}

export default function EnhancedTrainerDashboard({ sessionId }: EnhancedTrainerDashboardProps) {
  const theme = useTheme()
  const [session, setSession] = useState<SessionData | null>(null)
  const [teams, setTeams] = useState<TeamData[]>([])
  const [completedStages, setCompletedStages] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isStageActionLoading, setIsStageActionLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'codes' | 'rules' | 'decisions' | 'performance' | 'debrief' | 'reflection'>('overview')

  // Load session and team data
  const loadData = useCallback(async () => {
    if (!sessionId) return

    try {
      console.log('🔄 Loading enhanced trainer dashboard data...')
      
      // Load session
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (sessionError) throw sessionError

      setSession({
        id: sessionData.id,
        name: sessionData.name,
        current_stage: sessionData.current_stage,
        stage_locked: sessionData.stage_locked,
        status: sessionData.status,
        reflection_active: sessionData.reflection_active || false
      })

      // Load teams with cyclists
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          type,
          total_points,
          synergy_score,
          cyclists!team_id(
            id,
            name,
            character_role,
            stamina,
            current_points
          )
        `)
        .eq('session_id', sessionId)

      if (teamsError) throw teamsError

      // Get current decisions for this stage
      const { data: decisionsData } = await supabase
        .from('decisions_log')
        .select('cyclist_id, decision')
        .eq('session_id', sessionId)
        .eq('stage_number', sessionData.current_stage)

      const decisions = new Map(
        decisionsData?.map(d => [d.cyclist_id, d.decision]) || []
      )

      // Format teams data
      const formattedTeams: TeamData[] = teamsData?.map(team => ({
        name: team.name,
        type: team.type as 'rubicon' | 'solaris' | 'corex' | 'vortex',
        emoji: getTeamEmoji(team.type),
        cyclists: team.cyclists?.map(cyclist => ({
          id: cyclist.id,
          name: cyclist.name,
          character_role: cyclist.character_role,
          stamina: cyclist.stamina,
          current_points: cyclist.current_points,
          hasDecided: decisions.has(cyclist.id),
          decision: decisions.get(cyclist.id)
        })) || [],
        total_points: team.total_points,
        synergy_score: team.synergy_score
      })) || []

      setTeams(formattedTeams)

      // Calculate completed stages (stages < current_stage)
      const completed = Array.from({ length: sessionData.current_stage - 1 }, (_, i) => i + 1)
      setCompletedStages(completed)

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [sessionId])

  // Real-time subscriptions
  useEffect(() => {
    loadData()

    // Subscribe to session changes
    const sessionSubscription = supabase
      .channel(`session-${sessionId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` }, 
        () => {
          console.log('🔄 Session updated, refreshing...')
          loadData()
        }
      )
      .subscribe()

    // Subscribe to decisions changes
    const decisionsSubscription = supabase
      .channel(`decisions-${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'decisions_log', filter: `session_id=eq.${sessionId}` }, 
        () => {
          console.log('🔄 Decisions updated, refreshing...')
          loadData()
        }
      )
      .subscribe()

    // Subscribe to team changes
    const teamsSubscription = supabase
      .channel(`teams-${sessionId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'teams', filter: `session_id=eq.${sessionId}` }, 
        () => {
          console.log('🔄 Teams updated, refreshing...')
          loadData()
        }
      )
      .subscribe()

    return () => {
      sessionSubscription.unsubscribe()
      decisionsSubscription.unsubscribe()
      teamsSubscription.unsubscribe()
    }
  }, [loadData, sessionId])

  // Stage actions
  const handleStageAction = async (action: 'start' | 'end') => {
    if (!session) return

    setIsStageActionLoading(true)
    try {
      if (action === 'start') {
        if (session.current_stage === 1) {
          console.log('🚀 Starting Stage 1 - Game Begin!')
          
          const { error } = await supabase
            .from('sessions')
            .update({ 
              current_stage: 1,
              stage_locked: false,
              status: 'active'
            })
            .eq('id', sessionId)

          if (error) throw error
          console.log('✅ Stage 1 started! Players can now make decisions.')
        } else {
          console.log(`▶️ Opening stage ${session.current_stage}`)
          
          const { error } = await supabase
            .from('sessions')
            .update({ 
              stage_locked: false,
              status: 'active'
            })
            .eq('id', sessionId)

          if (error) throw error
          console.log(`✅ Stage ${session.current_stage} opened`)
        }
        
      } else if (action === 'end') {
        console.log(`⏹️ Ending stage ${session.current_stage}`)
        
        // First lock the stage
        const { error: lockError } = await supabase
          .from('sessions')
          .update({ stage_locked: true })
          .eq('id', sessionId)

        if (lockError) throw lockError

        // Calculate results
        await calculateAndAwardStageResults(sessionId, session.current_stage)
        console.log(`✅ Stage ${session.current_stage} ended and results calculated`)
      }

      loadData()
    } catch (error) {
      console.error(`Error ${action}ing stage:`, error)
    } finally {
      setIsStageActionLoading(false)
    }
  }

  const getTeamEmoji = (teamType: string) => {
    switch (teamType) {
      case 'rubicon': return '🔴'
      case 'solaris': return '🟡'
      case 'corex': return '🔵'
      case 'vortex': return '🟣'
      default: return '⚪'
    }
  }

  if (isLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: theme.colors.background }}
      >
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: theme.colors.primary }}
          ></div>
          <p style={{ color: theme.colors.text + '80' }}>Loading trainer dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: theme.colors.background }}
      >
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 
            className="text-xl font-bold mb-2"
            style={{ color: theme.colors.text }}
          >
            Session Not Found
          </h2>
          <p style={{ color: theme.colors.text + '70' }}>
            Could not load session data.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: theme.colors.background }}
    >
      {/* Header */}
      <TrainerHeader
        sessionId={sessionId}
        sessionName={session.name}
        currentStage={session.current_stage}
        stageOpen={!session.stage_locked}
        stageLocked={session.stage_locked}
        onStageAction={handleStageAction}
        isLoading={isStageActionLoading}
      />

      {/* Stage Timeline */}
      <StageTimeline
        currentStage={session.current_stage}
        completedStages={completedStages}
        negotiationStages={[4, 7, 10]}
      />

      {/* Stage Controls */}
      <div className="px-6 py-4">
        <StageControls
          sessionId={sessionId}
          currentStage={session.current_stage}
          stageOpen={!session.stage_locked}
          stageLocked={session.stage_locked}
          onUpdate={loadData}
        />
      </div>

      {/* Tab Navigation */}
      <div 
        className="border-b px-6"
        style={{
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.accent + '20'
        }}
      >
        <div className="flex space-x-6">
          {[
            { key: 'overview', label: '🏁 Live Overview', description: 'Real-time team status' },
            { key: 'codes', label: '🔐 Access Codes', description: 'Player join codes' },
            { key: 'rules', label: '📖 Rules', description: 'Game reference' },
            { key: 'decisions', label: '👁️ Decisions', description: 'Reveal after stage ends' },
            { key: 'performance', label: '📊 Performance', description: 'Team & individual stats' },
            { key: 'debrief', label: '🏆 Debrief', description: 'Final game results' },
            { key: 'reflection', label: '🧠 Reflection', description: 'Final phase trigger' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-4 px-2 text-sm font-medium border-b-2 transition-all ${
                activeTab === tab.key 
                  ? 'border-current' 
                  : 'border-transparent hover:opacity-75'
              }`}
              style={{
                color: activeTab === tab.key 
                  ? theme.colors.primary 
                  : theme.colors.text + '70',
                fontFamily: theme.fonts.primary
              }}
            >
              <div>{tab.label}</div>
              <div 
                className="text-xs mt-1"
                style={{
                  color: activeTab === tab.key 
                    ? theme.colors.primary + '80' 
                    : theme.colors.text + '50'
                }}
              >
                {tab.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <LiveTeamOverview
            teams={teams}
            currentStage={session.current_stage}
            stageOpen={!session.stage_locked}
            showDecisions={false}
          />
        )}

        {activeTab === 'codes' && (
          <AccessCodesTab
            sessionId={sessionId}
          />
        )}

        {activeTab === 'rules' && <RulesTab />}

        {activeTab === 'decisions' && (
          <PlayerDecisionsTab
            sessionId={sessionId}
            currentStage={session.current_stage}
            stageOpen={!session.stage_locked}
          />
        )}

        {activeTab === 'performance' && (
          <TeamPerformanceTab
            sessionId={sessionId}
            currentStage={session.current_stage}
          />
        )}

        {activeTab === 'debrief' && (
          <DebriefTab
            sessionId={sessionId}
            currentStage={session.current_stage}
            sessionStatus={session.status}
          />
        )}

        {activeTab === 'reflection' && (
          <ReflectionTrigger
            sessionId={sessionId}
            currentStage={session.current_stage}
            sessionStatus={session.status}
            onUpdate={loadData}
          />
        )}
      </div>
    </div>
  )
}