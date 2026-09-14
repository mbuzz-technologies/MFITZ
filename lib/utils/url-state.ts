/**
 * Encode/decode the full calculator state to/from a single URL query
 * parameter so any configuration — including custom GPU/model entries — can
 * be shared or bookmarked as one link. State is JSON-serialized, then
 * base64url-encoded; decoding validates through zod and falls back to
 * defaults (merged field-by-field) for anything missing or malformed, so a
 * hand-edited or stale URL never crashes the page.
 */

import { CalculatorState } from "@/lib/types/calculator"
import { calculatorStateSchema } from "@/lib/validation"
import { defaultCalculatorState } from "@/lib/presets"

const PARAM = "s"

function toBase64Url(input: string): string {
  const base64 =
    typeof window !== "undefined"
      ? window.btoa(unescape(encodeURIComponent(input)))
      : Buffer.from(input, "utf-8").toString("base64")
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromBase64Url(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(input.length + ((4 - (input.length % 4)) % 4), "=")
  return typeof window !== "undefined" ? decodeURIComponent(escape(window.atob(padded))) : Buffer.from(padded, "base64").toString("utf-8")
}

export function encodeUrlState(state: CalculatorState): string {
  const encoded = toBase64Url(JSON.stringify(state))
  return `?${PARAM}=${encoded}`
}

/** Deep-merge parsed JSON over the defaults so a partial/older payload still validates. */
function mergeWithDefaults(parsed: unknown): unknown {
  if (typeof parsed !== "object" || parsed === null) return defaultCalculatorState
  const p = parsed as Record<string, unknown>
  return {
    ...defaultCalculatorState,
    ...p,
    customGpu: { ...defaultCalculatorState.customGpu, ...(typeof p.customGpu === "object" && p.customGpu ? p.customGpu : {}) },
    customModel: { ...defaultCalculatorState.customModel, ...(typeof p.customModel === "object" && p.customModel ? p.customModel : {}) },
  }
}

export function decodeUrlState(search: string): CalculatorState {
  try {
    const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
    const raw = params.get(PARAM)
    if (!raw) return defaultCalculatorState

    const json = fromBase64Url(raw)
    const parsed = JSON.parse(json)
    const merged = mergeWithDefaults(parsed)
    const result = calculatorStateSchema.safeParse(merged)
    return result.success ? (result.data as CalculatorState) : defaultCalculatorState
  } catch {
    return defaultCalculatorState
  }
}
