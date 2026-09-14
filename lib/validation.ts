/**
 * Zod schemas for anything that crosses a trust boundary: URL query state,
 * localStorage, and user-entered custom GPU/model forms. Keeping these
 * separate from the plain TypeScript types in lib/types means malformed
 * input (a hand-edited URL, corrupted localStorage) degrades gracefully
 * instead of crashing the app.
 */

import { z } from "zod"
import { QUANTIZATION_FORMATS, KV_PRECISIONS } from "@/lib/types/calculator"

const quantizationEnum = z.enum(QUANTIZATION_FORMATS as [string, ...string[]])
const kvPrecisionEnum = z.enum(KV_PRECISIONS as [string, ...string[]])

export const customGpuSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  vramGiB: z.coerce.number().positive("Must be greater than 0").max(4096),
  memoryBandwidthGBs: z.coerce.number().positive("Must be greater than 0").max(50_000),
})
export type CustomGpuFormValues = z.infer<typeof customGpuSchema>

export const customModelSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(80),
    parameters: z.coerce.number().positive("Must be greater than 0"),
    layers: z.coerce.number().int().positive().max(4000),
    attentionHeads: z.coerce.number().int().positive().max(4000),
    kvHeads: z.coerce.number().int().positive().max(4000),
    headDimension: z.coerce.number().int().positive().max(4000),
    isMoE: z.boolean(),
    activeParameters: z.coerce.number().nonnegative(),
  })
  .refine((v) => v.kvHeads <= v.attentionHeads, {
    message: "KV heads cannot exceed attention heads",
    path: ["kvHeads"],
  })
  .refine((v) => !v.isMoE || v.activeParameters > 0, {
    message: "Active parameters must be greater than 0 for MoE models",
    path: ["activeParameters"],
  })
  .refine((v) => !v.isMoE || v.activeParameters <= v.parameters, {
    message: "Active parameters cannot exceed total parameters",
    path: ["activeParameters"],
  })
export type CustomModelFormValues = z.infer<typeof customModelSchema>

export const calculatorStateSchema = z.object({
  mode: z.enum(["simple", "advanced"]),
  gpu: z.string().min(1),
  customGpu: customGpuSchema,
  gpuCount: z.coerce.number().int().min(1).max(128),
  model: z.string().min(1),
  customModel: customModelSchema,
  quantization: quantizationEnum,
  contextTokens: z.coerce.number().int().min(1).max(2_097_152),
  averageUtilization: z.coerce.number().min(0.01).max(1),
  kvPrecision: kvPrecisionEnum,
  kvCacheOverheadPct: z.coerce.number().min(0).max(1),
  concurrentRequests: z.coerce.number().int().min(1).max(8192),
  systemOverheadPct: z.coerce.number().min(0).max(0.9),
  safetyMarginPct: z.coerce.number().min(0).max(0.95),
})
export type CalculatorStateInput = z.infer<typeof calculatorStateSchema>

export const savedConfigurationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  savedAt: z.string(),
  state: calculatorStateSchema,
})
