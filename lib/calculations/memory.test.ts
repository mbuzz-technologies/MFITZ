import { describe, it, expect } from "vitest"
import { calculateModelWeightMemory, calculateEffectiveComputeMemory, calculateVramAllocation, BYTES_PER_GIB } from "./memory"
import { ModelSpec, GpuSpec } from "@/lib/types/calculator"

const denseModel: ModelSpec = {
  id: "test-7b",
  name: "Test 7B",
  parameters: 7_000_000_000,
  architecture: "Test",
  layers: 32,
  attentionHeads: 32,
  kvHeads: 8,
  headDimension: 128,
}

const moeModel: ModelSpec = {
  id: "test-moe",
  name: "Test MoE",
  parameters: 46_700_000_000,
  architecture: "Test MoE",
  layers: 32,
  attentionHeads: 32,
  kvHeads: 8,
  headDimension: 128,
  isMoE: true,
  activeParameters: 12_900_000_000,
  experts: 8,
  expertsPerToken: 2,
}

const gpu: GpuSpec = {
  id: "test-gpu",
  manufacturer: "NVIDIA",
  name: "Test GPU",
  architecture: "Test",
  vramGiB: 24,
  memoryBandwidthGBs: 1000,
}

describe("calculateModelWeightMemory", () => {
  it("computes FP16 theoretical memory as 2 bytes/param", () => {
    const result = calculateModelWeightMemory(denseModel, "FP16", { includeOverhead: false })
    expect(result.theoreticalBytes).toBe(denseModel.parameters * 2)
    expect(result.theoreticalGiB).toBeCloseTo((denseModel.parameters * 2) / BYTES_PER_GIB, 6)
  })

  it("applies the quantization overhead factor when requested", () => {
    const withOverhead = calculateModelWeightMemory(denseModel, "INT4", { includeOverhead: true })
    const without = calculateModelWeightMemory(denseModel, "INT4", { includeOverhead: false })
    expect(withOverhead.estimatedBytes).toBeGreaterThan(without.estimatedBytes)
  })

  it("uses TOTAL parameters for MoE weight residency, not active parameters", () => {
    const result = calculateModelWeightMemory(moeModel, "FP16", { includeOverhead: false })
    expect(result.parametersUsed).toBe(moeModel.parameters)
    expect(result.parametersUsed).not.toBe(moeModel.activeParameters)
  })

  it("halves memory going from FP16 to INT8, and again to INT4 (bits/param ratio)", () => {
    const fp16 = calculateModelWeightMemory(denseModel, "FP16", { includeOverhead: false })
    const int8 = calculateModelWeightMemory(denseModel, "INT8", { includeOverhead: false })
    const int4 = calculateModelWeightMemory(denseModel, "INT4", { includeOverhead: false })
    expect(int8.theoreticalBytes).toBeCloseTo(fp16.theoreticalBytes / 2, 6)
    expect(int4.theoreticalBytes).toBeCloseTo(fp16.theoreticalBytes / 4, 6)
  })
})

describe("calculateEffectiveComputeMemory", () => {
  it("matches weight memory for dense models", () => {
    const weight = calculateModelWeightMemory(denseModel, "FP16")
    const compute = calculateEffectiveComputeMemory(denseModel, "FP16")
    expect(compute.estimatedGiB).toBeCloseTo(weight.estimatedGiB, 6)
  })

  it("uses ACTIVE parameters for MoE compute estimates, smaller than weight memory", () => {
    const weight = calculateModelWeightMemory(moeModel, "FP16")
    const compute = calculateEffectiveComputeMemory(moeModel, "FP16")
    expect(compute.parametersUsed).toBe(moeModel.activeParameters)
    expect(compute.estimatedGiB).toBeLessThan(weight.estimatedGiB)
  })
})

describe("calculateVramAllocation", () => {
  it("fits when usage is below total VRAM", () => {
    const result = calculateVramAllocation(gpu, 1, 4, 1, 0.1)
    expect(result.totalGiB).toBe(24)
    expect(result.fits).toBe(true)
    expect(result.freeGiB).toBeCloseTo(24 - 4 - 1 - 2.4, 6)
  })

  it("does not fit when usage exceeds total VRAM", () => {
    const result = calculateVramAllocation(gpu, 1, 30, 5, 0.1)
    expect(result.fits).toBe(false)
    expect(result.freeGiB).toBeLessThan(0)
  })

  it("scales total VRAM linearly with gpuCount", () => {
    const result = calculateVramAllocation(gpu, 4, 4, 1, 0.1)
    expect(result.totalGiB).toBe(96)
  })
})
