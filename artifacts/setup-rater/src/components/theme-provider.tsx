import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

function resolveTheme(theme: Theme): "dark" | "light" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  }
  return theme
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")
    if (theme === "system") {
      const sys = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.add(sys)
      return
    }
    root.classList.add(theme)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    const toResolved = resolveTheme(newTheme)

    const applyTheme = () => {
      const root = window.document.documentElement
      root.classList.remove("light", "dark")
      root.classList.add(toResolved)
      localStorage.setItem(storageKey, newTheme)
      setThemeState(newTheme)
    }

    // 1. Blow up the petals
    window.dispatchEvent(new CustomEvent("sakura:explode"))

    if (!("startViewTransition" in document)) {
      // Fallback: just apply + respawn after a beat
      applyTheme()
      setTimeout(() => window.dispatchEvent(new CustomEvent("sakura:spawn")), 600)
      return
    }

    // 2. Give particles ~650ms to fly, then start the diagonal wipe
    setTimeout(() => {
      document.documentElement.style.setProperty(
        "--vt-anim",
        toResolved === "dark" ? "vt-to-dark" : "vt-to-light"
      )

      const vt = (document as Document & {
        startViewTransition: (cb: () => void) => { finished: Promise<void> }
      }).startViewTransition(applyTheme)

      // 3. After wipe completes, spawn fresh petals
      vt.finished.finally(() => {
        document.documentElement.style.removeProperty("--vt-anim")
        window.dispatchEvent(new CustomEvent("sakura:spawn"))
      })
    }, 650)
  }

  return (
    <ThemeProviderContext.Provider {...props} value={{ theme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")
  return context
}
