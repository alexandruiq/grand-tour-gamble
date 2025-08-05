'use client'

import { useTheme } from '@/lib/useTheme'

interface CompactAlertProps {
  type: 'info' | 'warning' | 'success' | 'error' | 'negotiation'
  icon: string
  title: string
  message?: string
  className?: string
}

export default function CompactAlert({ 
  type, 
  icon, 
  title, 
  message, 
  className = '' 
}: CompactAlertProps) {
  const theme = useTheme()

  const getAlertStyles = () => {
    switch (type) {
      case 'info':
        return {
          backgroundColor: theme.colors.primary + '10',
          borderColor: theme.colors.primary + '30',
          textColor: theme.colors.primary
        }
      case 'warning':
        return {
          backgroundColor: '#fef3c7',
          borderColor: '#f59e0b',
          textColor: '#92400e'
        }
      case 'success':
        return {
          backgroundColor: '#d1fae5',
          borderColor: '#10b981',
          textColor: '#065f46'
        }
      case 'error':
        return {
          backgroundColor: '#fee2e2',
          borderColor: '#ef4444',
          textColor: '#991b1b'
        }
      case 'negotiation':
        return {
          backgroundColor: '#fef3c7',
          borderColor: '#f59e0b',
          textColor: '#92400e'
        }
      default:
        return {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.accent + '30',
          textColor: theme.colors.text
        }
    }
  }

  const styles = getAlertStyles()

  return (
    <div className={`${className}`}>
      <div 
        className="flex items-center px-4 py-3 border rounded-lg shadow-sm transition-all duration-300"
        style={{
          backgroundColor: styles.backgroundColor,
          borderColor: styles.borderColor,
          color: styles.textColor,
          borderRadius: theme.borders.radius,
          fontFamily: theme.fonts.primary
        }}
      >
        <span className="text-lg mr-3">{icon}</span>
        <div className="flex-1 min-w-0">
          <div 
            className="font-semibold text-sm truncate"
            style={{ fontWeight: theme.fonts.bodyWeight }}
          >
            {title}
          </div>
          {message && (
            <div className="text-xs opacity-80 mt-1">{message}</div>
          )}
        </div>
      </div>
    </div>
  )
}