/**
 * Core type definitions for Ballast.
 *
 * Single source of truth for GPU/model data shapes, quantization presets,
 * calculator state, and the results produced by the calculation engine.
 */

// ---------------------------------------------------------------------------
// GPU Types
// ---------------------------------------------------------------------------

export interface GpuSpec {
  id: string
  manufacturer: "NVIDIA" | "AMD" | "Apple" | "Custom"
  name: string
  architecture: string
  vramGiB: number
  memoryBandwidthGBs: number // GB/s, decimal
  interconnect?: string
  priceUSD?: number
  isCustom?: boolean
}

export type GpuDatabase = Record<string, GpuSpec>

/** Interconnects treated as "fast" for multi-GPU scaling purposes. */
export const FAST_INTERCONNECTS = new Set(["NVLink", "NVSwitch", "Infinity Fabric"])

// ---------------------------------------------------------------------------
// Model Types
// ---------------------------------------------------------------------------

export interface ModelSpec {
  id: string
  name: string
  /** Total parameter count, e.g. 7_000_000_000 for a 7B model. */
  parameters: number
  architecture: string
  layers: number
  attentionHeads: number
  /** Number of KV heads (equal to attentionHeads for plain multi-head attention, lower for GQA/MQA). */
  kvHeads: number
  headDimension: number
  isMoE?: boolean
  /** Active parameters per token (Mixture-of-Experts models only). */
  activeParameters?: number
  experts?: number
  expertsPerToken?: number
  isCustom?: boolean
  notes?: string
}

export type ModelDatabase = Record<string, ModelSpec>

// ---------------------------------------------------------------------------
// Quantization Types
// ---------------------------------------------------------------------------

export type QuantizationFormat = "FP32" | "FP16" | "BF16" | "INT8" | "INT4" | "INT3"

export interface QuantizationPreset {
  format: QuantizationFormat
  bitsPerParameter: number
  /** Multiplier applied to theoretical memory to estimate real-world memory (scales, codebooks, metadata). */
  overheadFactor: number
  expectedMemoryReduction: string
  /** Rough relative inference speed vs. FP32 (1.0 = same speed). Heuristic, not a benchmark. */
  performanceModifier: number
  description: string
}

export const QUANTIZATION_FORMATS: QuantizationFormat[] = ["FP32", "FP16", "BF16", "INT8", "INT4", "INT3"]

export const QuantizationPresets: Record<QuantizationFormat, QuantizationPreset> = {
  FP32: {
    format: "FP32",
    bitsPerParameter: 32,
    overheadFactor: 1.0,
    expectedMemoryReduction: "1x (baseline)",
    performanceModifier: 1.0,
    description: "Full 32-bit floating point. Rarely used for inference; mainly a training/reference baseline.",
  },
  FP16: {
    format: "FP16",
    bitsPerParameter: 16,
    overheadFactor: 1.0,
    expectedMemoryReduction: "2x",
    performanceModifier: 1.5,
    description: "16-bit floating point. Common default for GPU inference.",
  },
  BF16: {
    format: "BF16",
    bitsPerParameter: 16,
    overheadFactor: 1.0,
    expectedMemoryReduction: "2x",
    performanceModifier: 1.5,
    description: "Bfloat16 — same footprint as FP16, wider dynamic range, no perf difference modeled here.",
  },
  INT8: {
    format: "INT8",
    bitsPerParameter: 8,
    overheadFactor: 1.05,
    expectedMemoryReduction: "4x",
    performanceModifier: 2.0,
    description: "8-bit integer quantization (e.g. LLM.int8, GPTQ-8, AWQ-8).",
  },
  INT4: {
    format: "INT4",
    bitsPerParameter: 4,
    overheadFactor: 1.15,
    expectedMemoryReduction: "8x",
    performanceModifier: 3.0,
    description: "4-bit integer quantization (e.g. GPTQ, AWQ, GGUF Q4). Most common self-hosting choice.",
  },
  INT3: {
    format: "INT3",
    bitsPerParameter: 3,
    overheadFactor: 1.25,
    expectedMemoryReduction: "~8.5x",
    performanceModifier: 3.6,
    description: "3-bit integer quantization. Aggressive — noticeable quality loss on most model families.",
  },
}

// ---------------------------------------------------------------------------
// KV Cache Types
// ---------------------------------------------------------------------------

