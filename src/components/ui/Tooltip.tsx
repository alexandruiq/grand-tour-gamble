'use client'

import { useState, useRef, useEffect } from 'react'
import { useTheme } from '@/lib/useTheme'

interface TooltipProps {
  content: string | string[]
  children: React.ReactNode
  className?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export default function Tooltip({ 
  content, 
  children, 
  className = '',
  position = 'top' 
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const theme = useTheme()

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      
      let x = 0
      let y = 0

      switch (position) {
        case 'top':
          x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
          y = triggerRect.top - tooltipRect.height - 8
          break
        case 'bottom':
          x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
          y = triggerRect.bottom + 8
          break
        case 'left':
          x = triggerRect.left - tooltipRect.width - 8
          y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2
          break
        case 'right':
          x = triggerRect.right + 8
          y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2
          break
      }

      // Keep tooltip within viewport
      const padding = 8
      x = Math.max(padding, Math.min(x, window.innerWidth - tooltipRect.width - padding))
      y = Math.max(padding, Math.min(y, window.innerHeight - tooltipRect.height - padding))

      setTooltipPosition({ x, y })
    }
  }, [isVisible, position])

  const handleMouseEnter = () => setIsVisible(true)
  const handleMouseLeave = () => setIsVisible(false)

  const contentArray = Array.isArray(content) ? content : [content]

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`cursor-help ${className}`}
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 pointer-events-none"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
          }}
        >
          <div
            className="px-3 py-2 text-sm rounded-lg shadow-lg max-w-xs"
            style={{
              backgroundColor: theme.colors.text,
              color: theme.colors.background,
              fontFamily: theme.fonts.primary,
              borderRadius: theme.borders.radius,
            }}
          >
            {contentArray.map((line, index) => (
              <div key={index} className={index > 0 ? 'mt-1' : ''}>
                {line}
              </div>
            ))}
            
            {/* Arrow */}
            <div
              className="absolute w-2 h-2 transform rotate-45"
              style={{
                backgroundColor: theme.colors.text,
                [position === 'top' ? 'bottom' : position === 'bottom' ? 'top' : position === 'left' ? 'right' : 'left']: '-4px',
                [position === 'top' || position === 'bottom' ? 'left' : 'top']: '50%',
                transform: 'translateX(-50%) rotate(45deg)',
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}