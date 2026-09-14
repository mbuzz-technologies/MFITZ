/**
 * Top-level composition: turn a CalculatorState into every derived result
 * the UI needs. This is the ONE place that wires the individual calculation
 * modules together in the right order — components and pages should call
 * `computeCalculatorResults` rather than re-deriving any of this themselves.
 */

import {
  CalculatorState,
  ModelMemoryResult,
  KvCachePerRequestResult,
  TotalKvCacheResult,
  VramAllocationResult,
  FitStatusResult,
  ConcurrencyResult,
  PerformanceResult,
  MultiGpuScalingResult,
  GpuSpec,
  ModelSpec,
} from "@/lib/types/calculator"
import { resolveGpu, resolveModel } from "@/lib/resolve"
import { calculateModelWeightMemory, calculateEffectiveComputeMemory, calculateVramAllocation } from "./memory"
import { calculateKvCachePerRequest } from "./kv-cache"
import { calculateConcurrency } from "./concurrency"
import { calculatePerformanceEstimate } from "./performance"
import { calculateMultiGpuScaling } from "./multi-gpu"
import { deriveFitStatus } from "./status"

export interface CalculatorResults {
  gpu: GpuSpec
  model: ModelSpec
  modelMemory: ModelMemoryResult
  computeMemory: ModelMemoryResult
  kvPerRequestTypical: KvCachePerRequestResult
  kvPerRequestWorst: KvCachePerRequestResult
  totalKvCache: TotalKvCacheResult
  vramTypical: VramAllocationResult
  vramWorstCase: VramAllocationResult
  fitStatus: FitStatusResult
  concurrency: ConcurrencyResult
  performance: PerformanceResult
  multiGpu: MultiGpuScalingResult
}

export function computeCalculatorResults(state: CalculatorState): CalculatorResults {
  const gpu = resolveGpu(state.gpu, state.customGpu)
  const model = resolveModel(state.model, state.customModel)

  const modelMemory = calculateModelWeightMemory(model, state.quantization, { includeOverhead: true })
  const computeMemory = calculateEffectiveComputeMemory(model, state.quantization, { includeOverhead: true })

  const kvPerRequestTypical = calculateKvCachePerRequest(
    model,
    state.contextTokens,
    state.kvPrecision,
    state.averageUtilization,
    state.kvCacheOverheadPct
  )
  const kvPerRequestWorst = calculateKvCachePerRequest(model, state.contextTokens, state.kvPrecision, 1.0, state.kvCacheOverheadPct)

  const totalTypicalGiB = kvPerRequestTypical.typicalGiB * state.concurrentRequests
  const totalWorstCaseGiB = kvPerRequestWorst.worstCaseGiB * state.concurrentRequests
  const totalKvCache: TotalKvCacheResult = { totalTypicalGiB, totalWorstCaseGiB }

  const vramTypical = calculateVramAllocation(gpu, state.gpuCount, modelMemory.estimatedGiB, totalTypicalGiB, state.systemOverheadPct)
  const vramWorstCase = calculateVramAllocation(gpu, state.gpuCount, modelMemory.estimatedGiB, totalWorstCaseGiB, state.systemOverheadPct)

  const fitStatus = deriveFitStatus(vramTypical, vramWorstCase)

  // Concurrency answers "how many requests could this configuration sustain",
  // so it looks at VRAM left after weights + overhead — not after the KV
  // budget we already assumed for `concurrentRequests`.
  const vramForKv = Math.max(0, vramTypical.totalGiB - modelMemory.estimatedGiB - vramTypical.overheadGiB)
  const concurrency = calculateConcurrency(vramForKv, kvPerRequestTypical.typicalGiB, state.safetyMarginPct)

  const performance = calculatePerformanceEstimate(gpu, state.gpuCount, computeMemory.estimatedGiB, state.quantization, {
    maxTokens: state.contextTokens,
    averageUtilization: state.averageUtilization,
  })

  const multiGpu = calculateMultiGpuScaling(gpu, state.gpuCount)

  return {
    gpu,
    model,
    modelMemory,
    computeMemory,
    kvPerRequestTypical,
    kvPerRequestWorst,
    totalKvCache,
    vramTypical,
    vramWorstCase,
    fitStatus,
    concurrency,
    performance,
    multiGpu,
  }
}