export type KvPrecision = "FP32" | "FP16" | "INT8" | "INT4"

export const KV_PRECISIONS: KvPrecision[] = ["FP32", "FP16", "INT8", "INT4"]

export const KvCachePrecisionBytes: Record<KvPrecision, number> = {
  FP32: 4,
  FP16: 2,
  INT8: 1,
  INT4: 0.5,
}

export interface ContextConfig {
  maxTokens: number
  /** Fraction of the max context typically used in real workloads, 0-1. */
  averageUtilization: number
}

// ---------------------------------------------------------------------------
// Calculation Result Types
// ---------------------------------------------------------------------------

export interface ModelMemoryResult {
  theoreticalBytes: number
  theoreticalGiB: number
  estimatedBytes: number
  estimatedGiB: number
  bitsPerParameter: number
  /** Parameter count actually used for this calculation (total, or active for MoE compute estimates). */
  parametersUsed: number
}

export interface KvCachePerRequestResult {
  worstCaseBytes: number
  worstCaseGiB: number
  typicalBytes: number
  typicalGiB: number
  bytesPerElement: number
  perTokenBytes: number
}

export interface TotalKvCacheResult {
  totalTypicalGiB: number
  totalWorstCaseGiB: number
}

export interface VramAllocationResult {
  totalGiB: number
  modelGiB: number
  kvCacheGiB: number
  overheadGiB: number
  freeGiB: number
  percentageUsed: number
  percentageFree: number
  fits: boolean
}

export type FitStatus = "SAFE" | "TIGHT" | "NOT_FEASIBLE"

export interface FitStatusResult {
  status: FitStatus
  headline: string
  detail: string
}

export interface ConcurrencyResult {
  theoreticalMaximum: number
  recommendedSustainable: number
  vramAvailableGiB: number
  kvCachePerRequestGiB: number
  safetyMarginPct: number
  warnings: string[]
}

export interface MultiGpuScalingResult {
  gpuCount: number
  aggregateVramGiB: number
  aggregateBandwidthGBs: number
  hasFastInterconnect: boolean
  /** Achieved throughput multiplier relative to 1 GPU (sub-linear beyond 1 GPU). */
  throughputMultiplier: number
  /** throughputMultiplier / gpuCount — how close to linear (1.0) scaling actually lands. */
  scalingEfficiency: number
}

export interface PerformanceResult {
  estimatedTokensPerSecond: number
  contextFactor: number
  multiGpuFactor: number
  efficiencyCoefficient: number
  quantizationFactor: number
  latencyPer100TokensSec: number
  effectiveComputeGiB: number
}

// ---------------------------------------------------------------------------
// Calculator State (also the shape encoded in the shareable URL)
// ---------------------------------------------------------------------------

export type CalculatorMode = "simple" | "advanced"

export interface CustomGpuInput {
  name: string
  vramGiB: number
  memoryBandwidthGBs: number
}

export interface CustomModelInput {
  name: string
  parameters: number
  layers: number
  attentionHeads: number
  kvHeads: number
  headDimension: number
  isMoE: boolean
  activeParameters: number
}

export const GPU_CUSTOM_ID = "custom"
export const MODEL_CUSTOM_ID = "custom"

export interface CalculatorState {
  mode: CalculatorMode
  gpu: string
  customGpu: CustomGpuInput
  gpuCount: number
  model: string
  customModel: CustomModelInput
  quantization: QuantizationFormat
  contextTokens: number
  averageUtilization: number
  kvPrecision: KvPrecision
  kvCacheOverheadPct: number
  concurrentRequests: number
  systemOverheadPct: number
  safetyMarginPct: number
}

// ---------------------------------------------------------------------------
// Recommendation / comparison types
// ---------------------------------------------------------------------------

export interface GpuRecommendation {
  gpu: GpuSpec
  gpuCount: number
  modelMemoryGiB: number
  kvCachePerRequestGiB: number
  totalVramGiB: number
  freeGiB: number
  fits: boolean
  status: FitStatus
  estimatedTokPerSec: number
  achievedConcurrency: number
  estimatedCostUSD?: number
}

// ---------------------------------------------------------------------------
// Saved configurations (localStorage)
// ---------------------------------------------------------------------------

export interface SavedConfiguration {
  id: string
  name: string
  savedAt: string // ISO timestamp
  state: CalculatorState
}
