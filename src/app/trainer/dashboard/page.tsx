'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import EnhancedTrainerDashboard from '@/components/trainer/EnhancedTrainerDashboard'

function TrainerDashboardContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Session ID</h2>
          <p className="text-gray-600">Please provide a valid session ID.</p>
        </div>
      </div>
    )
  }

  return <EnhancedTrainerDashboard sessionId={sessionId} />
}

export default function TrainerDashboardPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading trainer dashboard...</p>
          </div>
        </div>
      }
    >
      <TrainerDashboardContent />
    </Suspense>
  )
}