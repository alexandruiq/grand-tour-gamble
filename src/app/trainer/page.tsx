'use client'

import Link from 'next/link'

export default function TrainerPage() {
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
            Get access to run Grand Tour Gamble sessions
          </p>
        </div>

        {/* Options Card */}
        <div className="card">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Choose Your Path
              </h2>
            </div>

            {/* Request Access Option */}
            <div className="border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-2">
                🆕 New Trainer
              </h3>
              <p className="text-slate-600 text-sm mb-4">
                Don't have trainer access yet? Request approval from admin.
              </p>
              <Link
                href="/trainer/request"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium text-center block"
              >
                Request Trainer Access
              </Link>
            </div>

            {/* Session Access Option */}
            <div className="border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-2">
                🎮 Access Session
              </h3>
              <p className="text-slate-600 text-sm mb-4">
                Have a trainer code? Access your session dashboard directly.
              </p>
              <Link
                href="/trainer/access"
                className="w-full bg-rubicon-600 text-white py-2 px-4 rounded-lg hover:bg-rubicon-700 font-medium text-center block"
              >
                Enter Trainer Code
              </Link>
            </div>

            {/* Admin Access Option */}
            <div className="border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-2">
                ⚙️ Admin Access
              </h3>
              <p className="text-slate-600 text-sm mb-4">
                Admin? Create and manage sessions from the admin panel.
              </p>
              <Link
                href="/admin/login"
                className="w-full bg-slate-600 text-white py-2 px-4 rounded-lg hover:bg-slate-700 font-medium text-center block"
              >
                Go to Admin Panel
              </Link>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <h3 className="text-lg font-medium text-slate-900 mb-3">
              How it works
            </h3>
            <ol className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                  1
                </span>
                <div>Request trainer access with your details</div>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                  2
                </span>
                <div>Admin reviews and approves your request</div>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                  3
                </span>
                <div>Create and manage training sessions</div>
              </li>
            </ol>
          </div>
        </div>

        {/* Player Access Link */}
        <div className="mt-8 text-center">
          <Link 
            href="/login"
            className="text-sm text-rubicon-600 hover:text-rubicon-700"
          >
            Join as a player instead →
          </Link>
        </div>
      </div>
    </div>
  )
}