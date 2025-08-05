'use client'

import { useEffect, useState } from 'react'

interface CachedData {
  localStorage: any
  sessionStorage: any
}

export default function CacheDebugger() {
  const [cacheData, setCacheData] = useState<CachedData>({ localStorage: null, sessionStorage: null })

  useEffect(() => {
    try {
      const localData = localStorage.getItem('gameSession')
      const sessionData = sessionStorage.getItem('gameSession')
      
      setCacheData({
        localStorage: localData ? JSON.parse(localData) : null,
        sessionStorage: sessionData ? JSON.parse(sessionData) : null
      })
    } catch (error) {
      console.error('Error reading cache:', error)
    }
  }, [])

  const clearCache = () => {
    localStorage.removeItem('gameSession')
    sessionStorage.removeItem('gameSession')
    setCacheData({ localStorage: null, sessionStorage: null })
    console.log('✅ Cache cleared!')
  }

  return (
    <div className="fixed top-0 left-0 bg-black bg-opacity-75 text-white p-4 z-50 max-w-md">
      <h3 className="font-bold mb-2">🔧 Cache Debugger</h3>
      
      <div className="mb-4">
        <h4 className="font-semibold">localStorage:</h4>
        <pre className="text-xs bg-gray-800 p-2 overflow-auto max-h-32">
          {JSON.stringify(cacheData.localStorage, null, 2)}
        </pre>
      </div>
      
      <div className="mb-4">
        <h4 className="font-semibold">sessionStorage:</h4>
        <pre className="text-xs bg-gray-800 p-2 overflow-auto max-h-32">
          {JSON.stringify(cacheData.sessionStorage, null, 2)}
        </pre>
      </div>
      
      <button 
        onClick={clearCache}
        className="bg-red-600 px-3 py-1 rounded text-sm"
      >
        Clear Cache
      </button>
    </div>
  )
}