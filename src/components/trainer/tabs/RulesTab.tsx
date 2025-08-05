'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useTheme } from '@/lib/useTheme'
import { getGameRules } from '@/lib/mdx-utils'

export default function RulesTab() {
  const theme = useTheme()
  const [rulesContent, setRulesContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [showFullRules, setShowFullRules] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    const loadRules = async () => {
      try {
        const content = await getGameRules()
        setRulesContent(content.content)
      } catch (error) {
        console.error('Error loading rules:', error)
        setRulesContent('Failed to load game rules.')
      } finally {
        setIsLoading(false)
      }
    }

    loadRules()
  }, [])

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(rulesContent)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const shortRules = `# Quick Reference 🚴‍♂️

## 🎯 Your Mission
Maximize your cyclist's performance in Team Rubicon over 10 stages.

## 🕹️ Each Stage Decision
- **Sprint** 🚀 — Push hard, gain points, spend stamina (-1)
- **Cruise** 🛡️ — Ride steady, save stamina (+1 if team synergy is high)

## 💪 Stamina Rules
- Start with **5 stamina points**
- **No stamina?** Sprinting is blocked (frontend prevents it)
- Cruising restores +1 stamina when team synergy is good

## 🤝 Negotiation Stages
Meet before **stages 4, 7, and 10** to coordinate:
- **3+ teams aligned** = bonus multiplier
- **Stage 4**: x3 points
- **Stage 7**: x5 points  
- **Stage 10**: x10 points

## 🏆 Win Condition
Highest combined team score after 10 stages wins!`

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
            style={{ borderColor: theme.colors.primary }}
          ></div>
          <p style={{ color: theme.colors.text + '80', fontFamily: theme.fonts.primary }}>
            Loading game rules...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="p-6"
      style={{
        backgroundColor: theme.colors.background
      }}
    >
      {/* Header with controls */}
      <div className="flex items-center justify-between mb-6">
        <h3 
          className="text-xl font-bold flex items-center space-x-2"
          style={{
            color: theme.colors.text,
            fontFamily: theme.fonts.primary,
            fontWeight: theme.fonts.headingWeight
          }}
        >
          <span>📖 Game Rules</span>
        </h3>
        
        <div className="flex items-center space-x-3">
          {/* Version Toggle */}
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: theme.colors.accent + '30' }}>
            <button
              onClick={() => setShowFullRules(false)}
              className={`px-3 py-1 text-sm font-medium transition-all ${
                !showFullRules ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: !showFullRules ? theme.colors.primary : theme.colors.card,
                color: !showFullRules ? theme.colors.background : theme.colors.text,
                fontFamily: theme.fonts.primary
              }}
            >
              Quick
            </button>
            <button
              onClick={() => setShowFullRules(true)}
              className={`px-3 py-1 text-sm font-medium transition-all ${
                showFullRules ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: showFullRules ? theme.colors.primary : theme.colors.card,
                color: showFullRules ? theme.colors.background : theme.colors.text,
                fontFamily: theme.fonts.primary
              }}
            >
              Full
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopyToClipboard}
            className="px-3 py-1 text-sm font-medium rounded-lg transition-all hover:scale-105"
            style={{
              backgroundColor: copySuccess ? theme.colors.primary : theme.colors.card,
              color: copySuccess ? theme.colors.background : theme.colors.text + '80',
              fontFamily: theme.fonts.primary,
              border: `1px solid ${theme.colors.accent}30`
            }}
            title="Copy rules to clipboard"
          >
            {copySuccess ? '✅ Copied!' : '📋 Copy'}
          </button>

          {/* Reference Badge */}
          <div 
            className="text-xs px-2 py-1 rounded-full font-medium uppercase tracking-wide"
            style={{
              backgroundColor: theme.colors.accent + '20',
              color: theme.colors.accent,
              fontFamily: theme.fonts.primary
            }}
          >
            Reference Only
          </div>
        </div>
      </div>

      {/* Rules Content */}
      <div 
        className="rounded-xl border shadow-sm overflow-hidden"
        style={{
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.accent + '20',
          borderRadius: theme.borders.radius
        }}
      >
        <div className="p-6">
          <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
              // Custom component styling for better theme integration
              h1: ({ children }) => (
                <h1 
                  className="text-2xl font-bold mb-4 pb-2 border-b"
                  style={{
                    color: theme.colors.text,
                    fontFamily: theme.fonts.primary,
                    fontWeight: theme.fonts.headingWeight,
                    borderColor: theme.colors.accent + '30'
                  }}
                >
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 
                  className="text-xl font-bold mt-6 mb-3"
                  style={{
                    color: theme.colors.text,
                    fontFamily: theme.fonts.primary,
                    fontWeight: theme.fonts.headingWeight
                  }}
                >
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 
                  className="text-lg font-semibold mt-4 mb-2"
                  style={{
                    color: theme.colors.text,
                    fontFamily: theme.fonts.primary
                  }}
                >
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p 
                  className="mb-4 leading-relaxed"
                  style={{
                    color: theme.colors.text,
                    fontFamily: theme.fonts.primary
                  }}
                >
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul 
                  className="mb-4 space-y-2"
                  style={{
                    color: theme.colors.text,
                    fontFamily: theme.fonts.primary
                  }}
                >
                  {children}
                </ul>
              ),
              li: ({ children }) => (
                <li 
                  className="flex items-start space-x-2"
                  style={{
                    color: theme.colors.text,
                    fontFamily: theme.fonts.primary
                  }}
                >
                  <span style={{ color: theme.colors.primary }}>•</span>
                  <span>{children}</span>
                </li>
              ),
              strong: ({ children }) => (
                <strong 
                  style={{
                    color: theme.colors.primary,
                    fontFamily: theme.fonts.primary
                  }}
                >
                  {children}
                </strong>
              ),
              code: ({ children }) => (
                <code 
                  className="px-2 py-1 rounded text-sm"
                  style={{
                    backgroundColor: theme.colors.accent + '20',
                    color: theme.colors.text,
                    fontFamily: 'Monaco, Menlo, monospace'
                  }}
                >
                  {children}
                </code>
              )
            }}
            >
              {showFullRules ? rulesContent : shortRules}
            </ReactMarkdown>
          </div>
        </div>

        {/* Footer with helpful links */}
        <div 
          className="px-6 py-4 border-t"
          style={{
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.accent + '20'
          }}
        >
          <div className="flex items-center justify-between text-sm">
            <div 
              style={{
                color: theme.colors.text + '60',
                fontFamily: theme.fonts.primary
              }}
            >
              💡 <strong>Tip:</strong> Share these rules with players before the game starts
            </div>
            
            <div className="flex items-center space-x-4">
              <div 
                style={{
                  color: theme.colors.text + '50',
                  fontFamily: theme.fonts.primary
                }}
              >
                Total Stages: <strong style={{ color: theme.colors.primary }}>10</strong>
              </div>
              <div 
                style={{
                  color: theme.colors.text + '50',
                  fontFamily: theme.fonts.primary
                }}
              >
                Negotiation Stages: <strong style={{ color: theme.colors.accent }}>4, 7, 10</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}