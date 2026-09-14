import { describe, it, expect } from "vitest"
import { deriveFitStatus } from "./status"
import { VramAllocationResult } from "@/lib/types/calculator"

function alloc(overrides: Partial<VramAllocationResult>): VramAllocationResult {
  return {
    totalGiB: 24,
    modelGiB: 4,
    kvCacheGiB: 1,
    overheadGiB: 2,
    freeGiB: 17,
    percentageUsed: 29,
    percentageFree: 71,
    fits: true,
    ...overrides,
  }
}

describe("deriveFitStatus", () => {
  it("returns NOT_FEASIBLE when even the typical allocation does not fit", () => {
    const typical = alloc({ fits: false, freeGiB: -3 })
    const worst = alloc({ fits: false, freeGiB: -6 })
    expect(deriveFitStatus(typical, worst).status).toBe("NOT_FEASIBLE")
  })

  it("returns TIGHT when typical fits but worst-case full-context does not", () => {
    const typical = alloc({ fits: true, freeGiB: 5, percentageFree: 20 })
    const worst = alloc({ fits: false, freeGiB: -2 })
    expect(deriveFitStatus(typical, worst).status).toBe("TIGHT")
  })

  it("returns TIGHT when both fit but headroom is thin", () => {
    const typical = alloc({ fits: true, freeGiB: 1, percentageFree: 4 })
    const worst = alloc({ fits: true, freeGiB: 0.5 })
    expect(deriveFitStatus(typical, worst).status).toBe("TIGHT")
  })

  it("returns SAFE when both typical and worst case fit with healthy headroom", () => {
    const typical = alloc({ fits: true, freeGiB: 17, percentageFree: 71 })
    const worst = alloc({ fits: true, freeGiB: 10, percentageFree: 40 })
    expect(deriveFitStatus(typical, worst).status).toBe("SAFE")
  })
})
