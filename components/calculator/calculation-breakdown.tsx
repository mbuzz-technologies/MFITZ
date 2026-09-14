"use client"

import { CalculatorState, KvCachePrecisionBytes, QuantizationPresets } from "@/lib/types/calculator"
import { CalculatorResults } from "@/lib/calculations/engine"
import { formatGiB, formatNumber, formatParams } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"

function Formula({ formula, substituted, result }: { formula: string; substituted: string; result: string }) {
  return (
    <div className="space-y-1.5 rounded-md bg-secondary/40 p-3 font-mono text-xs">
      <div className="text-muted-foreground">{formula}</div>
      <div className="text-muted-foreground">{substituted}</div>
      <div className="font-semibold text-foreground">= {result}</div>
    </div>
  )
}

export function CalculationBreakdown({ state, results }: { state: CalculatorState; results: CalculatorResults }) {
  const q = QuantizationPresets[state.quantization]
  const kvBytes = KvCachePrecisionBytes[state.kvPrecision]
  const typicalTokens = Math.round(state.contextTokens * state.averageUtilization)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calculation breakdown</CardTitle>
        <CardDescription>Every formula this run used, with your configuration's actual numbers substituted in.</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="weights">
            <AccordionTrigger>Model weight memory</AccordionTrigger>
            <AccordionContent>
              <Formula
                formula="bytes = parameters × bits_per_param / 8 × overhead_factor"
                substituted={`${formatNumber(results.model.parameters, 0)} × ${q.bitsPerParameter} / 8 × ${q.overheadFactor}`}
                result={formatGiB(results.modelMemory.estimatedGiB, 2)}
              />
              {results.model.isMoE && (
                <p className="mt-2 text-xs text-muted-foreground">
                  MoE model — every expert's weights stay resident in VRAM, so this uses the TOTAL parameter count (
                  {formatParams(results.model.parameters)}), not the active count used below for compute.
                </p>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="compute-memory">
            <AccordionTrigger>Effective compute size (for performance estimate)</AccordionTrigger>
            <AccordionContent>
              <Formula
                formula={results.model.isMoE ? "bytes = active_parameters × bits_per_param / 8 × overhead_factor" : "= model weight memory (dense model)"}
                substituted={
                  results.model.isMoE
                    ? `${formatNumber(results.model.activeParameters ?? 0, 0)} × ${q.bitsPerParameter} / 8 × ${q.overheadFactor}`
                    : `${formatParams(results.model.parameters)} params at ${q.bitsPerParameter}-bit`
                }
                result={formatGiB(results.computeMemory.estimatedGiB, 2)}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="kv-cache">
            <AccordionTrigger>KV cache per request</AccordionTrigger>
            <AccordionContent>
              <Formula
                formula="bytes = 2 × layers × kv_heads × head_dim × tokens × bytes_per_element × (1 + overhead)"
                substituted={`2 × ${results.model.layers} × ${results.model.kvHeads} × ${results.model.headDimension} × ${formatNumber(typicalTokens, 0)} × ${kvBytes} × ${(1 + state.kvCacheOverheadPct).toFixed(2)}`}
                result={`${formatGiB(results.kvPerRequestTypical.typicalGiB, 3)} typical, ${formatGiB(results.kvPerRequestWorst.worstCaseGiB, 3)} worst case`}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="vram">
            <AccordionTrigger>VRAM allocation</AccordionTrigger>
            <AccordionContent>
              <Formula
                formula="total = gpu_vram × gpu_count; free = total − model − kv_total − overhead"
                substituted={`${results.gpu.vramGiB} × ${state.gpuCount} − ${formatGiB(results.modelMemory.estimatedGiB, 1)} − ${formatGiB(results.totalKvCache.totalTypicalGiB, 1)} − ${formatGiB(results.vramTypical.overheadGiB, 1)}`}
                result={formatGiB(results.vramTypical.freeGiB, 2)}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="concurrency">
            <AccordionTrigger>Concurrency</AccordionTrigger>
            <AccordionContent>
              <Formula
                formula="max = vram_for_kv / kv_per_request; recommended = max × (1 − safety_margin)"
                substituted={`${formatGiB(results.concurrency.vramAvailableGiB, 1)} / ${formatGiB(results.kvPerRequestTypical.typicalGiB, 3)}, margin ${(state.safetyMarginPct * 100).toFixed(0)}%`}
                result={`${results.concurrency.theoreticalMaximum} max, ${results.concurrency.recommendedSustainable} recommended`}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="throughput">
            <AccordionTrigger>Estimated throughput</AccordionTrigger>
            <AccordionContent>
              <Formula
                formula="tok/s ≈ (bandwidth × efficiency × quant_factor × context_factor × multi_gpu_factor) / effective_size_GiB"
                substituted={`(${results.gpu.memoryBandwidthGBs} × ${results.performance.efficiencyCoefficient} × ${results.performance.quantizationFactor} × ${results.performance.contextFactor} × ${results.performance.multiGpuFactor}) / ${formatGiB(results.performance.effectiveComputeGiB, 2)}`}
                result={`${results.performance.estimatedTokensPerSecond} tok/s (${results.performance.latencyPer100TokensSec}s per 100 tokens)`}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                A transparent heuristic, not a benchmark — see the Performance disclaimer in the docs.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="multi-gpu">
            <AccordionTrigger>Multi-GPU scaling</AccordionTrigger>
            <AccordionContent>
              <Formula
                formula="throughput_multiplier = gpu_count ^ exponent (exponent higher for fast interconnects)"
                substituted={`${state.gpuCount} ^ ${results.multiGpu.hasFastInterconnect ? "0.85 (fast interconnect)" : "0.6 (PCIe-only)"}`}
                result={`${results.multiGpu.throughputMultiplier}× throughput, ${(results.multiGpu.scalingEfficiency * 100).toFixed(0)}% scaling efficiency`}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
