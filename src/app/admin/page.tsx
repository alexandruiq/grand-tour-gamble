'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createGameSession } from '@/lib/session-utils'
import { isAdminAuthenticated, signOutAdmin } from '@/lib/admin-auth'
import { supabase } from '@/lib/supabase'

interface SessionResult {
  session: {
    id: string
    title: string
    trainer_code: string
  }
  cyclistCodes: Array<{
    name: string
    role: string
    code: string
    cyclist_id: string
  }>
}

interface TrainerRequest {
  id: string
  name: string
  email: string
  organization: string | null
  message: string | null
  status: 'pending' | 'approved' | 'denied'
  created_at: string
}

interface ApprovedTrainer {
  id: string
  name: string
  email: string
  organization: string | null
  approved_by: string
  created_at: string
}

export default function AdminPage() {
  const [sessionName, setSessionName] = useState('')
  const [cyclistsCount, setCyclistsCount] = useState(4)
  const [selectedTrainer, setSelectedTrainer] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null)
  const [trainerRequests, setTrainerRequests] = useState<TrainerRequest[]>([])
  const [approvedTrainers, setApprovedTrainers] = useState<ApprovedTrainer[]>([])
  const [activeTab, setActiveTab] = useState<'create' | 'sessions' | 'trainers'>('create')
  const [allSessions, setAllSessions] = useState<any[]>([])
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()

  // Ensure we're on the client side
  React.useEffect(() => {
    setIsClient(true)
  }, [])

  // Load trainer requests and approved trainers
  const loadTrainerData = useCallback(async () => {
    try {
      // Load pending trainer requests
      const { data: requests, error: requestsError } = await supabase
        .from('trainer_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (requestsError) throw requestsError
      setTrainerRequests(requests || [])

      // Load approved trainers
      const { data: approved, error: approvedError } = await supabase
        .from('approved_trainers')
        .select('*')
        .order('created_at', { ascending: false })

      if (approvedError) throw approvedError
      setApprovedTrainers(approved || [])
    } catch (err) {
      console.error('Error loading trainer data:', err)
    }
  }, [])

  // Load all created sessions
  const loadSessions = useCallback(async () => {
    try {
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          *,
          cyclist_codes (
            id,
            cyclist_name,
            code,
            cyclist_id,
            team_name,
            player_joined_at
          )
        `)
        .order('created_at', { ascending: false })

      if (sessionsError) throw sessionsError
      setAllSessions(sessions || [])
    } catch (err) {
      console.error('Error loading sessions:', err)
    }
  }, [])

  // Load data on component mount
  React.useEffect(() => {
    if (typeof window !== 'undefined' && isAdminAuthenticated()) {
      loadTrainerData()
      loadSessions()
    }
  }, [loadTrainerData, loadSessions])

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!sessionName.trim()) {
      setError('Session name is required')
      return
    }

    if (!selectedTrainer) {
      setError('Please select a trainer for this session')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Use trainer email as trainer_id for now
      const result = await createGameSession(sessionName, selectedTrainer, cyclistsCount)
      setSessionResult(result)
      // Reload sessions to show the new one
      await loadSessions()
    } catch (err) {
      console.error('Error creating session:', err)
      setError(err instanceof Error ? err.message : 'Failed to create session')
    } finally {
      setIsLoading(false)
    }
  }

  const approveTrainer = useCallback(async (request: TrainerRequest) => {
    try {
      // Update request status
      const { error: updateError } = await supabase
        .from('trainer_requests')
        .update({ 
          status: 'approved', 
          approved_by: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id)

      if (updateError) throw updateError

      // Add to approved trainers
      const { error: insertError } = await supabase
        .from('approved_trainers')
        .insert({
          request_id: request.id,
          name: request.name,
          email: request.email,
          organization: request.organization,
          approved_by: 'admin'
        })

      if (insertError) throw insertError

      // Reload data
      await loadTrainerData()
    } catch (err) {
      console.error('Error approving trainer:', err)
    }
  }, [loadTrainerData])

  const denyTrainer = useCallback(async (request: TrainerRequest) => {
    try {
      const { error } = await supabase
        .from('trainer_requests')
        .update({ 
          status: 'denied', 
          approved_by: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id)

      if (error) throw error
      await loadTrainerData()
    } catch (err) {
      console.error('Error denying trainer:', err)
    }
  }, [loadTrainerData])

  const removeApprovedTrainer = useCallback(async (trainer: ApprovedTrainer) => {
    try {
      const { error } = await supabase
        .from('approved_trainers')
        .delete()
        .eq('id', trainer.id)

      if (error) throw error
      await loadTrainerData()
    } catch (err) {
      console.error('Error removing trainer:', err)
    }
  }, [loadTrainerData])

  const goToTrainerDashboard = () => {
    if (sessionResult) {
      router.push(`/trainer/dashboard?session=${sessionResult.session.id}`)
    }
  }

  // Show loading until client-side check is complete
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Check admin authentication (client-side only)
  if (!isAdminAuthenticated()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            🔐 Admin Access Required
          </h1>
          <p className="text-slate-600 mb-6">
            You need to be logged in as an admin to access this page.
          </p>
          <Link 
            href="/admin/login"
            className="bg-slate-600 text-white py-2 px-4 rounded-lg hover:bg-slate-700 font-medium"
          >
            Go to Admin Login
          </Link>
        </div>
      </div>
    )
  }

  if (false) { // Remove authLoading check
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rubicon-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Remove user check as we now have admin auth

  // Show confirmation card if session was created successfully
  if (sessionResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🎉 Session Created Successfully!
            </h1>
            <p className="text-gray-600">
              Your Grand Tour Gamble session is ready to begin
            </p>
          </div>

          {/* Confirmation Card */}
          <div className="card mb-6">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🏁</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {sessionResult.session.title}
              </h2>
              <div className="bg-rubicon-50 border border-rubicon-200 rounded-lg p-4 mb-4">
                <div className="text-sm text-rubicon-700 mb-1">Session ID</div>
                <div className="text-xl font-mono font-bold text-rubicon-900">
                  {sessionResult.session.id.slice(0, 8)}...
                </div>
              </div>
            </div>

            {/* Cyclist Join Codes */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                Cyclist Join Codes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sessionResult.cyclistCodes.map((cyclist) => (
                  <div 
                    key={cyclist.cyclist_id}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center"
                  >
                    <div className="text-lg font-semibold text-gray-900 mb-1">
                      {cyclist.name}
                    </div>
                    <div className="text-2xl font-mono font-bold text-rubicon-600 mb-2">
                      {cyclist.code}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {cyclist.role}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={goToTrainerDashboard}
                className="btn-primary text-lg px-8 py-3"
              >
                Go to Trainer Dashboard
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📋 Next Steps
            </h3>
            <ol className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="bg-rubicon-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                  1
                </span>
                <div>
                  <strong>Distribute Join Codes:</strong> Give each cyclist code to a group of participants
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-rubicon-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                  2
                </span>
                <div>
                  <strong>Players Join:</strong> Participants visit <code className="bg-gray-100 px-2 py-1 rounded text-sm">your-app-url/login</code> and enter their codes
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-rubicon-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                  3
                </span>
                <div>
                  <strong>Start Game:</strong> Use the trainer dashboard to control the game flow
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-6">
            <Link 
              href="/"
              className="text-slate-600 hover:text-slate-700 text-sm font-medium"
            >
              ← Back to Home
            </Link>
            <button
              onClick={signOutAdmin}
              className="text-sm text-slate-600 hover:text-slate-700"
            >
              Sign Out Admin
            </button>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            🎮 Grand Tour Gamble Admin
          </h1>
          <p className="text-slate-600">
            Manage trainers and create training sessions
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-slate-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('create')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'create'
                    ? 'border-slate-500 text-slate-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                🏁 Create Sessions
              </button>
              <button
                onClick={() => setActiveTab('sessions')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'sessions'
                    ? 'border-slate-500 text-slate-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                📋 All Sessions ({allSessions.length})
              </button>
              <button
                onClick={() => setActiveTab('trainers')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'trainers'
                    ? 'border-slate-500 text-slate-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                👥 Manage Trainers {trainerRequests.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {trainerRequests.length}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'create' && (
          <div className="max-w-2xl mx-auto">
            {/* Session Creation Form */}
            <div className="card">
              <form onSubmit={handleCreateSession} className="space-y-6">
                {/* Session Name Input */}
                <div>
                  <label htmlFor="sessionName" className="block text-sm font-medium text-slate-700 mb-2">
                    Session Name
                  </label>
                  <input
                    type="text"
                    id="sessionName"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    placeholder="e.g. Soft Skills July Session"
                    required
                  />
                </div>

                {/* Trainer Selection */}
                <div>
                  <label htmlFor="selectedTrainer" className="block text-sm font-medium text-slate-700 mb-2">
                    Select Trainer
                  </label>
                  <select
                    id="selectedTrainer"
                    value={selectedTrainer}
                    onChange={(e) => setSelectedTrainer(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    required
                  >
                    <option value="">Choose a trainer...</option>
                    {approvedTrainers.map((trainer) => (
                      <option key={trainer.id} value={trainer.email}>
                        {trainer.name} ({trainer.email})
                      </option>
                    ))}
                  </select>
                  {approvedTrainers.length === 0 && (
                    <p className="text-sm text-amber-600 mt-1">
                      No approved trainers available. Go to "Manage Trainers" to approve requests.
                    </p>
                  )}
                </div>

                {/* Number of Cyclists Dropdown */}
                <div>
                  <label htmlFor="cyclistsCount" className="block text-sm font-medium text-slate-700 mb-2">
                    Number of Cyclists
                  </label>
                  <select
                    id="cyclistsCount"
                    value={cyclistsCount}
                    onChange={(e) => setCyclistsCount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  >
                    <option value={4}>4 Cyclists (Default)</option>
                    <option value={3}>3 Cyclists</option>
                    <option value={2}>2 Cyclists</option>
                    <option value={1}>1 Cyclist</option>
                  </select>
                </div>

                {error && (
                  <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                    {error}
                  </div>
                )}

                {/* Create Session Button */}
                <button
                  type="submit"
                  disabled={isLoading || !sessionName.trim() || !selectedTrainer}
                  className="w-full bg-slate-600 text-white py-3 px-4 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating Session...
                    </div>
                  ) : (
                    'Create Session'
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                📋 All Created Sessions ({allSessions.length})
              </h2>
              
              {allSessions.length === 0 ? (
                <div className="card text-center py-8">
                  <div className="text-4xl mb-2">🎮</div>
                  <p className="text-slate-600">No sessions created yet</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="mt-4 bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700"
                  >
                    Create First Session
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {allSessions.map((session) => (
                    <div key={session.id} className="card">
                      <div className="mb-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">
                              {session.title}
                            </h3>
                            <p className="text-slate-600 text-sm">
                              Trainer: {session.trainer_id} • Created: {new Date(session.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-slate-500 text-xs">
                              Status: <span className="capitalize">{session.status}</span> • Stage: {session.current_stage}/12
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <div className="text-xs text-blue-700 font-medium mb-1">TRAINER CODE</div>
                              <div className="text-lg font-mono font-bold text-blue-900">
                                {session.trainer_code}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cyclist Codes */}
                      <div className="border-t border-slate-200 pt-4">
                        <h4 className="font-medium text-slate-900 mb-3">
                          Player Join Codes ({session.cyclist_codes?.length || 0})
                        </h4>
                        {session.cyclist_codes && session.cyclist_codes.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {session.cyclist_codes.map((cyclistCode: any) => (
                              <div 
                                key={cyclistCode.id}
                                className={`border rounded-lg p-3 text-center ${
                                  cyclistCode.team_name 
                                    ? 'bg-green-50 border-green-200' 
                                    : 'bg-slate-50 border-slate-200'
                                }`}
                              >
                                <div className="font-semibold text-slate-900 text-sm mb-1">
                                  {cyclistCode.cyclist_name}
                                </div>
                                <div className="text-xl font-mono font-bold text-slate-600 mb-1">
                                  {cyclistCode.code}
                                </div>
                                {cyclistCode.team_name ? (
                                  <div>
                                    <div className="text-xs text-green-700 font-medium mb-1">
                                      JOINED AS:
                                    </div>
                                    <div className="text-sm font-semibold text-green-900 mb-2">
                                      {cyclistCode.team_name}
                                    </div>
                                    <div className="text-xs text-green-600">
                                      {cyclistCode.player_joined_at 
                                        ? new Date(cyclistCode.player_joined_at).toLocaleDateString()
                                        : 'Recently joined'
                                      }
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="text-xs text-slate-500 mb-2">
                                      Waiting for player...
                                    </div>
                                    <button
                                      onClick={() => navigator.clipboard.writeText(cyclistCode.code)}
                                      className="text-xs text-slate-500 hover:text-slate-700"
                                    >
                                      📋 Copy Code
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-500 text-sm">No cyclist codes available</p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="border-t border-slate-200 pt-4 mt-4">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => navigator.clipboard.writeText(session.trainer_code)}
                            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                          >
                            📋 Copy Trainer Code
                          </button>
                          <button
                            onClick={() => {
                              const codes = session.cyclist_codes?.map((c: any) => `${c.cyclist_name}: ${c.code}`).join('\n') || ''
                              navigator.clipboard.writeText(`Session: ${session.title}\nTrainer Code: ${session.trainer_code}\n\nPlayer Codes:\n${codes}`)
                            }}
                            className="bg-slate-600 text-white px-4 py-2 rounded text-sm hover:bg-slate-700"
                          >
                            📋 Copy All Codes
                          </button>
                          <Link
                            href={`/trainer/dashboard?session=${session.id}`}
                            className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                          >
                            🎮 Open Dashboard
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'trainers' && (
          <div className="space-y-8">
            {/* Pending Trainer Requests */}
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                🔔 Pending Trainer Requests ({trainerRequests.length})
              </h2>
              {trainerRequests.length === 0 ? (
                <div className="card text-center py-8">
                  <div className="text-4xl mb-2">📭</div>
                  <p className="text-slate-600">No pending trainer requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {trainerRequests.map((request) => (
                    <div key={request.id} className="card">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {request.name}
                          </h3>
                          <p className="text-slate-600">{request.email}</p>
                          {request.organization && (
                            <p className="text-sm text-slate-500">{request.organization}</p>
                          )}
                          {request.message && (
                            <div className="mt-3">
                              <p className="text-sm text-slate-700">
                                <strong>Message:</strong> {request.message}
                              </p>
                            </div>
                          )}
                          <p className="text-xs text-slate-500 mt-2">
                            Requested: {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => approveTrainer(request)}
                            className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => denyTrainer(request)}
                            className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                          >
                            ✗ Deny
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Approved Trainers */}
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                ✅ Approved Trainers ({approvedTrainers.length})
              </h2>
              {approvedTrainers.length === 0 ? (
                <div className="card text-center py-8">
                  <div className="text-4xl mb-2">👥</div>
                  <p className="text-slate-600">No approved trainers yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {approvedTrainers.map((trainer) => (
                    <div key={trainer.id} className="card">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-slate-900">{trainer.name}</h3>
                          <p className="text-slate-600 text-sm">{trainer.email}</p>
                          {trainer.organization && (
                            <p className="text-xs text-slate-500">{trainer.organization}</p>
                          )}
                          <p className="text-xs text-slate-500 mt-1">
                            Approved: {new Date(trainer.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => removeApprovedTrainer(trainer)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}