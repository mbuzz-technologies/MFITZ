/**
 * Model database — representative LLM architectures.
 *
 * Parameter counts are actual counts (e.g. 7_000_000_000 for 7B), not bytes.
 * Layer/head metadata drives architecture-aware KV-cache estimation, so two
 * models with the same parameter count can still need very different amounts
 * of cache (grouped-query attention reduces KV heads well below attention
 * heads). MoE models additionally carry `activeParameters`, used for
 * compute/performance estimates while `parameters` (total) drives memory
 * residency.
 *
 * Keep this file the single place new models get added.
 */

import { ModelSpec, ModelDatabase } from "@/lib/types/calculator"

export const modelPresets: ModelSpec[] = [
  {
    id: "3b",
    name: "Llama 3.2 3B",
    parameters: 3_000_000_000,
    architecture: "Llama 3.2",
    layers: 28,
    attentionHeads: 24,
    kvHeads: 8,
    headDimension: 128,
  },
  {
    id: "7b",
    name: "Llama 2 7B",
    parameters: 7_000_000_000,
    architecture: "Llama 2",
    layers: 32,
    attentionHeads: 32,
    kvHeads: 32,
    headDimension: 128,
  },
  {
    id: "mistral-7b",
    name: "Mistral 7B v0.3",
    parameters: 7_300_000_000,
    architecture: "Mistral",
    layers: 32,
    attentionHeads: 32,
    kvHeads: 8,
    headDimension: 128,
  },
  {
    id: "8b",
    name: "Llama 3.1 8B",
    parameters: 8_000_000_000,
    architecture: "Llama 3.1",
    layers: 32,
    attentionHeads: 32,
    kvHeads: 8,
    headDimension: 128,
  },
  {
    id: "13b",
    name: "Llama 2 13B",
    parameters: 13_000_000_000,
    architecture: "Llama 2",
    layers: 40,
    attentionHeads: 40,
    kvHeads: 40,
    headDimension: 128,
  },
  {
    id: "qwen2.5-32b",
    name: "Qwen2.5 32B",
    parameters: 32_500_000_000,
    architecture: "Qwen2.5",
    layers: 64,
    attentionHeads: 40,
    kvHeads: 8,
    headDimension: 128,
  },
  {
    id: "34b",
    name: "CodeLlama 34B",
    parameters: 34_000_000_000,
    architecture: "Llama 2",
    layers: 48,
    attentionHeads: 64,
    kvHeads: 8,
    headDimension: 128,
  },
  {
    id: "mixtral-8x7b",
    name: "Mixtral 8x7B",
    parameters: 46_700_000_000,
    architecture: "Mixtral (MoE)",
    layers: 32,
    attentionHeads: 32,
    kvHeads: 8,
    headDimension: 128,
    isMoE: true,
    activeParameters: 12_900_000_000,
    experts: 8,
    expertsPerToken: 2,
  },
  {
    id: "70b",
    name: "Llama 3.1 70B",
    parameters: 70_000_000_000,
    architecture: "Llama 3.1",
    layers: 80,
    attentionHeads: 64,
    kvHeads: 8,
    headDimension: 128,
  },
  {
    id: "mixtral-8x22b",
    name: "Mixtral 8x22B",
    parameters: 141_000_000_000,
    architecture: "Mixtral (MoE)",
    layers: 56,
    attentionHeads: 48,
    kvHeads: 8,
    headDimension: 128,
    isMoE: true,
    activeParameters: 39_000_000_000,
    experts: 8,
    expertsPerToken: 2,
  },
  {
    id: "405b",
    name: "Llama 3.1 405B",
    parameters: 405_000_000_000,
    architecture: "Llama 3.1",
    layers: 126,
    attentionHeads: 128,
    kvHeads: 8,
    headDimension: 128,
    notes: "Requires multi-GPU (typically 4x+ 80GB-class GPUs) even at 4-bit quantization.",
  },
]

export const modelDatabase: ModelDatabase = Object.fromEntries(modelPresets.map((m) => [m.id, m]))
