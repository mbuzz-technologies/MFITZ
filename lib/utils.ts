import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/** Merge Tailwind class lists, resolving conflicting utility classes sanely. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a byte-derived GiB value for display, e.g. 12.345 -> "12.3 GiB". */
export function formatGiB(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "—"
  return `${value.toFixed(digits)} GiB`
}

export function formatNumber(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "—"
  return value.toLocaleString(undefined, { maximumFractionDigits: digits })
}

export function formatParams(count: number): string {
  if (count >= 1_000_000_000) return `${(count / 1_000_000_000).toFixed(count % 1_000_000_000 === 0 ? 0 : 1)}B`
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  return count.toLocaleString()
}

export function formatPct(fraction: number, digits = 0): string {
  if (!Number.isFinite(fraction)) return "—"
  return `${(fraction * 100).toFixed(digits)}%`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
