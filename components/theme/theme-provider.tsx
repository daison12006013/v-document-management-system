"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light"

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

interface ThemeProviderState {
  theme: Theme
  setTheme: (theme: Theme) => void
  mounted: boolean
}

const initialState: ThemeProviderState = {
  theme: "dark",
  setTheme: () => null,
  mounted: false,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export const ThemeProvider = ({
  children,
  defaultTheme = "dark",
  storageKey = "vistra-ui-theme",
  ...props
}: ThemeProviderProps) => {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(storageKey) as Theme
    if (stored) {
      setTheme(stored)
    }
  }, [storageKey])

  useEffect(() => {
    if (!mounted) return

    const root = window.document.documentElement

    root.classList.remove("light", "dark")
    root.classList.add(theme)
  }, [theme, mounted])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
    mounted,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
};

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}

