'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { validateAdminLogin, setAdminAuthenticated } from '@/lib/admin-auth'

export default function AdminLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (validateAdminLogin(username, password)) {
      setAdminAuthenticated(true)
      router.push('/admin')
    } else {
      setError('Invalid username or password')
    }
    
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-12">
          <Link 
            href="/"
            className="text-slate-600 hover:text-slate-700 text-sm font-medium mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            🔐 Admin Access
          </h1>
          <p className="text-slate-600">
            Grand Tour Gamble Administration
          </p>
        </div>

        {/* Login Form */}
        <div className="card">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                placeholder="Enter admin username"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                placeholder="Enter admin password"
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !username.trim() || !password.trim()}
              className="w-full bg-slate-600 text-white py-2 px-4 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>


        </div>
      </div>
    </div>
  )
}