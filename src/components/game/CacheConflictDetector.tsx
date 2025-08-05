'use client'

import { useEffect } from 'react'

export default function CacheConflictDetector() {
  useEffect(() => {
    // Check for cache conflicts on load
    try {
      const localData = localStorage.getItem('gameSession')
      const sessionData = sessionStorage.getItem('gameSession')
      
      if (localData && sessionData) {
        const local = JSON.parse(localData)
        const session = JSON.parse(sessionData)
        
        // Check if they have different join codes
        if (local.joinCode !== session.joinCode) {
          console.warn('🚨 Cache conflict detected! Different join codes in localStorage vs sessionStorage')
          console.log('localStorage:', local)
          console.log('sessionStorage:', session)
          
          // Clear both to prevent conflicts
          localStorage.removeItem('gameSession')
          sessionStorage.removeItem('gameSession')
          console.log('✅ Cleared conflicting cache data')
        }
      }
    } catch (error) {
      console.error('Error checking cache conflicts:', error)
      // Clear corrupted cache
      localStorage.removeItem('gameSession')
      sessionStorage.removeItem('gameSession')
    }
  }, [])

  return null // This component renders nothing
}