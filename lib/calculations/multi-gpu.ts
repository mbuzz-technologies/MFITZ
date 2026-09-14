/**
 * Multi-GPU scaling calculations.
 *
 * Aggregate VRAM and bandwidth scale linearly with GPU count (each GPU
 * brings its own memory and its own memory controller). Achieved THROUGHPUT
 * scales sub-linearly, because tensor/pipeline parallelism introduces
 * cross-GPU communication that a single GPU never pays. We model that
 * communication penalty as a power-law: throughput ∝ gpuCount^exponent,
 * with a higher exponent (closer to linear) for GPUs connected by a fast
 * interconnect (NVLink/NVSwitch/Infinity Fabric) and a lower exponent for
 * PCIe-only setups where cross-GPU traffic competes with host traffic.
 *
 * This is a transparent heuristic, not a benchmark — real scaling depends
 * heavily on the inference framework's parallelism strategy.
 */

import { GpuSpec, MultiGpuScalingResult, FAST_INTERCONNECTS } from "@/lib/types/calculator"

const SCALING_EXPONENT_FAST_INTERCONNECT = 0.85
const SCALING_EXPONENT_SLOW_INTERCONNECT = 0.6

export function calculateMultiGpuScaling(gpu: GpuSpec, gpuCount: number): MultiGpuScalingResult {
  const count = Math.max(1, gpuCount)
  const hasFastInterconnect = !!gpu.interconnect && FAST_INTERCONNECTS.has(gpu.interconnect)
  const exponent = hasFastInterconnect ? SCALING_EXPONENT_FAST_INTERCONNECT : SCALING_EXPONENT_SLOW_INTERCONNECT

  const throughputMultiplier = count <= 1 ? 1 : Math.pow(count, exponent)
  const scalingEfficiency = count <= 1 ? 1 : throughputMultiplier / count

  return {
    gpuCount: count,
    aggregateVramGiB: gpu.vramGiB * count,
    aggregateBandwidthGBs: gpu.memoryBandwidthGBs * count,
    hasFastInterconnect,
    throughputMultiplier: Math.round(throughputMultiplier * 100) / 100,
    scalingEfficiency: Math.round(scalingEfficiency * 100) / 100,
  }
}
