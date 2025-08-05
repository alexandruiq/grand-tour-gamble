'use client'

import { useState, useEffect } from 'react'
import { getGameRules } from '@/lib/mdx-utils'
import { useTheme } from '@/lib/useTheme'

interface RulesModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function RulesModal({ isOpen, onClose }: RulesModalProps) {
  const [rulesContent, setRulesContent] = useState('')
  const [loading, setLoading] = useState(true)
  const theme = useTheme()

  useEffect(() => {
    if (isOpen) {
      const loadRules = () => {
        try {
          const rules = getGameRules()
          setRulesContent(rules.content)
        } catch (error) {
          console.error('Error loading rules:', error)
          setRulesContent('Error loading game rules. Please try again.')
        } finally {
          setLoading(false)
        }
      }
      
      loadRules()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div 
        className="rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 animate-in fade-in-0 scale-in-95"
        style={{
          backgroundColor: theme.colors.background,
          borderRadius: theme.borders.radius,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Header */}
        <div 
          className="sticky top-0 border-b p-6 flex justify-between items-center"
          style={{
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.accent + '20'
          }}
        >
          <div>
            <h2 
              className="text-2xl font-bold"
              style={{
                color: theme.colors.text,
                fontFamily: theme.fonts.primary,
                fontWeight: theme.fonts.headingWeight
              }}
            >
              Game Rules
            </h2>
            <p 
              style={{
                color: theme.colors.text + '80',
                fontFamily: theme.fonts.primary
              }}
            >
              The Grand Tour Gamble - Player Guide
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-3xl leading-none p-2 hover:opacity-75 transition-opacity"
            style={{
              color: theme.colors.text + '60'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rubicon-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading rules...</p>
            </div>
          ) : (
            <div className="prose prose-gray max-w-none">
              {/* Quick Reference Cards */}
              <div className="grid md:grid-cols-2 gap-4 mb-6 not-prose">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">🛡️ Cruise Strategy</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Safer for stamina</li>
                    <li>• Builds team synergy</li>
                    <li>• Recovers +1 stamina (if synergy ≥50%)</li>
                    <li>• Points depend on team alignment</li>
                  </ul>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 mb-2">🚀 Sprint Strategy</h3>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• Higher individual points potential</li>
                    <li>• Costs -1 stamina</li>
                    <li>• Risk of burnout at 0 stamina (-2 pts)</li>
                    <li>• Can reduce team synergy</li>
                  </ul>
                </div>
              </div>

              {/* Scoring Matrix */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 not-prose">
                <h3 className="font-semibold text-gray-800 mb-3">📊 Scoring Matrix</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="text-left py-2">Team Decisions</th>
                        <th className="text-center py-2">Cruisers Points</th>
                        <th className="text-center py-2">Sprinters Points</th>
                      </tr>
                    </thead>
                    <tbody className="space-y-1">
                      <tr className="border-b border-gray-200">
                        <td className="py-2">4 Cruise</td>
                        <td className="text-center font-medium text-green-600">+1 each</td>
                        <td className="text-center">—</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2">3 Cruise, 1 Sprint</td>
                        <td className="text-center text-red-600">-1 each</td>
                        <td className="text-center font-medium text-green-600">+3</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2">2 Cruise, 2 Sprint</td>
                        <td className="text-center text-red-600">-2 each</td>
                        <td className="text-center font-medium text-green-600">+2 each</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2">1 Cruise, 3 Sprint</td>
                        <td className="text-center text-red-600">-3</td>
                        <td className="text-center font-medium text-green-600">+1 each</td>
                      </tr>
                      <tr>
                        <td className="py-2">4 Sprint</td>
                        <td className="text-center">—</td>
                        <td className="text-center text-red-600">-1 each</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Negotiation Stages */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 not-prose">
                <h3 className="font-semibold text-yellow-800 mb-3">🗣️ Negotiation Rounds</h3>
                <div className="space-y-2 text-sm text-yellow-700">
                  <div>📍 <strong>Stages 4, 7, 9:</strong> Negotiation rounds</div>
                  <div>🎯 <strong>3+ aligned decisions:</strong> x1.5 multiplier</div>
                  <div>🏆 <strong>4 aligned decisions:</strong> x2.0 multiplier</div>
                  <div className="mt-2 text-xs">Coordinate with your team for maximum point bonus!</div>
                </div>
              </div>

              {/* Full Rules Content */}
              <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                {rulesContent}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-between items-center bg-gray-50">
          <div className="text-sm text-gray-600">
            📖 Keep this reference handy during gameplay
          </div>
          <button
            onClick={onClose}
            className="btn-primary"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  )
}