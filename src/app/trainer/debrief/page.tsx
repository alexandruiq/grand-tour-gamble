'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface PlayerResult {
  cyclist_name: string
  team_name: string
  total_points: number
  final_stamina: number
  sprint_count: number
  cruise_count: number
  decisions: Array<{
    stage_number: number
    decision: string
    points_earned: number
  }>
  reflections: Array<{
    stage_number: number
    decision_reasoning: string
    emotional_response: string
  }>
}

interface TeamSummary {
  team_name: string
  total_points: number
  synergy_score: number
  player_count: number
}

function TrainerDebriefContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId')
  
  const [session, setSession] = useState<any>(null)
  const [playerResults, setPlayerResults] = useState<PlayerResult[]>([])
  const [teamSummaries, setTeamSummaries] = useState<TeamSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'players' | 'teams' | 'analysis'>('overview')

  useEffect(() => {
    if (!sessionId) {
      router.push('/trainer/dashboard')
      return
    }
    loadDebriefData()
  }, [sessionId, router])

  const loadDebriefData = async () => {
    if (!sessionId) return

    try {
      // Load session data
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (sessionData) {
        setSession(sessionData)
      }

      // Load all decisions for the session
      const { data: decisions } = await supabase
        .from('decisions_log')
        .select(`
          *,
          cyclists (
            name,
            teams (name)
          )
        `)
        .eq('session_id', sessionId)

      // Load all reflections for the session
      const { data: reflections } = await supabase
        .from('reflections')
        .select(`
          *,
          cyclists (
            name,
            teams (name)
          )
        `)
        .eq('session_id', sessionId)

      // Load cyclists with final stats
      const { data: cyclists } = await supabase
        .from('cyclists')
        .select(`
          *,
          teams (name, total_points, synergy_score)
        `)
        .eq('team_id', `(SELECT id FROM teams WHERE session_id = '${sessionId}' AND type = 'rubicon')`)

      // Process player results
      if (cyclists && decisions) {
        const playerResults: PlayerResult[] = cyclists.map((cyclist: any) => {
          const playerDecisions = decisions.filter((d: any) => d.cyclist_id === cyclist.id)
          const playerReflections = reflections?.filter((r: any) => r.cyclist_id === cyclist.id) || []
          
          const sprintCount = playerDecisions.filter(d => d.decision === 'sprint').length
          const cruiseCount = playerDecisions.filter(d => d.decision === 'cruise').length
          const totalPoints = playerDecisions.reduce((sum, d) => sum + (d.points_earned || 0), 0)

          return {
            cyclist_name: cyclist.name,
            team_name: cyclist.teams?.name || 'Unknown',
            total_points: totalPoints,
            final_stamina: cyclist.stamina,
            sprint_count: sprintCount,
            cruise_count: cruiseCount,
            decisions: playerDecisions.map((d: any) => ({
              stage_number: d.stage_number,
              decision: d.decision,
              points_earned: d.points_earned || 0
            })),
            reflections: playerReflections.map((r: any) => ({
              stage_number: r.stage_number,
              decision_reasoning: r.decision_reasoning || '',
              emotional_response: r.emotional_response || ''
            }))
          }
        })

        setPlayerResults(playerResults)
      }

      // Load team summaries
      const { data: teams } = await supabase
        .from('teams')
        .select('*')
        .eq('session_id', sessionId)

      if (teams) {
        const teamSummaries: TeamSummary[] = teams.map(team => ({
          team_name: team.name,
          total_points: team.total_points || 0,
          synergy_score: team.synergy_score || 0,
          player_count: team.type === 'rubicon' ? playerResults.length : 4 // AI teams have 4 players
        }))

        setTeamSummaries(teamSummaries.sort((a, b) => b.total_points - a.total_points))
      }

    } catch (error) {
      console.error('Error loading debrief data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportResults = () => {
    const data = {
      session,
      playerResults,
      teamSummaries,
      exportedAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `debrief-${session?.title || 'session'}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rubicon-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading session results...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📊 Session Debrief</h1>
            <p className="text-gray-600 mt-2">
              {session?.title} • Completed • {playerResults.length} players
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportResults}
              className="btn-secondary"
            >
              📥 Export Results
            </button>
            <button
              onClick={() => router.push('/trainer/dashboard')}
              className="btn-primary"
            >
              🏠 Dashboard
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-white rounded-lg p-1 shadow-sm">
          {[
            { id: 'overview', label: '📈 Overview', icon: '📈' },
            { id: 'players', label: '👥 Players', icon: '👥' },
            { id: 'teams', label: '🏆 Teams', icon: '🏆' },
            { id: 'analysis', label: '🧠 Analysis', icon: '🧠' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {playerResults.length}
                </div>
                <div className="text-gray-600 text-sm">Players</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {playerResults.reduce((sum, p) => sum + p.total_points, 0)}
                </div>
                <div className="text-gray-600 text-sm">Total Points</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {playerResults.reduce((sum, p) => sum + p.sprint_count, 0)}
                </div>
                <div className="text-gray-600 text-sm">Total Sprints</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {playerResults.filter(p => p.reflections.length > 0).length}
                </div>
                <div className="text-gray-600 text-sm">Reflected</div>
              </div>
            </div>

            {/* Team Leaderboard */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🏆 Final Standings</h2>
              <div className="space-y-3">
                {teamSummaries.map((team, index) => (
                  <div key={team.team_name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-gray-300 text-gray-700' :
                        index === 2 ? 'bg-orange-400 text-orange-900' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{team.team_name}</div>
                        <div className="text-sm text-gray-500">
                          {team.player_count} players • Synergy: {team.synergy_score}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">{team.total_points}</div>
                      <div className="text-sm text-gray-500">points</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'players' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">👥 Player Performance</h2>
            <div className="space-y-4">
              {playerResults.map((player, index) => (
                <div key={player.cyclist_name} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{player.cyclist_name}</h3>
                      <p className="text-sm text-gray-500">{player.team_name}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">{player.total_points} pts</div>
                      <div className="text-sm text-gray-500">Stamina: {player.final_stamina}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Strategy:</span>
                      <span className="ml-2">
                        🏃‍♂️ {player.sprint_count} sprints, 🚴‍♂️ {player.cruise_count} cruises
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Reflections:</span>
                      <span className="ml-2">{player.reflections.length} stages</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add more tab content as needed */}
        {activeTab === 'teams' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🏆 Team Analysis</h2>
            <p className="text-gray-600">Detailed team performance analysis coming soon...</p>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🧠 Game Analysis</h2>
            <p className="text-gray-600">Advanced analytics and insights coming soon...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TrainerDebriefPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rubicon-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading debrief...</p>
        </div>
      </div>
    }>
      <TrainerDebriefContent />
    </Suspense>
  )
}