'use client'

import { useState, useEffect } from 'react'
import { useGame } from '@/context/GameContext'
import { supabase } from '@/lib/supabase'
import { Team, Cyclist } from '@/types/game.types'
import { TEAM_TYPES } from '@/lib/constants'

interface TeamScoreboardProps {
  className?: string
}

interface TeamWithCyclists extends Team {
  cyclists: Cyclist[]
}

export default function TeamScoreboard({ className = '' }: TeamScoreboardProps) {
  const [activeTab, setActiveTab] = useState<'teams' | 'individuals'>('teams')
  const [allTeams, setAllTeams] = useState<TeamWithCyclists[]>([])
  const [allCyclists, setAllCyclists] = useState<Cyclist[]>([])
  const [loading, setLoading] = useState(true)
  const { state } = useGame()

  useEffect(() => {
    if (!state.session) return

    const fetchScoreboardData = async () => {
      try {
        // Fetch teams with cyclists
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select(`
            *,
            cyclists (*)
          `)
          .eq('session_id', state.session!.id)
          .order('total_points', { ascending: false })

        if (teamsError) throw teamsError

        // Fetch all cyclists for individual leaderboard
        const { data: cyclistsData, error: cyclistsError } = await supabase
          .from('cyclists')
          .select(`
            *,
            teams!inner (name, type, session_id)
          `)
          .eq('teams.session_id', state.session!.id)
          .order('current_points', { ascending: false })

        if (cyclistsError) throw cyclistsError

        setAllTeams(teamsData as TeamWithCyclists[] || [])
        setAllCyclists(cyclistsData as Cyclist[] || [])
      } catch (error) {
        console.error('Error fetching scoreboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchScoreboardData()

    // Set up real-time subscriptions
    const teamsSubscription = supabase
      .channel('teams-scoreboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teams',
          filter: `session_id=eq.${state.session.id}`,
        },
        () => fetchScoreboardData()
      )
      .subscribe()

    const cyclistsSubscription = supabase
      .channel('cyclists-scoreboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cyclists',
        },
        () => fetchScoreboardData()
      )
      .subscribe()

    return () => {
      teamsSubscription.unsubscribe()
      cyclistsSubscription.unsubscribe()
    }
  }, [state.session])

  const getTeamDisplayName = (team: Team) => {
    return TEAM_TYPES[team.type] || team.name
  }

  const getTeamIcon = (teamType: string) => {
    const icons = {
      rubicon: '🚴‍♂️',
      solaris: '☀️',
      corex: '⚡',
      vortex: '🌀'
    }
    return icons[teamType as keyof typeof icons] || '🏁'
  }

  const getRankingColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600 bg-yellow-50'
    if (rank === 2) return 'text-gray-600 bg-gray-50'
    if (rank === 3) return 'text-orange-600 bg-orange-50'
    return 'text-gray-500 bg-gray-50'
  }

  if (loading) {
    return (
      <div className={`card ${className}`}>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rubicon-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading scoreboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`card ${className}`}>
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setActiveTab('teams')}
          className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'teams'
              ? 'border-rubicon-500 text-rubicon-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          🏆 Team Standings
        </button>
        <button
          onClick={() => setActiveTab('individuals')}
          className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'individuals'
              ? 'border-rubicon-500 text-rubicon-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          🚴‍♂️ Individual Standings
        </button>
      </div>

      {/* Team Standings */}
      {activeTab === 'teams' && (
        <div className="space-y-3">
          {allTeams.map((team, index) => {
            const rank = index + 1
            const isUserTeam = team.type === 'rubicon'
            
            return (
              <div
                key={team.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isUserTeam
                    ? 'border-rubicon-300 bg-rubicon-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankingColor(rank)}`}>
                      {rank}
                    </div>
                    <div className="text-2xl">{getTeamIcon(team.type)}</div>
                    <div>
                      <div className={`font-semibold ${isUserTeam ? 'text-rubicon-800' : 'text-gray-800'}`}>
                        {getTeamDisplayName(team)}
                        {isUserTeam && (
                          <span className="ml-2 text-xs bg-rubicon-200 text-rubicon-700 px-2 py-1 rounded-full">
                            YOUR TEAM
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {team.cyclists?.length || 0} cyclists
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-lg font-bold ${isUserTeam ? 'text-rubicon-600' : 'text-gray-800'}`}>
                      {team.total_points} pts
                    </div>
                    <div className="text-sm text-gray-500">
                      Synergy: {team.synergy_score}%
                    </div>
                  </div>
                </div>

                {/* Show cyclists for user's team */}
                {isUserTeam && team.cyclists && (
                  <div className="mt-3 pt-3 border-t border-rubicon-200">
                    <div className="grid grid-cols-2 gap-2">
                      {team.cyclists.map((cyclist: Cyclist) => (
                        <div key={cyclist.id} className="text-xs bg-white rounded p-2">
                          <div className="font-medium">{cyclist.name}</div>
                          <div className="text-gray-600">{cyclist.current_points} pts • {cyclist.stamina}/5 stamina</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Individual Standings */}
      {activeTab === 'individuals' && (
        <div className="space-y-2">
          {allCyclists.map((cyclist, index) => {
            const rank = index + 1
            const isUserCyclist = cyclist.id === state.currentCyclist?.id
            
            return (
              <div
                key={cyclist.id}
                className={`p-3 rounded-lg border transition-all ${
                  isUserCyclist
                    ? 'border-rubicon-300 bg-rubicon-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getRankingColor(rank)}`}>
                      {rank}
                    </div>
                    <div>
                      <div className={`font-medium ${isUserCyclist ? 'text-rubicon-800' : 'text-gray-800'}`}>
                        {cyclist.name}
                        {isUserCyclist && (
                          <span className="ml-2 text-xs bg-rubicon-200 text-rubicon-700 px-2 py-1 rounded-full">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600">
                        Team {cyclist.team_id?.slice(0, 8) || 'Unknown'} • {cyclist.stamina}/5 stamina
                      </div>
                    </div>
                  </div>
                  
                  <div className={`text-lg font-bold ${isUserCyclist ? 'text-rubicon-600' : 'text-gray-800'}`}>
                    {cyclist.current_points} pts
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Last Updated */}
      <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500 text-center">
        Live updates • Stage {state.session?.current_stage || 1} of 10
      </div>
    </div>
  )
}