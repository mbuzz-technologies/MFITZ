import { describe, it, expect } from "vitest"
import { generatePerformanceSummary, calculatePerformanceEstimate } from "./performance"
import { ModelSpec, GpuSpec } from "@/lib/types/calculator"

const gpu: GpuSpec = {
  id: "test-gpu",
  manufacturer: "NVIDIA",
  name: "Test GPU",
  architecture: "Test",
  vramGiB: 80,
  memoryBandwidthGBs: 2000,
  interconnect: "NVLink",
}

const denseModel: ModelSpec = {
  id: "dense-46b",
  name: "Dense 46.7B",
  parameters: 46_700_000_000,
  architecture: "Test",
  layers: 32,
  attentionHeads: 32,
  kvHeads: 8,
  headDimension: 128,
}

const moeModel: ModelSpec = {
  ...denseModel,
  id: "moe-46b",
  name: "MoE 46.7B (12.9B active)",
  isMoE: true,
  activeParameters: 12_900_000_000,
}

const context = { maxTokens: 4096, averageUtilization: 0.5 }

describe("generatePerformanceSummary", () => {
  it("estimates higher throughput for a MoE model than a same-sized dense model", () => {
    const dense = generatePerformanceSummary(gpu, 1, denseModel, "FP16", context)
    const moe = generatePerformanceSummary(gpu, 1, moeModel, "FP16", context)
    expect(moe.estimatedTokensPerSecond).toBeGreaterThan(dense.estimatedTokensPerSecond)
    expect(moe.effectiveComputeGiB).toBeLessThan(dense.effectiveComputeGiB)
  })

  it("estimates higher throughput for more aggressive quantization", () => {
    const fp16 = generatePerformanceSummary(gpu, 1, denseModel, "FP16", context)
    const int4 = generatePerformanceSummary(gpu, 1, denseModel, "INT4", context)
    expect(int4.estimatedTokensPerSecond).toBeGreaterThan(fp16.estimatedTokensPerSecond)
  })

  it("estimates lower throughput for longer context lengths", () => {
    const short = generatePerformanceSummary(gpu, 1, denseModel, "FP16", { maxTokens: 1024, averageUtilization: 1 })
    const long = generatePerformanceSummary(gpu, 1, denseModel, "FP16", { maxTokens: 65536, averageUtilization: 1 })
    expect(long.estimatedTokensPerSecond).toBeLessThan(short.estimatedTokensPerSecond)
  })

  it("computes latency-per-100-tokens as the inverse of throughput", () => {
    const result = generatePerformanceSummary(gpu, 1, denseModel, "FP16", context)
    expect(result.latencyPer100TokensSec).toBeCloseTo(100 / result.estimatedTokensPerSecond, 1)
  })

  it("never returns zero or negative throughput even for a huge model", () => {
    const hugeModel: ModelSpec = { ...denseModel, parameters: 2_000_000_000_000 }
    const result = generatePerformanceSummary(gpu, 1, hugeModel, "FP32", context)
    expect(result.estimatedTokensPerSecond).toBeGreaterThan(0)
  })
})

describe("calculatePerformanceEstimate multi-GPU behavior", () => {
  it("more GPUs increases throughput sub-linearly", () => {
    const one = calculatePerformanceEstimate(gpu, 1, 90, "FP16", context)
    const four = calculatePerformanceEstimate(gpu, 4, 90, "FP16", context)
    expect(four.estimatedTokensPerSecond).toBeGreaterThan(one.estimatedTokensPerSecond)
    expect(four.multiGpuFactor).toBeLessThan(4)
  })
})
