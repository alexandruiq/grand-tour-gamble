'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function TrainerAccessPage() {
  const [trainerCode, setTrainerCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trainerCode.trim()) {
      setError('Please enter a trainer code')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Find session by trainer code
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('trainer_code', trainerCode.toUpperCase())
        .single()

      if (sessionError || !session) {
        setError('Invalid trainer code. Please check and try again.')
        setIsLoading(false)
        return
      }

      // Store session info and redirect to trainer dashboard
      localStorage.setItem('trainerSession', JSON.stringify({
        sessionId: session.id,
        sessionTitle: session.title,
        trainerCode: session.trainer_code,
        trainerId: session.trainer_id
      }))

      router.push(`/trainer/dashboard?session=${session.id}`)
    } catch (err) {
      console.error('Error accessing session:', err)
      setError('Failed to access session. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-12">
          <Link 
            href="/"
            className="text-rubicon-600 hover:text-rubicon-700 text-sm font-medium mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            🎓 Trainer Access
          </h1>
          <p className="text-slate-600">
            Enter your trainer code to access your session dashboard
          </p>
        </div>

        {/* Access Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="trainerCode" className="block text-sm font-medium text-slate-700 mb-2">
                Trainer Code
              </label>
              <input
                type="text"
                id="trainerCode"
                value={trainerCode}
                onChange={(e) => setTrainerCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rubicon-500 focus:border-rubicon-500 text-center text-lg font-mono"
                placeholder="ABC123"
                maxLength={6}
                required
              />
              <p className="text-sm text-slate-500 mt-1">
                6-character code provided by admin
              </p>
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !trainerCode.trim()}
              className="w-full bg-rubicon-600 text-white py-3 px-4 rounded-lg hover:bg-rubicon-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Accessing Session...
                </div>
              ) : (
                'Access Trainer Dashboard'
              )}
            </button>
          </form>

          {/* Info Section */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <h3 className="text-lg font-medium text-slate-900 mb-3">
              Need a trainer code?
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start">
                <span className="text-rubicon-600 font-bold mr-2">📧</span>
                Check your email for the session code
              </li>
              <li className="flex items-start">
                <span className="text-rubicon-600 font-bold mr-2">👥</span>
                Ask the admin who created the session
              </li>
              <li className="flex items-start">
                <span className="text-rubicon-600 font-bold mr-2">🔍</span>
                Each session has a unique 6-character code
              </li>
            </ul>
          </div>
        </div>

        {/* Alternative Access */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500 mb-2">
            Don't have a trainer code yet?
          </p>
          <Link 
            href="/trainer"
            className="text-sm text-rubicon-600 hover:text-rubicon-700 font-medium"
          >
            Request trainer access →
          </Link>
        </div>
      </div>
    </div>
  )
}