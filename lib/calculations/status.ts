/**
 * Overall fit-status classification: SAFE / TIGHT / NOT_FEASIBLE.
 *
 * Combines the "typical" allocation (context-utilization-scaled KV cache —
 * what the deployment will usually experience) with the "worst case"
 * allocation (full-context KV cache for every concurrent request — what
 * happens if every client fills the context window at once).
 */

import { VramAllocationResult, FitStatusResult } from "@/lib/types/calculator"

/** Below this free-VRAM percentage on the typical allocation, flag as TIGHT even if it technically fits. */
const TIGHT_HEADROOM_PCT = 15

export function deriveFitStatus(typical: VramAllocationResult, worstCase: VramAllocationResult): FitStatusResult {
  if (!typical.fits) {
    return {
      status: "NOT_FEASIBLE",
      headline: "Does not fit",
      detail: `This configuration needs ${Math.abs(typical.freeGiB).toFixed(1)} GiB more VRAM than is available, even under typical (non-worst-case) usage.`,
    }
  }

  if (!worstCase.fits) {
    return {
      status: "TIGHT",
      headline: "Fits typically, risky at full context",
      detail: `Fits under typical usage, but every concurrent request filling its full context window would exceed available VRAM by ${Math.abs(worstCase.freeGiB).toFixed(1)} GiB. Consider a safety margin or admission control.`,
    }
  }

  if (typical.percentageFree < TIGHT_HEADROOM_PCT) {
    return {
      status: "TIGHT",
      headline: "Fits, but with thin headroom",
      detail: `Only ${typical.percentageFree.toFixed(1)}% of VRAM remains free under typical usage. Memory fragmentation or a burst of long-context requests could push this over budget.`,
    }
  }

  return {
    status: "SAFE",
    headline: "Comfortably fits",
    detail: `${typical.percentageFree.toFixed(1)}% VRAM headroom remains under typical usage, and the worst-case (full-context) scenario still fits.`,
  }
}
