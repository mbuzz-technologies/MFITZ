import { describe, it, expect } from "vitest"
import { calculateKvCachePerRequest, calculateTotalKvCache } from "./kv-cache"
import { ModelSpec } from "@/lib/types/calculator"

const model: ModelSpec = {
  id: "test",
  name: "Test",
  parameters: 7_000_000_000,
  architecture: "Test",
  layers: 32,
  attentionHeads: 32,
  kvHeads: 8,
  headDimension: 128,
}

describe("calculateKvCachePerRequest", () => {
  it("matches the architecture-aware formula: 2 x layers x kvHeads x headDim x tokens x bytes", () => {
    const tokens = 4096
    const result = calculateKvCachePerRequest(model, tokens, "FP16", 1.0, 0)
    const expectedBytes = 2 * model.layers * model.kvHeads * model.headDimension * tokens * 2
    expect(result.worstCaseBytes).toBeCloseTo(expectedBytes, 6)
  })

  it("halves cache size going from FP16 to INT8 and again to INT4", () => {
    const fp16 = calculateKvCachePerRequest(model, 4096, "FP16", 1.0, 0)
    const int8 = calculateKvCachePerRequest(model, 4096, "INT8", 1.0, 0)
    const int4 = calculateKvCachePerRequest(model, 4096, "INT4", 1.0, 0)
    expect(int8.worstCaseBytes).toBeCloseTo(fp16.worstCaseBytes / 2, 6)
    expect(int4.worstCaseBytes).toBeCloseTo(fp16.worstCaseBytes / 4, 6)
  })

  it("scales typical usage by averageUtilization, worst case ignores it", () => {
    const result = calculateKvCachePerRequest(model, 8000, "FP16", 0.5, 0)
    const fullContext = calculateKvCachePerRequest(model, 8000, "FP16", 1.0, 0)
    expect(result.typicalGiB).toBeCloseTo(fullContext.typicalGiB / 2, 3)
    expect(result.worstCaseGiB).toBeCloseTo(fullContext.worstCaseGiB, 6)
  })

  it("applies KV-cache overhead on top of the raw calculation", () => {
    const withOverhead = calculateKvCachePerRequest(model, 4096, "FP16", 1.0, 0.1)
    const without = calculateKvCachePerRequest(model, 4096, "FP16", 1.0, 0)
    expect(withOverhead.worstCaseBytes).toBeCloseTo(without.worstCaseBytes * 1.1, 6)
  })

  it("gives models with fewer KV heads (GQA) a smaller cache than full multi-head attention", () => {
    const gqaModel: ModelSpec = { ...model, kvHeads: 8 }
    const mhaModel: ModelSpec = { ...model, kvHeads: 32 }
    const gqa = calculateKvCachePerRequest(gqaModel, 4096, "FP16", 1.0, 0)
    const mha = calculateKvCachePerRequest(mhaModel, 4096, "FP16", 1.0, 0)
    expect(gqa.worstCaseBytes).toBeLessThan(mha.worstCaseBytes)
  })
})

describe("calculateTotalKvCache", () => {
  it("multiplies per-request cache by concurrent requests", () => {
    const perRequest = calculateKvCachePerRequest(model, 4096, "FP16", 1.0, 0)
    const total = calculateTotalKvCache(perRequest, 10)
    expect(total.totalTypicalGiB).toBeCloseTo(perRequest.typicalGiB * 10, 6)
    expect(total.totalWorstCaseGiB).toBeCloseTo(perRequest.worstCaseGiB * 10, 6)
  })
})
