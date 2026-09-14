"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"

const STORAGE_KEY = "ballast:theme"

export function ThemeToggle() {
  const [isLight, setIsLight] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      const light = stored === "light"
      setIsLight(light)
      document.documentElement.classList.toggle("light", light)
    } catch {
      // localStorage unavailable — stay on the dark default
    }
  }, [])

  function toggle() {
    const next = !isLight
    setIsLight(next)
    document.documentElement.classList.toggle("light", next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "light" : "dark")
    } catch {
      // ignore
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle color theme" title="Toggle color theme">
      {mounted && isLight ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
