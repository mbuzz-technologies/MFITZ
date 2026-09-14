/**
 * GPU database — representative hardware specifications.
 *
 * VRAM in GiB (binary). Memory bandwidth in GB/s (decimal, as published by
 * vendors). Values are drawn from public vendor spec sheets; verify against
 * the vendor before using this for a purchasing decision — see /docs.
 *
 * Keep this file the single place new hardware gets added: push a new
 * `GpuSpec` entry into `gpuPresets` and it becomes selectable everywhere.
 */

import { GpuSpec, GpuDatabase } from "@/lib/types/calculator"

export const gpuPresets: GpuSpec[] = [
  // NVIDIA consumer
  {
    id: "rtx_3060_12gb",
    manufacturer: "NVIDIA",
    name: "RTX 3060 12GB",
    architecture: "Ampere",
    vramGiB: 12,
    memoryBandwidthGBs: 360,
    interconnect: "PCIe 4.0",
  },
  {
    id: "rtx_3090",
    manufacturer: "NVIDIA",
    name: "RTX 3090",
    architecture: "Ampere",
    vramGiB: 24,
    memoryBandwidthGBs: 936,
    interconnect: "PCIe 4.0",
  },
  {
    id: "rtx_4090",
    manufacturer: "NVIDIA",
    name: "RTX 4090",
    architecture: "Ada Lovelace",
    vramGiB: 24,
    memoryBandwidthGBs: 1008,
    interconnect: "PCIe 4.0",
  },
  {
    id: "rtx_5090",
    manufacturer: "NVIDIA",
    name: "RTX 5090",
    architecture: "Blackwell",
    vramGiB: 32,
    memoryBandwidthGBs: 1792,
    interconnect: "PCIe 5.0",
  },
  // NVIDIA data center
  {
    id: "l4",
    manufacturer: "NVIDIA",
    name: "L4",
    architecture: "Ada Lovelace",
    vramGiB: 24,
    memoryBandwidthGBs: 300,
    interconnect: "PCIe 4.0",
  },
  {
    id: "l40s",
    manufacturer: "NVIDIA",
    name: "L40S",
    architecture: "Ada Lovelace",
    vramGiB: 48,
    memoryBandwidthGBs: 864,
    interconnect: "PCIe 4.0",
  },
  {
    id: "a10",
    manufacturer: "NVIDIA",
    name: "A10",
    architecture: "Ampere",
    vramGiB: 24,
    memoryBandwidthGBs: 600,
    interconnect: "PCIe 4.0",
  },
  {
    id: "a100_40gb",
    manufacturer: "NVIDIA",
    name: "A100 40GB SXM",
    architecture: "Ampere",
    vramGiB: 40,
    memoryBandwidthGBs: 1555,
    interconnect: "NVLink",
  },
  {
    id: "a100_80gb",
    manufacturer: "NVIDIA",
    name: "A100 80GB SXM",
    architecture: "Ampere",
    vramGiB: 80,
    memoryBandwidthGBs: 2039,
    interconnect: "NVLink",
  },
  {
    id: "h100_80gb",
    manufacturer: "NVIDIA",
    name: "H100 80GB SXM",
    architecture: "Hopper",
    vramGiB: 80,
    memoryBandwidthGBs: 3350,
    interconnect: "NVLink",
  },
  {
    id: "h100_nvl",
    manufacturer: "NVIDIA",
    name: "H100 NVL",
    architecture: "Hopper",
    vramGiB: 94,
    memoryBandwidthGBs: 3900,
    interconnect: "NVLink",
  },
  {
    id: "h200",
    manufacturer: "NVIDIA",
    name: "H200 SXM",
    architecture: "Hopper",
    vramGiB: 141,
    memoryBandwidthGBs: 4800,
    interconnect: "NVLink",
  },
  // AMD
  {
    id: "rx_7900_xt",
    manufacturer: "AMD",
    name: "Radeon RX 7900 XT",
    architecture: "RDNA 3",
    vramGiB: 20,
    memoryBandwidthGBs: 800,
    interconnect: "PCIe 4.0",
  },
  {
    id: "mi300x",
    manufacturer: "AMD",
    name: "Instinct MI300X",
    architecture: "CDNA 3",
    vramGiB: 192,
    memoryBandwidthGBs: 5300,
    interconnect: "Infinity Fabric",
  },
  // Apple Silicon (unified memory shared with the system)
  {
    id: "m1_max",
    manufacturer: "Apple",
    name: "M1 Max (32-core GPU)",
    architecture: "Apple M1",
    vramGiB: 32,
    memoryBandwidthGBs: 400,
    interconnect: "Unified Memory",
  },
  {
    id: "m3_max",
    manufacturer: "Apple",
    name: "M3 Max (40-core GPU)",
    architecture: "Apple M3",
    vramGiB: 64,
    memoryBandwidthGBs: 400,
    interconnect: "Unified Memory",
  },
]

export const gpuDatabase: GpuDatabase = Object.fromEntries(gpuPresets.map((g) => [g.id, g]))
