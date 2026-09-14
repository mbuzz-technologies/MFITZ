import { describe, it, expect } from "vitest"
import { computeCalculatorResults } from "./engine"
import { CalculatorState } from "@/lib/types/calculator"
import { defaultCustomGpu, defaultCustomModel } from "@/lib/resolve"

function baseState(overrides: Partial<CalculatorState> = {}): CalculatorState {
  return {
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
    ...overrides,
  }
}

describe("computeCalculatorResults", () => {
  it("reports SAFE for a 7B INT4 model on a 24GB GPU", () => {
    const result = computeCalculatorResults(baseState())
    expect(result.fitStatus.status).toBe("SAFE")
    expect(result.vramTypical.fits).toBe(true)
  })

  it("reports NOT_FEASIBLE for a 405B model on a single 24GB GPU", () => {
    const result = computeCalculatorResults(baseState({ model: "405b", quantization: "FP16", gpuCount: 1 }))
    expect(result.fitStatus.status).toBe("NOT_FEASIBLE")
    expect(result.vramTypical.fits).toBe(false)
  })

  it("resolves a custom GPU and custom model end to end", () => {
    const result = computeCalculatorResults(
      baseState({
        gpu: "custom",
        customGpu: { name: "My Rig", vramGiB: 48, memoryBandwidthGBs: 1200 },
        model: "custom",
        customModel: {
          name: "My Model",
          parameters: 10_000_000_000,
          layers: 40,
          attentionHeads: 32,
          kvHeads: 8,
          headDimension: 128,
          isMoE: false,
          activeParameters: 10_000_000_000,
        },
      })
    )
    expect(result.gpu.name).toBe("My Rig")
    expect(result.model.name).toBe("My Model")
    expect(result.vramTypical.totalGiB).toBe(48)
  })

  it("resolves a custom MoE model using active parameters for the performance estimate", () => {
    const result = computeCalculatorResults(
      baseState({
        model: "custom",
        customModel: {
          name: "My MoE",
          parameters: 40_000_000_000,
          layers: 32,
          attentionHeads: 32,
          kvHeads: 8,
          headDimension: 128,
          isMoE: true,
          activeParameters: 10_000_000_000,
        },
      })
    )
    expect(result.computeMemory.parametersUsed).toBe(10_000_000_000)
    expect(result.modelMemory.parametersUsed).toBe(40_000_000_000)
  })

  it("increases aggregate VRAM and sub-linearly increases throughput with more GPUs", () => {
    const one = computeCalculatorResults(baseState({ gpu: "h100_80gb", gpuCount: 1 }))
    const four = computeCalculatorResults(baseState({ gpu: "h100_80gb", gpuCount: 4 }))
    expect(four.vramTypical.totalGiB).toBe(one.vramTypical.totalGiB * 4)
    expect(four.performance.estimatedTokensPerSecond).toBeGreaterThan(one.performance.estimatedTokensPerSecond)
    expect(four.multiGpu.throughputMultiplier).toBeLessThan(4)
  })
})
