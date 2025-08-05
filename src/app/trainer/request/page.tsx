'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function TrainerRequestPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [organization, setOrganization] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Check if email already has a pending or approved request
      const { data: existingRequest } = await supabase
        .from('trainer_requests')
        .select('id, status')
        .eq('email', email)
        .single()

      if (existingRequest) {
        if (existingRequest.status === 'approved') {
          setError('This email already has approved trainer access')
        } else if (existingRequest.status === 'pending') {
          setError('A request for this email is already pending approval')
        } else {
          setError('This email has a previous request. Please contact admin.')
        }
        setIsLoading(false)
        return
      }

      // Create trainer request
      const { error: insertError } = await supabase
        .from('trainer_requests')
        .insert({
          name,
          email,
          organization,
          message,
          status: 'pending'
        })

      if (insertError) throw insertError

      setSuccess(true)
      
      // Clear form
      setName('')
      setEmail('')
      setOrganization('')
      setMessage('')

    } catch (err) {
      console.error('Error submitting trainer request:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit request')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8 pt-12">
            <h1 className="text-3xl font-bold text-green-600 mb-2">
              ✅ Request Submitted!
            </h1>
            <p className="text-slate-600">
              Your trainer access request has been sent
            </p>
          </div>

          <div className="card text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              What happens next?
            </h2>
            <div className="space-y-3 text-slate-700">
              <p>✓ Admin will review your request</p>
              <p>✓ You'll be notified when approved</p>
              <p>✓ Then you can create training sessions</p>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-200">
              <Link
                href="/"
                className="btn-primary"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
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
            🎓 Request Trainer Access
          </h1>
          <p className="text-slate-600">
            Apply to become a Grand Tour Gamble trainer
          </p>
        </div>

        {/* Request Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rubicon-500 focus:border-rubicon-500"
                placeholder="Your full name"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rubicon-500 focus:border-rubicon-500"
                placeholder="your.email@organization.com"
                required
              />
            </div>

            <div>
              <label htmlFor="organization" className="block text-sm font-medium text-slate-700 mb-2">
                Organization
              </label>
              <input
                type="text"
                id="organization"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rubicon-500 focus:border-rubicon-500"
                placeholder="Company or institution name"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
                Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rubicon-500 focus:border-rubicon-500"
                placeholder="Tell us about your training background and why you need trainer access..."
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !name.trim() || !email.trim()}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Submitting Request...
                </div>
              ) : (
                'Submit Trainer Request'
              )}
            </button>
          </form>

          {/* Info Section */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <h3 className="text-lg font-medium text-slate-900 mb-3">
              Why do we need approval?
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start">
                <span className="text-rubicon-600 font-bold mr-2">🔒</span>
                Ensures training quality and security
              </li>
              <li className="flex items-start">
                <span className="text-rubicon-600 font-bold mr-2">📊</span>
                Maintains proper session management
              </li>
              <li className="flex items-start">
                <span className="text-rubicon-600 font-bold mr-2">🎯</span>
                Provides access to advanced features
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}