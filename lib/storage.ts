/**
 * Saved-configuration persistence via localStorage. All calls are safe to
 * invoke during SSR (return empty/no-op) and tolerate a disabled or full
 * storage (private browsing, quota errors) without throwing.
 */

import { CalculatorState, SavedConfiguration } from "@/lib/types/calculator"
import { savedConfigurationSchema } from "@/lib/validation"

const STORAGE_KEY = "mfitz:saved-configurations:v1"
const MAX_SAVED = 50

function readAll(): SavedConfiguration[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is SavedConfiguration => savedConfigurationSchema.safeParse(item).success)
  } catch {
    return []
  }
}

function writeAll(configs: SavedConfiguration[]): boolean {
  if (typeof window === "undefined") return false
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(configs.slice(0, MAX_SAVED)))
    return true
  } catch {
    return false
  }
}

export function listSavedConfigurations(): SavedConfiguration[] {
  return readAll().sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1))
}

export function saveConfiguration(name: string, state: CalculatorState): SavedConfiguration | null {
  const config: SavedConfiguration = {
    id: `cfg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim() || "Untitled configuration",
    savedAt: new Date().toISOString(),
    state,
  }
  const ok = writeAll([config, ...readAll()])
  return ok ? config : null
}

export function deleteConfiguration(id: string): boolean {
  return writeAll(readAll().filter((c) => c.id !== id))
}

export function isStorageAvailable(): boolean {
  if (typeof window === "undefined") return false
  try {
    const testKey = "mfitz:storage-test"
    window.localStorage.setItem(testKey, "1")
    window.localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}
