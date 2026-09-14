/**
 * Performance (throughput/latency) estimation.
 *
 * This is a transparent heuristic, not a benchmark: for memory-bandwidth-bound
 * autoregressive decoding, throughput roughly scales with
 * (memory bandwidth) / (effective model size), adjusted by a handful of
 * documented, configurable factors. Treat outputs as ballpark estimates —
 * real numbers depend on the inference framework, CUDA/kernel
 * implementation, batching strategy, and GPU topology.
 *
 * MoE models use ACTIVE parameters (not total) for the effective model size,
 * since only the routed experts do compute work on a given token — see
 * calculateEffectiveComputeMemory in memory.ts.
 */

import {
  GpuSpec,
  ModelSpec,
  QuantizationFormat,
  QuantizationPresets,
  ContextConfig,
  PerformanceResult,
} from "@/lib/types/calculator"
import { calculateEffectiveComputeMemory } from "./memory"
import { calculateMultiGpuScaling } from "./multi-gpu"

/** Fraction of peak memory bandwidth sustainable in practice for single-GPU inference. */
export const DEFAULT_EFFICIENCY_COEFFICIENT = 0.45
/** Efficiency drops on multi-GPU setups due to interconnect/communication overhead. */
const MULTI_GPU_EFFICIENCY_COEFFICIENT = 0.32

export function calculatePerformanceEstimate(
  gpu: GpuSpec,
  gpuCount: number,
  effectiveComputeGiB: number,
  quantization: QuantizationFormat,
  contextConfig: ContextConfig
): PerformanceResult {
  const efficiencyCoefficient = gpuCount > 1 ? MULTI_GPU_EFFICIENCY_COEFFICIENT : DEFAULT_EFFICIENCY_COEFFICIENT
  const quantizationFactor = QuantizationPresets[quantization].performanceModifier

  // Longer contexts slow generation down (more attention work per decode step).
  const contextFactor = Math.max(0.1, 1 / Math.sqrt(Math.max(1, contextConfig.maxTokens) / 1024))

  const scaling = calculateMultiGpuScaling(gpu, gpuCount)
  const multiGpuFactor = scaling.throughputMultiplier

  const effectiveModelGiB = Math.max(0.01, effectiveComputeGiB)

  const rawEstimate =
    (gpu.memoryBandwidthGBs * efficiencyCoefficient * quantizationFactor * contextFactor * multiGpuFactor) /
    effectiveModelGiB

  const estimatedTokensPerSecond = Math.max(0.1, Math.round(rawEstimate * 10) / 10)
  const latencyPer100TokensSec = Math.round((100 / estimatedTokensPerSecond) * 10) / 10

  return {
    estimatedTokensPerSecond,
    contextFactor: Math.round(contextFactor * 100) / 100,
    multiGpuFactor: Math.round(multiGpuFactor * 100) / 100,
    efficiencyCoefficient,
    quantizationFactor,
    latencyPer100TokensSec,
    effectiveComputeGiB: effectiveModelGiB,
  }
}

export function generatePerformanceSummary(
  gpu: GpuSpec,
  gpuCount: number,
  model: ModelSpec,
  quantization: QuantizationFormat,
  contextConfig: ContextConfig
): PerformanceResult {
  const computeMemory = calculateEffectiveComputeMemory(model, quantization, { includeOverhead: true })
  return calculatePerformanceEstimate(gpu, gpuCount, computeMemory.estimatedGiB, quantization, contextConfig)
}
