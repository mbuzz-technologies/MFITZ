/**
 * KV-cache memory calculations.
 *
 * Formula: bytes = 2 × layers × KV heads × head dimension × tokens × bytes per KV element
 * The leading 2 accounts for both the Key and Value tensors. KV heads (not
 * attention heads) drive this — grouped-query / multi-query attention
 * models share KV heads across several attention heads, which is why this
 * needs architecture metadata rather than parameter count alone.
 */

import {
  ModelSpec,
  KvPrecision,
  KvCachePrecisionBytes,
  KvCachePerRequestResult,
  TotalKvCacheResult,
} from "@/lib/types/calculator"
import { BYTES_PER_GIB } from "./memory"

/** Default overhead on top of the raw architecture-aware KV-cache calc (allocator fragmentation, padding). */
export const DEFAULT_KV_CACHE_OVERHEAD_PCT = 0.1

export function calculateKvCachePerRequest(
  model: ModelSpec,
  contextTokens: number,
  kvPrecision: KvPrecision,
  averageUtilization: number = 1.0,
  kvCacheOverheadPct: number = DEFAULT_KV_CACHE_OVERHEAD_PCT
): KvCachePerRequestResult {
  const bytesPerElement = KvCachePrecisionBytes[kvPrecision]
  const overheadFactor = 1 + kvCacheOverheadPct

  const perTokenBytes = 2 * model.layers * model.kvHeads * model.headDimension * bytesPerElement

  const worstCaseBytes = perTokenBytes * contextTokens * overheadFactor
  const typicalTokens = Math.round(contextTokens * averageUtilization)
  const typicalBytes = perTokenBytes * typicalTokens * overheadFactor

  return {
    worstCaseBytes,
    worstCaseGiB: worstCaseBytes / BYTES_PER_GIB,
    typicalBytes,
    typicalGiB: typicalBytes / BYTES_PER_GIB,
    bytesPerElement,
    perTokenBytes,
  }
}

export function calculateTotalKvCache(
  perRequest: KvCachePerRequestResult,
  concurrentRequests: number
): TotalKvCacheResult {
  return {
    totalTypicalGiB: perRequest.typicalGiB * concurrentRequests,
    totalWorstCaseGiB: perRequest.worstCaseGiB * concurrentRequests,
  }
}
