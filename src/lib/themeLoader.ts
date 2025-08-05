'use client'

import { Theme } from './useTheme'

// Available themes registry
const THEMES: Record<string, Theme> = {
  qualians: {
    colors: {
      primary: "#002B5C",
      background: "#F2F4F8", 
      text: "#1A1A1A",
      card: "#FFFFFF",
      accent: "#4C9ED9"
    },
    fonts: {
      primary: "Inter, sans-serif",
      headingWeight: 600,
      bodyWeight: 400
    },
    borders: {
      radius: "0.5rem",
      buttonRadius: "0.375rem"
    },
    effects: {
      hoverOpacity: 0.85,
      transition: "ease-in-out"
    }
  },

  // Example alternative theme (corporate blue)
  corporate: {
    colors: {
      primary: "#1E40AF",
      background: "#F8FAFC",
      text: "#1F2937",
      card: "#FFFFFF", 
      accent: "#3B82F6"
    },
    fonts: {
      primary: "Roboto, sans-serif",
      headingWeight: 700,
      bodyWeight: 400
    },
    borders: {
      radius: "0.75rem",
      buttonRadius: "0.5rem"
    },
    effects: {
      hoverOpacity: 0.9,
      transition: "ease-out"
    }
  },
  
  // Default fallback theme
  default: {
    colors: {
      primary: '#000',
      background: '#fff',
      text: '#000',
      card: '#f5f5f5',
      accent: '#00b2a9'
    },
    fonts: {
      primary: 'sans-serif',
      headingWeight: 700,
      bodyWeight: 400
    },
    borders: {
      radius: '0.5rem',
      buttonRadius: '0.375rem'
    },
    effects: {
      hoverOpacity: 0.85,
      transition: 'ease-in-out'
    }
  }
}

/**
 * Get theme by name
 * @param themeName - Name of the theme to load
 * @returns Theme object
 */
export function getTheme(themeName: string = 'qualians'): Theme {
  return THEMES[themeName] || THEMES.default
}

/**
 * Get available theme names
 * @returns Array of available theme names
 */
export function getAvailableThemes(): string[] {
  return Object.keys(THEMES)
}

/**
 * Add a new theme dynamically
 * @param name - Theme name
 * @param theme - Theme configuration
 */
export function addTheme(name: string, theme: Theme): void {
  THEMES[name] = theme
}