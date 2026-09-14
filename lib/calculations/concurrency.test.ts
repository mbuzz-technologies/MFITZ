import { describe, it, expect } from "vitest"
import { calculateConcurrency } from "./concurrency"

describe("calculateConcurrency", () => {
  it("computes theoretical maximum as available / per-request", () => {
    const result = calculateConcurrency(20, 2, 0)
    expect(result.theoreticalMaximum).toBe(10)
  })

  it("applies the safety margin to reduce the recommended sustainable count", () => {
    const result = calculateConcurrency(20, 2, 0.2)
    expect(result.recommendedSustainable).toBeCloseTo(8, 5)
    expect(result.recommendedSustainable).toBeLessThan(result.theoreticalMaximum)
  })

  it("never returns negative concurrency when VRAM is already over budget", () => {
    const result = calculateConcurrency(-5, 2, 0.2)
    expect(result.theoreticalMaximum).toBe(0)
    expect(result.recommendedSustainable).toBe(0)
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it("warns when recommended sustainable concurrency drops below 1", () => {
    const result = calculateConcurrency(0.5, 2, 0.2)
    expect(result.recommendedSustainable).toBeLessThan(1)
    expect(result.warnings.some((w) => w.includes("concurrent request"))).toBe(true)
  })

  it("returns 0 when per-request cache is 0 to avoid division by zero", () => {
    const result = calculateConcurrency(20, 0, 0.2)
    expect(result.theoreticalMaximum).toBe(0)
    expect(result.recommendedSustainable).toBe(0)
  })
})
