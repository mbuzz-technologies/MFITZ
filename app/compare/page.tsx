/**
 * Side-by-side comparison: two GPUs against the same model, or two models
 * against the same GPU. Both tabs share the rest of the configuration
 * (quantization, context, concurrency) so the comparison isolates one
 * variable at a time.
 */

"use client"

import { useMemo, useState } from "react"

import { CalculatorState, QUANTIZATION_FORMATS } from "@/lib/types/calculator"
import { gpuDatabase, modelDatabase, contextPresets, defaultCalculatorState } from "@/lib/presets"
import { computeCalculatorResults, CalculatorResults } from "@/lib/calculations/engine"
import { formatGiB, formatParams } from "@/lib/utils"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/calculator/status-badge"

function ComparisonColumn({ title, results }: { title: string; results: CalculatorResults }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        <StatusBadge status={results.fitStatus.status} />
      </CardHeader>
      <CardContent className="space-y-2.5 text-sm">
        <Row label="Total VRAM" value={formatGiB(results.vramTypical.totalGiB)} />
        <Row label="Model memory" value={formatGiB(results.modelMemory.estimatedGiB)} />
        <Row label="KV cache / request" value={formatGiB(results.kvPerRequestTypical.typicalGiB)} />
        <Row label="Free VRAM" value={formatGiB(results.vramTypical.freeGiB)} tone={results.vramTypical.fits ? "success" : "destructive"} />
        <Row label="Sustainable concurrency" value={`~${results.concurrency.recommendedSustainable}`} />
        <Row label="Estimated tok/s" value={`${results.performance.estimatedTokensPerSecond}`} />
        <Row label="Latency / 100 tok" value={`${results.performance.latencyPer100TokensSec}s`} />
        <Row label="Multi-GPU scaling" value={`${results.multiGpu.throughputMultiplier}×`} />
      </CardContent>
    </Card>
  )
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "success" | "destructive" }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium tabular-nums ${tone === "success" ? "text-success" : tone === "destructive" ? "text-destructive" : ""}`}>{value}</span>
    </div>
  )
}

function SharedControls({
  model,
  setModel,
  quantization,
  setQuantization,
  contextTokens,
  setContextTokens,
  concurrentRequests,
  setConcurrentRequests,
  modelLabel = "Model",
}: {
  model?: string
  setModel?: (v: string) => void
  quantization: CalculatorState["quantization"]
  setQuantization: (v: CalculatorState["quantization"]) => void
  contextTokens: number
  setContextTokens: (v: number) => void
  concurrentRequests: number
  setConcurrentRequests: (v: number) => void
  modelLabel?: string
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {model !== undefined && setModel && (
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label>{modelLabel}</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(modelDatabase).map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-1.5">
        <Label>Quantization</Label>
        <Select value={quantization} onValueChange={(v) => setQuantization(v as CalculatorState["quantization"])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {QUANTIZATION_FORMATS.map((q) => (
              <SelectItem key={q} value={q}>
                {q}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Context</Label>
        <Select value={String(contextTokens)} onValueChange={(v) => setContextTokens(Number(v))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {contextPresets.map((p) => (
              <SelectItem key={p.label} value={String(p.tokens)}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Concurrency target</Label>
        <Select value={String(concurrentRequests)} onValueChange={(v) => setConcurrentRequests(Number(v))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 4, 8, 16, 32].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function GpuComparisonTab() {
  const [model, setModel] = useState("7b")
  const [quantization, setQuantization] = useState<CalculatorState["quantization"]>("INT4")
  const [contextTokens, setContextTokens] = useState(8_000)
  const [concurrentRequests, setConcurrentRequests] = useState(4)
  const [gpuA, setGpuA] = useState("rtx_4090")
  const [gpuB, setGpuB] = useState("a100_80gb")

  const shared = { model, quantization, contextTokens, concurrentRequests }

  const resultsA = useMemo(
    () => computeCalculatorResults({ ...defaultCalculatorState, ...shared, gpu: gpuA }),
    [gpuA, model, quantization, contextTokens, concurrentRequests]
  )
  const resultsB = useMemo(
    () => computeCalculatorResults({ ...defaultCalculatorState, ...shared, gpu: gpuB }),
    [gpuB, model, quantization, contextTokens, concurrentRequests]
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Shared workload</CardTitle>
          <CardDescription>Same model + quantization + context + concurrency target on both sides.</CardDescription>
        </CardHeader>
        <CardContent>
          <SharedControls
            model={model}
            setModel={setModel}
            quantization={quantization}
            setQuantization={setQuantization}
            contextTokens={contextTokens}
            setContextTokens={setContextTokens}
            concurrentRequests={concurrentRequests}
            setConcurrentRequests={setConcurrentRequests}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>GPU A</Label>
          <Select value={gpuA} onValueChange={setGpuA}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(gpuDatabase).map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ComparisonColumn title={resultsA.gpu.name} results={resultsA} />
        </div>
        <div className="space-y-2">
          <Label>GPU B</Label>
          <Select value={gpuB} onValueChange={setGpuB}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(gpuDatabase).map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ComparisonColumn title={resultsB.gpu.name} results={resultsB} />
        </div>
      </div>
    </div>
  )
}

function ModelComparisonTab() {
  const [gpu, setGpu] = useState("a100_80gb")
  const [quantization, setQuantization] = useState<CalculatorState["quantization"]>("INT4")
  const [contextTokens, setContextTokens] = useState(8_000)
  const [concurrentRequests, setConcurrentRequests] = useState(4)
  const [modelA, setModelA] = useState("7b")
  const [modelB, setModelB] = useState("mixtral-8x7b")

  const resultsA = useMemo(
    () => computeCalculatorResults({ ...defaultCalculatorState, gpu, quantization, contextTokens, concurrentRequests, model: modelA }),
    [gpu, quantization, contextTokens, concurrentRequests, modelA]
  )
  const resultsB = useMemo(
    () => computeCalculatorResults({ ...defaultCalculatorState, gpu, quantization, contextTokens, concurrentRequests, model: modelB }),
    [gpu, quantization, contextTokens, concurrentRequests, modelB]
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Shared workload</CardTitle>
          <CardDescription>Same GPU + quantization + context + concurrency target on both sides.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5 max-w-xs">
            <Label>GPU</Label>
            <Select value={gpu} onValueChange={setGpu}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(gpuDatabase).map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name} ({g.vramGiB} GiB)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <SharedControls
            quantization={quantization}
            setQuantization={setQuantization}
            contextTokens={contextTokens}
            setContextTokens={setContextTokens}
            concurrentRequests={concurrentRequests}
            setConcurrentRequests={setConcurrentRequests}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Model A</Label>
          <Select value={modelA} onValueChange={setModelA}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(modelDatabase).map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name} — {formatParams(m.parameters)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ComparisonColumn title={resultsA.model.name} results={resultsA} />
        </div>
        <div className="space-y-2">
          <Label>Model B</Label>
          <Select value={modelB} onValueChange={setModelB}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(modelDatabase).map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name} — {formatParams(m.parameters)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ComparisonColumn title={resultsB.model.name} results={resultsB} />
        </div>
      </div>
    </div>
  )
}

export default function ComparePage() {
  return (
    <main className="container py-8">
      <h1 className="text-xl font-bold tracking-tight">Compare</h1>
      <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
        Isolate one variable at a time — same workload, different hardware; or same hardware, different model.
      </p>

      <Tabs defaultValue="gpus" className="mt-5">
        <TabsList>
          <TabsTrigger value="gpus">GPU comparison</TabsTrigger>
          <TabsTrigger value="models">Model comparison</TabsTrigger>
        </TabsList>
        <TabsContent value="gpus">
          <GpuComparisonTab />
        </TabsContent>
        <TabsContent value="models">
          <ModelComparisonTab />
        </TabsContent>
      </Tabs>
    </main>
  )
}
