import { describe, it, expect } from "vitest"
import { calculateMultiGpuScaling } from "./multi-gpu"
import { GpuSpec } from "@/lib/types/calculator"

const nvlinkGpu: GpuSpec = {
  id: "nvlink-gpu",
  manufacturer: "NVIDIA",
  name: "NVLink GPU",
  architecture: "Test",
  vramGiB: 80,
  memoryBandwidthGBs: 2000,
  interconnect: "NVLink",
}

const pcieGpu: GpuSpec = {
  id: "pcie-gpu",
  manufacturer: "NVIDIA",
  name: "PCIe GPU",
  architecture: "Test",
  vramGiB: 24,
  memoryBandwidthGBs: 1000,
  interconnect: "PCIe 4.0",
}

describe("calculateMultiGpuScaling", () => {
  it("scales aggregate VRAM and bandwidth linearly", () => {
    const result = calculateMultiGpuScaling(nvlinkGpu, 4)
    expect(result.aggregateVramGiB).toBe(320)
    expect(result.aggregateBandwidthGBs).toBe(8000)
  })

  it("returns a throughput multiplier of exactly 1 for a single GPU", () => {
    const result = calculateMultiGpuScaling(nvlinkGpu, 1)
    expect(result.throughputMultiplier).toBe(1)
    expect(result.scalingEfficiency).toBe(1)
  })

  it("scales sub-linearly beyond 1 GPU (multiplier less than gpuCount)", () => {
    const result = calculateMultiGpuScaling(nvlinkGpu, 4)
    expect(result.throughputMultiplier).toBeGreaterThan(1)
    expect(result.throughputMultiplier).toBeLessThan(4)
    expect(result.scalingEfficiency).toBeLessThan(1)
  })

  it("scales better with a fast interconnect than PCIe-only, at equal GPU count", () => {
    const fast = calculateMultiGpuScaling(nvlinkGpu, 4)
    const slow = calculateMultiGpuScaling(pcieGpu, 4)
    expect(fast.hasFastInterconnect).toBe(true)
    expect(slow.hasFastInterconnect).toBe(false)
    expect(fast.scalingEfficiency).toBeGreaterThan(slow.scalingEfficiency)
  })
})
