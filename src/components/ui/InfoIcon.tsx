'use client'

import Tooltip from './Tooltip'

interface InfoIconProps {
  content: string | string[]
  className?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  icon?: string
}

export default function InfoIcon({ 
  content, 
  className = '',
  position = 'top',
  icon = 'ℹ️'
}: InfoIconProps) {
  return (
    <Tooltip content={content} position={position} className={className}>
      <span className="text-gray-400 hover:text-gray-600 transition-colors cursor-help select-none">
        {icon}
      </span>
    </Tooltip>
  )
}