"use client"

import { HardDrive, Database, Layers, Gauge, Users, Zap, Timer, Server } from "lucide-react"

import { CalculatorState } from "@/lib/types/calculator"
import { CalculatorResults } from "@/lib/calculations/engine"
import { formatGiB } from "@/lib/utils"
import { MetricCard } from "@/components/calculator/metric-card"
import { StatusBadge } from "@/components/calculator/status-badge"
import { VramAllocationChart } from "@/components/calculator/vram-allocation-chart"
import { ContextConcurrencyChart, ContextThroughputChart } from "@/components/calculator/context-sweep-charts"
import { CalculationBreakdown } from "@/components/calculator/calculation-breakdown"
import { WarningsPanel } from "@/components/calculator/warnings-panel"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export function ResultsDashboard({ state, results }: { state: CalculatorState; results: CalculatorResults }) {
  const { gpu, modelMemory, kvPerRequestTypical, kvPerRequestWorst, vramTypical, fitStatus, concurrency, performance, multiGpu } = results

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">
              {results.model.name} · {state.quantization} on {results.gpu.name} × {state.gpuCount}
            </CardTitle>
            <CardDescription>{fitStatus.detail}</CardDescription>
          </div>
          <StatusBadge status={fitStatus.status} />
        </CardHeader>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Total VRAM"
          value={formatGiB(vramTypical.totalGiB)}
          sub={`${gpu.name} × ${state.gpuCount}`}
          icon={<Server className="h-3.5 w-3.5" />}
          tooltip="Aggregate VRAM across every GPU in this configuration."
        />
        <MetricCard
          label="Model memory"
          value={formatGiB(modelMemory.estimatedGiB)}
          sub={`${formatGiB(modelMemory.theoreticalGiB)} theoretical`}
          icon={<HardDrive className="h-3.5 w-3.5" />}
          tooltip="Weight memory at the selected quantization, including implementation overhead (scales, codebooks, metadata)."
        />
        <MetricCard
          label="KV cache / request"
          value={formatGiB(kvPerRequestTypical.typicalGiB)}
          sub={`${formatGiB(kvPerRequestWorst.worstCaseGiB)} worst case`}
          icon={<Database className="h-3.5 w-3.5" />}
          tooltip="Per-request key/value cache at typical context utilization vs. a full context window."
        />
        <MetricCard
          label="Remaining VRAM"
          value={formatGiB(vramTypical.freeGiB)}
          sub={`${vramTypical.percentageFree.toFixed(1)}% free`}
          tone={vramTypical.fits ? "success" : "destructive"}
          icon={<Layers className="h-3.5 w-3.5" />}
          tooltip="VRAM left after model weights, total KV cache budget, and system/framework overhead."
        />
        <MetricCard
          label="Sustainable concurrency"
          value={`~${concurrency.recommendedSustainable}`}
          sub={`~${concurrency.theoreticalMaximum} theoretical max`}
          tone="success"
          icon={<Users className="h-3.5 w-3.5" />}
          tooltip="Recommended concurrent requests after applying the safety margin below the theoretical maximum."
        />
        <MetricCard
          label="Estimated tok/s"
          value={`${performance.estimatedTokensPerSecond}`}
          sub="Heuristic, not a benchmark"
          icon={<Zap className="h-3.5 w-3.5" />}
          tooltip="Estimated decode throughput from memory bandwidth, effective model size, quantization, context length, and multi-GPU scaling."
        />
        <MetricCard
          label="Latency / 100 tok"
          value={`${performance.latencyPer100TokensSec}s`}
          sub="Single-request estimate"
          icon={<Timer className="h-3.5 w-3.5" />}
          tooltip="Estimated wall-clock time to generate 100 tokens for a single request at the estimated throughput."
        />
        <MetricCard
          label="Multi-GPU scaling"
          value={`${multiGpu.throughputMultiplier}×`}
          sub={`${(multiGpu.scalingEfficiency * 100).toFixed(0)}% efficiency`}
          icon={<Gauge className="h-3.5 w-3.5" />}
          tooltip="Achieved throughput multiplier relative to one GPU — sub-linear due to interconnect/communication overhead."
        />
      </div>

      <WarningsPanel results={results} />

      <Card>
        <CardHeader>
          <CardTitle>VRAM allocation</CardTitle>
          <CardDescription>How total VRAM splits across model weights, KV cache, overhead, and free space.</CardDescription>
        </CardHeader>
        <CardContent>
          <VramAllocationChart allocation={vramTypical} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ContextConcurrencyChart state={state} />
        <ContextThroughputChart state={state} />
      </div>

      <CalculationBreakdown state={state} results={results} />
    </div>
  )
}
