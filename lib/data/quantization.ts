/**
 * Quantization presets live in lib/types/calculator.ts (single source of
 * truth). Re-exported here so `@/lib/data/quantization` remains a valid,
 * discoverable import path alongside the other data modules.
 */

export { QuantizationPresets } from "@/lib/types/calculator"
export type { QuantizationFormat, QuantizationPreset } from "@/lib/types/calculator"
