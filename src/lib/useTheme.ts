import { getTheme } from './themeLoader'

export interface Theme {
  colors: {
    primary: string
    background: string
    text: string
    card: string
    accent: string
  }
  fonts: {
    primary: string
    headingWeight: number
    bodyWeight: number
  }
  borders: {
    radius: string
    buttonRadius: string
  }
  effects: {
    hoverOpacity: number
    transition: string
  }
}

/**
 * Hook to get the current theme
 * Can be extended to support theme switching, environment-based themes, etc.
 */
export function useTheme(themeName?: string): Theme {
  // For now, always return the Qualians theme
  // In the future, this could read from context, localStorage, environment variables, etc.
  return getTheme(themeName || 'qualians')
}