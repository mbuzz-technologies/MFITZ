/**
 * Model weight memory + VRAM allocation calculations.
 *
 * Model weight memory = parameters × bits per parameter / 8, then adjusted
 * by an implementation-overhead factor (scales, codebooks, metadata) to
 * estimate real-world memory rather than the theoretical minimum.
 *
 * MoE models keep ALL expert weights resident in VRAM regardless of how many
 * experts are active per token — so weight-memory calculations always use
 * total `parameters`. Compute/performance estimates use a separate function
 * that switches to `activeParameters` for MoE models, since only the routed
 * experts do work on a given token.
 */

import {
  ModelSpec,
  GpuSpec,
  QuantizationFormat,
  QuantizationPresets,
  ModelMemoryResult,
  VramAllocationResult,
} from "@/lib/types/calculator"

export const BYTES_PER_GIB = 1024 ** 3

/** Default system/framework overhead as a fraction of total GPU VRAM (CUDA context, runtime, fragmentation). */
export const DEFAULT_SYSTEM_OVERHEAD_PCT = 0.1

function memoryResultFor(parameters: number, quantization: QuantizationFormat, includeOverhead: boolean): ModelMemoryResult {
  const preset = QuantizationPresets[quantization]
  const theoreticalBytes = (parameters * preset.bitsPerParameter) / 8
  const estimatedBytes = includeOverhead ? theoreticalBytes * preset.overheadFactor : theoreticalBytes

  return {
    theoreticalBytes,
    theoreticalGiB: theoreticalBytes / BYTES_PER_GIB,
    estimatedBytes,
    estimatedGiB: estimatedBytes / BYTES_PER_GIB,
    bitsPerParameter: preset.bitsPerParameter,
    parametersUsed: parameters,
  }
}

/**
 * Weight-residency memory: always driven by TOTAL parameters, since every
 * expert's weights sit in VRAM whether or not they're active for a given
 * token.
 */
export function calculateModelWeightMemory(
  model: ModelSpec,
  quantization: QuantizationFormat,
  options: { includeOverhead: boolean } = { includeOverhead: true }
): ModelMemoryResult {
  return memoryResultFor(model.parameters, quantization, options.includeOverhead)
}

/**
 * Compute-effective memory: driven by ACTIVE parameters for MoE models
 * (only the routed experts do work per token) and total parameters for
 * dense models. Used exclusively as an input to throughput/latency
 * estimation — never for VRAM budgeting.
 */
export function calculateEffectiveComputeMemory(
  model: ModelSpec,
  quantization: QuantizationFormat,
  options: { includeOverhead: boolean } = { includeOverhead: true }
): ModelMemoryResult {
  const effectiveParams = model.isMoE ? model.activeParameters ?? model.parameters : model.parameters
  return memoryResultFor(effectiveParams, quantization, options.includeOverhead)
}

/**
 * Allocate a GPU's (or GPU cluster's) VRAM across model weights, KV cache,
 * and system/framework overhead, returning what's left over.
 */
export function calculateVramAllocation(
  gpu: GpuSpec,
  gpuCount: number,
  modelMemoryGiB: number,
  kvCacheTotalGiB: number,
  systemOverheadPct: number = DEFAULT_SYSTEM_OVERHEAD_PCT
): VramAllocationResult {
  const totalGiB = gpu.vramGiB * gpuCount
  const overheadGiB = totalGiB * systemOverheadPct
  const usedGiB = modelMemoryGiB + kvCacheTotalGiB + overheadGiB
  const freeGiB = totalGiB - usedGiB

  const percentageUsed = totalGiB > 0 ? (usedGiB / totalGiB) * 100 : 0
  const percentageFree = totalGiB > 0 ? (freeGiB / totalGiB) * 100 : 0

  return {
    totalGiB,
    modelGiB: modelMemoryGiB,
    kvCacheGiB: kvCacheTotalGiB,
    overheadGiB,
    freeGiB,
    percentageUsed: Math.round(percentageUsed * 10) / 10,
    percentageFree: Math.round(percentageFree * 10) / 10,
    fits: freeGiB >= 0,
  }
}
