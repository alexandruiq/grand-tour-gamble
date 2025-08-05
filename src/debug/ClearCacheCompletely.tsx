'use client'

import { useEffect } from 'react'

export function ClearCacheCompletely() {
  useEffect(() => {
    console.log('🧹 FORCE CLEARING ALL CACHE...')
    
    // Clear all localStorage keys that might be related
    const keysToRemove = [
      'gameSession',
      'gameSessionCache',
      'cyclist_codes',
      'session_data',
      'user_session',
      'supabase.auth.token',
      'sb-qhlfbvsgasdxwxpukfkk-auth-token'
    ]
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
      console.log(`🗑️ Removed: ${key}`)
    })
    
    // Clear all localStorage items that start with common prefixes
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key && (key.includes('game') || key.includes('session') || key.includes('cyclist'))) {
        localStorage.removeItem(key)
        console.log(`🗑️ Removed pattern: ${key}`)
      }
    }
    
    // Force page reload to ensure clean state
    console.log('🔄 Cache cleared! Reloading page...')
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }, [])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md">
        <h3 className="text-lg font-bold mb-2">🧹 Clearing Cache</h3>
        <p className="text-gray-600">
          Clearing all cached data and reloading page...
        </p>
        <div className="mt-4 text-sm">
          <div>✓ Clearing gameSession cache</div>
          <div>✓ Clearing browser storage</div>
          <div>✓ Preparing fresh start</div>
        </div>
      </div>
    </div>
  )
}