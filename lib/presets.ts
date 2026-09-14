/**
 * Assembly layer: default state, quick-start use-case presets, context-length
 * options, GPU/model resolution (including custom entries), and the reverse
 * recommendation engine.
 */

import { gpuPresets, gpuDatabase } from "@/lib/data/gpus"
import { modelPresets, modelDatabase } from "@/lib/data/models"
import { CalculatorState, ModelSpec, QuantizationFormat, KvPrecision, GpuRecommendation } from "@/lib/types/calculator"
import { calculateModelWeightMemory, calculateEffectiveComputeMemory, calculateVramAllocation } from "@/lib/calculations/memory"
import { calculateKvCachePerRequest } from "@/lib/calculations/kv-cache"
import { calculatePerformanceEstimate } from "@/lib/calculations/performance"
import { deriveFitStatus } from "@/lib/calculations/status"
import { resolveGpu, resolveModel, defaultCustomGpu, defaultCustomModel } from "@/lib/resolve"

export { gpuPresets, gpuDatabase, modelPresets, modelDatabase, resolveGpu, resolveModel, defaultCustomGpu, defaultCustomModel }

// ---------------------------------------------------------------------------
// Context length presets (tokens)
// ---------------------------------------------------------------------------

export const contextPresets: { label: string; tokens: number }[] = [
  { label: "1K", tokens: 1_000 },
  { label: "2K", tokens: 2_000 },
  { label: "4K", tokens: 4_000 },
  { label: "8K", tokens: 8_000 },
  { label: "16K", tokens: 16_000 },
  { label: "32K", tokens: 32_000 },
  { label: "64K", tokens: 64_000 },
  { label: "128K", tokens: 128_000 },
]

// ---------------------------------------------------------------------------
// Default state
// ---------------------------------------------------------------------------

export const defaultCalculatorState: CalculatorState = {
  mode: "simple",
  gpu: "rtx_4090",
  customGpu: defaultCustomGpu,
  gpuCount: 1,
  model: "7b",
  customModel: defaultCustomModel,
  quantization: "INT4",
  contextTokens: 8_000,
  averageUtilization: 0.5,
  kvPrecision: "FP16",
  kvCacheOverheadPct: 0.1,
  concurrentRequests: 1,
  systemOverheadPct: 0.1,
  safetyMarginPct: 0.2,
}

// ---------------------------------------------------------------------------
// Quick-start use-case presets
// ---------------------------------------------------------------------------

function preset(overrides: Partial<CalculatorState>): CalculatorState {
  return { ...defaultCalculatorState, ...overrides }
}

export const useCasePresets: Record<string, CalculatorState> = {
  "Laptop inference": preset({
    gpu: "rtx_3060_12gb",
    model: "7b",
    quantization: "INT4",
    contextTokens: 8_000,
    concurrentRequests: 2,
  }),
  "Dev workstation": preset({
    gpu: "rtx_4090",
    model: "13b",
    quantization: "INT4",
    contextTokens: 16_000,
    concurrentRequests: 4,
  }),
  "Cloud inference": preset({
    gpu: "a100_80gb",
    model: "70b",
    quantization: "FP16",
    contextTokens: 32_000,
    concurrentRequests: 8,
  }),
  "Multi-GPU research": preset({
    gpu: "a100_80gb",
    gpuCount: 2,
    model: "70b",
    quantization: "FP16",
    contextTokens: 64_000,
    concurrentRequests: 16,
  }),
  "MoE workload": preset({
    gpu: "a100_80gb",
    model: "mixtral-8x7b",
    quantization: "INT4",
    contextTokens: 32_000,
    concurrentRequests: 8,
  }),
}

// ---------------------------------------------------------------------------
// Reverse recommendation engine: given a workload, which GPUs fit?
// ---------------------------------------------------------------------------

const GPU_COUNTS_TO_TRY = [1, 2, 4, 8]

export function recommendGpuConfigurations(
  model: ModelSpec,
  quantization: QuantizationFormat,
  contextTokens: number,
  concurrentRequests: number,
  options: { averageUtilization?: number; kvPrecision?: KvPrecision } = {}
): GpuRecommendation[] {
  const averageUtilization = options.averageUtilization ?? 0.5
  const kvPrecision = options.kvPrecision ?? "FP16"

  const modelMemory = calculateModelWeightMemory(model, quantization, { includeOverhead: true })
  const computeMemory = calculateEffectiveComputeMemory(model, quantization, { includeOverhead: true })
  const kvPerRequest = calculateKvCachePerRequest(model, contextTokens, kvPrecision, averageUtilization)
  const kvPerRequestWorst = calculateKvCachePerRequest(model, contextTokens, kvPrecision, 1.0)
  const kvTotalTypicalGiB = kvPerRequest.typicalGiB * concurrentRequests
  const kvTotalWorstGiB = kvPerRequestWorst.worstCaseGiB * concurrentRequests

  const recommendations: GpuRecommendation[] = []

  for (const gpu of gpuPresets) {
    for (const gpuCount of GPU_COUNTS_TO_TRY) {
      const typical = calculateVramAllocation(gpu, gpuCount, modelMemory.estimatedGiB, kvTotalTypicalGiB)
      const worstCase = calculateVramAllocation(gpu, gpuCount, modelMemory.estimatedGiB, kvTotalWorstGiB)
      const status = deriveFitStatus(typical, worstCase)

      const perf = calculatePerformanceEstimate(gpu, gpuCount, computeMemory.estimatedGiB, quantization, {
        maxTokens: contextTokens,
        averageUtilization,
      })

      const achievedConcurrency =
        kvPerRequest.typicalGiB > 0 ? Math.floor((typical.totalGiB - modelMemory.estimatedGiB - typical.overheadGiB) / kvPerRequest.typicalGiB) : 0

      recommendations.push({
        gpu,
        gpuCount,
        modelMemoryGiB: modelMemory.estimatedGiB,
        kvCachePerRequestGiB: kvPerRequest.typicalGiB,
        totalVramGiB: typical.totalGiB,
        freeGiB: typical.freeGiB,
        fits: typical.fits,
        status: status.status,
        estimatedTokPerSec: perf.estimatedTokensPerSecond,
        achievedConcurrency: Math.max(0, achievedConcurrency),
      })

      // Only consider multi-GPU counts for hardware with a fast interconnect;
      // otherwise PCIe-only cards are unrealistic to cluster for one model shard.
      if (gpuCount === 1 && gpu.interconnect !== "NVLink" && gpu.interconnect !== "Infinity Fabric") {
        break
      }
    }
  }

  recommendations.sort((a, b) => {
    const rank = { SAFE: 0, TIGHT: 1, NOT_FEASIBLE: 2 } as const
    if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status]
    if (a.gpuCount !== b.gpuCount) return a.gpuCount - b.gpuCount
    return a.freeGiB - b.freeGiB // least wasted headroom first, among equally-good statuses
  })

  return recommendations.slice(0, 8)
}
