/**
 * Concurrency calculations.
 *
 * Theoretical maximum = VRAM available for KV cache ÷ KV cache per request.
 * Recommended sustainable applies a safety margin below that maximum, since
 * real deployments rarely want to run right up against the ceiling (memory
 * fragmentation, allocator overhead, and bursty request sizes all eat into
 * the theoretical number in practice).
 */

import { ConcurrencyResult } from "@/lib/types/calculator"

export const DEFAULT_SAFETY_MARGIN_PCT = 0.2

export function calculateConcurrency(
  vramAvailableGiB: number,
  kvCachePerRequestGiB: number,
  safetyMarginPct: number = DEFAULT_SAFETY_MARGIN_PCT
): ConcurrencyResult {
  const safeAvailable = Math.max(0, vramAvailableGiB)

  const theoreticalMaximum = kvCachePerRequestGiB > 0 ? safeAvailable / kvCachePerRequestGiB : 0
  const recommendedSustainable =
    kvCachePerRequestGiB > 0 ? (safeAvailable * (1 - safetyMarginPct)) / kvCachePerRequestGiB : 0

  const warnings: string[] = []
  if (vramAvailableGiB < 0) {
    warnings.push("Model weights alone exceed available VRAM — no room remains for KV cache.")
  } else if (recommendedSustainable < 1) {
    warnings.push(
      "Less than one full-context concurrent request recommended. Consider a smaller model, more aggressive quantization, or a shorter context length."
    )
  }

  return {
    theoreticalMaximum: Math.floor(theoreticalMaximum * 10) / 10,
    recommendedSustainable: Math.max(0, Math.floor(recommendedSustainable * 10) / 10),
    vramAvailableGiB,
    kvCachePerRequestGiB,
    safetyMarginPct,
    warnings,
  }
}
