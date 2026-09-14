/**
 * Resolve a GPU/model id (catalog entry or "custom") into a concrete spec
 * object the calculation engine can consume. Deliberately dependency-free
 * w.r.t. the calculation modules, so both lib/presets.ts and
 * lib/calculations/engine.ts can import it without a cycle.
 */

import { GpuSpec, ModelSpec, CustomGpuInput, CustomModelInput, GPU_CUSTOM_ID, MODEL_CUSTOM_ID } from "@/lib/types/calculator"
import { gpuDatabase } from "@/lib/data/gpus"
import { modelDatabase } from "@/lib/data/models"

export const defaultCustomGpu: CustomGpuInput = {
  name: "Custom GPU",
  vramGiB: 24,
  memoryBandwidthGBs: 900,
}

export const defaultCustomModel: CustomModelInput = {
  name: "Custom model",
  parameters: 7_000_000_000,
  layers: 32,
  attentionHeads: 32,
  kvHeads: 8,
  headDimension: 128,
  isMoE: false,
  activeParameters: 7_000_000_000,
}

export function resolveGpu(gpuId: string, customGpu: CustomGpuInput): GpuSpec {
  if (gpuId === GPU_CUSTOM_ID) {
    return {
      id: GPU_CUSTOM_ID,
      manufacturer: "Custom",
      name: customGpu.name || "Custom GPU",
      architecture: "User-defined",
      vramGiB: customGpu.vramGiB,
      memoryBandwidthGBs: customGpu.memoryBandwidthGBs,
      isCustom: true,
    }
  }
  return gpuDatabase[gpuId] ?? gpuDatabase["rtx_4090"]
}

export function resolveModel(modelId: string, customModel: CustomModelInput): ModelSpec {
  if (modelId === MODEL_CUSTOM_ID) {
    return {
      id: MODEL_CUSTOM_ID,
      name: customModel.name || "Custom model",
      parameters: customModel.parameters,
      architecture: "User-defined",
      layers: customModel.layers,
      attentionHeads: customModel.attentionHeads,
      kvHeads: customModel.kvHeads,
      headDimension: customModel.headDimension,
      isMoE: customModel.isMoE,
      activeParameters: customModel.isMoE ? customModel.activeParameters : undefined,
      isCustom: true,
    }
  }
  return modelDatabase[modelId] ?? modelDatabase["7b"]
}
